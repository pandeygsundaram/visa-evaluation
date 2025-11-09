import { Request, Response } from 'express';
import Evaluation from '../models/Evaluation';
import { getVisaType } from '../config/visaData';
import { uploadToR2, validateR2Config, generateSignedUrlsForDocuments } from '../utils/r2Storage';
import { extractDocumentText, getFileExtension, isSupportedFileType } from '../utils/documentExtractor';
import { analyzeDocument, validateOpenAIConfig } from '../services/openaiService';

/**
 * Create a new evaluation with document upload
 * POST /api/evaluations
 */
export const createEvaluation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { country, visaType: visaCode } = req.body;
    const userId = (req as any).user.id; // From auth middleware
    const files = req.files as Express.Multer.File[];

    // Validation
    if (!country || !visaCode) {
      res.status(400).json({
        success: false,
        message: 'Country and visa type are required'
      });
      return;
    }

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'At least one document is required'
      });
      return;
    }

    // Validate visa type exists
    const visaTypeConfig = getVisaType(country, visaCode);
    if (!visaTypeConfig) {
      res.status(404).json({
        success: false,
        message: `Visa type ${visaCode} not found for country ${country}`
      });
      return;
    }

    // Validate configuration
    if (!validateR2Config()) {
      res.status(500).json({
        success: false,
        message: 'R2 storage is not properly configured. Please contact administrator.'
      });
      return;
    }

    if (!validateOpenAIConfig()) {
      res.status(500).json({
        success: false,
        message: 'OpenAI is not properly configured. Please contact administrator.'
      });
      return;
    }

    console.log(`📋 Creating evaluation for user ${userId}: ${country} - ${visaCode}`);
    console.log(`📎 Processing ${files.length} document(s)`);

    // Create evaluation record
    const evaluation = new Evaluation({
      userId,
      country,
      visaType: visaCode,
      status: 'processing',
      documents: []
    });

    // Process and upload documents
    let allDocumentTexts: string[] = [];

    for (const file of files) {
      try {
        // Validate file type
        if (!isSupportedFileType(file.mimetype)) {
          res.status(400).json({
            success: false,
            message: `Unsupported file type: ${file.mimetype}. Supported: PDF, DOC, DOCX`
          });
          return;
        }

        console.log(`📄 Processing file: ${file.originalname}`);

        // Extract text from document
        const fileExtension = getFileExtension(file.mimetype);
        const extractedDoc = await extractDocumentText(
          file.buffer,
          fileExtension,
          file.originalname
        );

        allDocumentTexts.push(extractedDoc.text);

        console.log(`✅ Extracted ${extractedDoc.metadata?.wordCount} words from ${file.originalname}`);

        // Upload to R2
        const uploadResult = await uploadToR2(
          file.buffer,
          file.originalname,
          file.mimetype,
          userId
        );

        console.log(`☁️  Uploaded to R2: ${uploadResult.key}`);

        // Add document to evaluation
        // Note: URL will be generated as signed URL on-demand when fetching evaluation
        evaluation.documents.push({
          type: req.body[`documentType_${file.fieldname}`] || 'general',
          r2Key: uploadResult.key,
          fileName: file.originalname,
          uploadedAt: new Date()
        } as any);
      } catch (error: any) {
        console.error(`❌ Error processing file ${file.originalname}:`, error);
        res.status(500).json({
          success: false,
          message: `Failed to process file ${file.originalname}: ${error.message}`
        });
        return;
      }
    }

    // Save evaluation with uploaded documents
    await evaluation.save();
    console.log(`💾 Saved evaluation: ${evaluation._id}`);

    // Combine all document texts for analysis
    const combinedText = allDocumentTexts.join('\n\n=== NEXT DOCUMENT ===\n\n');

    console.log(`🤖 Starting LLM analysis...`);

    // Analyze documents with OpenAI
    try {
      const analysisResult = await analyzeDocument(combinedText, {
        documentText: combinedText,
        visaType: visaTypeConfig,
        countryName: country
      });

      console.log(`✅ Analysis complete. Malicious: ${analysisResult.isMalicious}, Score: ${analysisResult.score}`);

      // Update evaluation with results
      evaluation.evaluationResult = {
        isMalicious: analysisResult.isMalicious,
        maliciousReason: analysisResult.maliciousReason,
        score: analysisResult.score,
        summary: analysisResult.summary,
        checkpoints: analysisResult.checkpoints,
        suggestions: analysisResult.suggestions,
        strengths: analysisResult.strengths,
        weaknesses: analysisResult.weaknesses,
        rawAnalysis: analysisResult.rawResponse
      };

      evaluation.status = analysisResult.isMalicious ? 'failed' : 'completed';
      evaluation.processedAt = new Date();

      await evaluation.save();

      console.log(`✅ Evaluation completed: ${evaluation._id}`);

      // Generate signed URLs for documents (valid for 1 hour)
      const documentsWithSignedUrls = await generateSignedUrlsForDocuments(
        evaluation.documents.map(doc => ({
          type: doc.type,
          fileName: doc.fileName,
          r2Key: doc.r2Key,
          uploadedAt: doc.uploadedAt
        })),
        3600 // 1 hour expiration
      );

      // Return response
      res.status(201).json({
        success: true,
        message: 'Evaluation created successfully',
        data: {
          evaluationId: evaluation._id,
          status: evaluation.status,
          country: evaluation.country,
          visaType: evaluation.visaType,
          documentsUploaded: evaluation.documents.length,
          documents: documentsWithSignedUrls, // Include documents with signed URLs
          result: {
            isMalicious: evaluation.evaluationResult.isMalicious,
            maliciousReason: evaluation.evaluationResult.maliciousReason,
            score: evaluation.evaluationResult.score,
            summary: evaluation.evaluationResult.summary,
            checkpoints: evaluation.evaluationResult.checkpoints,
            strengths: evaluation.evaluationResult.strengths,
            weaknesses: evaluation.evaluationResult.weaknesses,
            suggestions: evaluation.evaluationResult.suggestions
          },
          createdAt: evaluation.createdAt,
          processedAt: evaluation.processedAt
        }
      });
    } catch (error: any) {
      console.error('❌ Analysis failed:', error);

      // Update evaluation as failed
      evaluation.status = 'failed';
      evaluation.evaluationResult = {
        isMalicious: false,
        score: 0,
        summary: `Analysis failed: ${error.message}`
      };
      await evaluation.save();

      res.status(500).json({
        success: false,
        message: `Document analysis failed: ${error.message}`,
        evaluationId: evaluation._id
      });
    }
  } catch (error: any) {
    console.error('❌ Evaluation creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create evaluation'
    });
  }
};

/**
 * Get user's evaluations
 * GET /api/evaluations
 */
export const getUserEvaluations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { status, country, visaType, limit = 20, skip = 0 } = req.query;

    const query: any = { userId };

    if (status) query.status = status;
    if (country) query.country = country;
    if (visaType) query.visaType = visaType;

    const evaluations = await Evaluation.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .select('-evaluationResult.rawAnalysis'); // Exclude raw analysis from list

    const total = await Evaluation.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        evaluations,
        pagination: {
          total,
          limit: Number(limit),
          skip: Number(skip),
          hasMore: total > Number(skip) + evaluations.length
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch evaluations'
    });
  }
};

/**
 * Get evaluation by ID
 * GET /api/evaluations/:id
 */
export const getEvaluationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const evaluation = await Evaluation.findOne({ _id: id, userId });

    if (!evaluation) {
      res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
      return;
    }

    // Generate signed URLs for documents (valid for 1 hour)
    const documentsWithSignedUrls = await generateSignedUrlsForDocuments(
      evaluation.documents.map(doc => ({
        type: doc.type,
        fileName: doc.fileName,
        r2Key: doc.r2Key,
        uploadedAt: doc.uploadedAt
      })),
      3600 // 1 hour expiration
    );

    // Return evaluation with signed URLs
    const evaluationData = evaluation.toObject();

    res.status(200).json({
      success: true,
      data: {
        ...evaluationData,
        documents: documentsWithSignedUrls
      }
    });
  } catch (error: any) {
    console.error('Error fetching evaluation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch evaluation'
    });
  }
};

/**
 * Delete evaluation
 * DELETE /api/evaluations/:id
 */
export const deleteEvaluation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const evaluation = await Evaluation.findOne({ _id: id, userId });

    if (!evaluation) {
      res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
      return;
    }

    // TODO: Delete documents from R2 storage
    // for (const doc of evaluation.documents) {
    //   await deleteFromR2(doc.r2Key);
    // }

    await evaluation.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Evaluation deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting evaluation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete evaluation'
    });
  }
};
