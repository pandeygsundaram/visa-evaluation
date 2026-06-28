import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { withApiKeyOrAuth } from '@/lib/auth';
import { VISA_CONFIG } from '@/lib/config/visaData';
import { uploadToR2, validateR2Config, generateSignedUrlsForDocuments } from '@/lib/utils/r2Storage';
import { extractDocumentText, getFileExtension, isSupportedFileType } from '@/lib/utils/documentExtractor';
import { analyzeDocument, validateOpenAIConfig } from '@/lib/services/openaiService';

export const runtime = 'nodejs';

/** GET /api/evaluations — list user's evaluations */
export const GET = withApiKeyOrAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const country = searchParams.get('country');
  const visaType = searchParams.get('visaType');
  const limit = Math.min(Number(searchParams.get('limit') || 20), 100);
  const skip = Number(searchParams.get('skip') || 0);

  const db = getDb();

  let query = 'SELECT * FROM evaluations WHERE user_id = ?';
  const args: any[] = [userId];

  if (status) { query += ' AND status = ?'; args.push(status); }
  if (country) { query += ' AND country = ?'; args.push(country); }
  if (visaType) { query += ' AND visa_type = ?'; args.push(visaType); }

  const countRow = db.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as cnt')).get(...args) as { cnt: number };
  const rows = db.prepare(`${query} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...args, limit, skip) as any[];

  const evaluations = rows.map((r) => ({
    ...r,
    documents: JSON.parse(r.documents || '[]'),
    evaluationResult: r.evaluation_result ? JSON.parse(r.evaluation_result) : null,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
    processedAt: r.processed_at ? new Date(r.processed_at) : null,
  }));

  return NextResponse.json({
    success: true,
    data: {
      evaluations,
      pagination: {
        total: countRow.cnt,
        limit,
        skip,
        hasMore: countRow.cnt > skip + rows.length,
      },
    },
  });
});

/** POST /api/evaluations — create evaluation with document upload */
export const POST = withApiKeyOrAuth(async (req, { userId }) => {
  const formData = await req.formData();
  const country = formData.get('country') as string;
  const visaCode = formData.get('visaType') as string;
  const files = formData.getAll('files') as File[];

  if (!country || !visaCode) {
    return NextResponse.json(
      { success: false, message: 'Country and visa type are required' },
      { status: 400 }
    );
  }

  if (!files || files.length === 0) {
    return NextResponse.json(
      { success: false, message: 'At least one document is required' },
      { status: 400 }
    );
  }

  const countryData = VISA_CONFIG.find((c) => c.code.toLowerCase() === country.toLowerCase());
  const visaTypeConfig = countryData?.visaTypes.find((v) => v.code.toLowerCase() === visaCode.toLowerCase());

  if (!visaTypeConfig) {
    return NextResponse.json(
      { success: false, message: `Visa type ${visaCode} not found for country ${country}` },
      { status: 404 }
    );
  }

  if (!validateR2Config()) {
    return NextResponse.json(
      { success: false, message: 'Storage not configured. Contact administrator.' },
      { status: 500 }
    );
  }

  if (!validateOpenAIConfig()) {
    return NextResponse.json(
      { success: false, message: 'AI service not configured. Contact administrator.' },
      { status: 500 }
    );
  }

  // Check subscription quota
  const db = getDb();
  const now = Date.now();

  const activeSub = db
    .prepare(
      `SELECT s.*, p.call_limit FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = ? AND s.status = 'active' AND s.current_period_end >= ?`
    )
    .get(userId, now) as any;

  if (activeSub) {
    if (activeSub.calls_used >= activeSub.call_limit) {
      return NextResponse.json(
        {
          success: false,
          message: `Evaluation limit reached (${activeSub.call_limit}/period). Please upgrade.`,
          code: 'QUOTA_EXCEEDED',
          data: { usage: { used: activeSub.calls_used, limit: activeSub.call_limit, remaining: 0 } },
        },
        { status: 402 }
      );
    }
  } else {
    // Free plan: 2 evaluations per calendar month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const freePlan = db
      .prepare("SELECT call_limit FROM plans WHERE tier = 'free' AND is_active = 1 LIMIT 1")
      .get() as { call_limit: number } | undefined;
    const freeLimit = freePlan?.call_limit ?? 2;

    const monthCount = (
      db
        .prepare(
          'SELECT COUNT(*) as cnt FROM evaluations WHERE user_id = ? AND created_at >= ?'
        )
        .get(userId, startOfMonth.getTime()) as { cnt: number }
    ).cnt;

    if (monthCount >= freeLimit) {
      return NextResponse.json(
        {
          success: false,
          message: `Free plan limit reached (${freeLimit}/month). Please upgrade.`,
          code: 'QUOTA_EXCEEDED',
          data: { usage: { used: monthCount, limit: freeLimit, remaining: 0 } },
        },
        { status: 402 }
      );
    }
  }

  const evalId = uuidv4();
  const documents: any[] = [];
  const allDocumentTexts: string[] = [];

  // Process uploaded files
  for (const file of files) {
    if (!isSupportedFileType(file.type)) {
      return NextResponse.json(
        { success: false, message: `Unsupported file type: ${file.type}. Supported: PDF, DOC, DOCX` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = getFileExtension(file.type);

    const extracted = await extractDocumentText(buffer, ext, file.name);
    allDocumentTexts.push(extracted.text);

    const uploaded = await uploadToR2(buffer, file.name, file.type, userId);
    documents.push({
      type: formData.get(`documentType_${file.name}`) || 'general',
      r2Key: uploaded.key,
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
    });
  }

  // Insert evaluation record (status: processing)
  db.prepare(
    `INSERT INTO evaluations (id, user_id, country, visa_type, status, documents, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'processing', ?, ?, ?)`
  ).run(evalId, userId, country, visaCode, JSON.stringify(documents), now, now);

  // Run AI analysis
  const combinedText = allDocumentTexts.join('\n\n=== NEXT DOCUMENT ===\n\n');
  let finalStatus = 'failed';
  let evaluationResult: any = null;

  try {
    const analysis = await analyzeDocument(combinedText, {
      documentText: combinedText,
      visaType: visaTypeConfig,
      countryName: country,
    });

    evaluationResult = {
      isMalicious: analysis.isMalicious,
      maliciousReason: analysis.maliciousReason,
      score: analysis.score,
      summary: analysis.summary,
      checkpoints: analysis.checkpoints,
      suggestions: analysis.suggestions,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      rawAnalysis: analysis.rawResponse,
    };
    finalStatus = analysis.isMalicious ? 'failed' : 'completed';

    // Increment subscription usage
    if (activeSub) {
      db.prepare('UPDATE subscriptions SET calls_used = calls_used + 1, updated_at = ? WHERE id = ?').run(
        Date.now(),
        activeSub.id
      );
    }
  } catch (err: any) {
    console.error('Analysis failed:', err);
    evaluationResult = { isMalicious: false, score: 0, summary: `Analysis failed: ${err.message}` };
  }

  const processedAt = Date.now();
  db.prepare(
    `UPDATE evaluations SET status = ?, evaluation_result = ?, processed_at = ?, updated_at = ? WHERE id = ?`
  ).run(finalStatus, JSON.stringify(evaluationResult), processedAt, processedAt, evalId);

  const documentsWithUrls = await generateSignedUrlsForDocuments(documents, 3600);

  return NextResponse.json(
    {
      success: true,
      message: 'Evaluation created successfully',
      data: {
        evaluationId: evalId,
        status: finalStatus,
        country,
        visaType: visaCode,
        documentsUploaded: documents.length,
        documents: documentsWithUrls,
        result: evaluationResult,
        createdAt: new Date(now),
        processedAt: new Date(processedAt),
      },
    },
    { status: 201 }
  );
});
