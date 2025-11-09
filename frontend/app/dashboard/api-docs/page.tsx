'use client';

import { useState } from 'react';
import { Copy, Check, Code, BookOpen, Key } from 'lucide-react';

export default function ApiDocsPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('curl');

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const examples = {
    curl: {
      authentication: `curl -X POST https://backend.visaeval.live/api/evaluations \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: multipart/form-data" \\
  -F "country=USA" \\
  -F "visaType=H1B" \\
  -F "documents=@/path/to/resume.pdf"`,
      getEvaluations: `curl -X GET https://backend.visaeval.live/api/evaluations \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      getEvaluationById: `curl -X GET https://backend.visaeval.live/api/evaluations/{evaluationId} \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    },
    javascript: {
      authentication: `const formData = new FormData();
formData.append('country', 'USA');
formData.append('visaType', 'H1B');
formData.append('documents', fileInput.files[0]);

const response = await fetch('https://backend.visaeval.live/api/evaluations', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: formData
});

const data = await response.json();
console.log(data);`,
      getEvaluations: `const response = await fetch('https://backend.visaeval.live/api/evaluations', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});

const data = await response.json();
console.log(data.data.evaluations);`,
      getEvaluationById: `const evaluationId = 'YOUR_EVALUATION_ID';
const response = await fetch(\`https://backend.visaeval.live/api/evaluations/\${evaluationId}\`, {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});

const data = await response.json();
console.log(data.data);`,
    },
    python: {
      authentication: `import requests

url = "https://backend.visaeval.live/api/evaluations"
headers = {
    "Authorization": "Bearer YOUR_API_KEY"
}
files = {
    'documents': open('/path/to/resume.pdf', 'rb')
}
data = {
    'country': 'USA',
    'visaType': 'H1B'
}

response = requests.post(url, headers=headers, files=files, data=data)
print(response.json())`,
      getEvaluations: `import requests

url = "https://backend.visaeval.live/api/evaluations"
headers = {
    "Authorization": "Bearer YOUR_API_KEY"
}

response = requests.get(url, headers=headers)
print(response.json())`,
      getEvaluationById: `import requests

evaluation_id = "YOUR_EVALUATION_ID"
url = f"https://backend.visaeval.live/api/evaluations/{evaluation_id}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY"
}

response = requests.get(url, headers=headers)
print(response.json())`,
    },
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-8 h-8 text-[var(--primary)]" />
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">API Documentation</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Learn how to integrate VisaEval API into your application</p>
        </div>
      </div>

      {/* Getting Started */}
      <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
        <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <Key className="w-6 h-6 text-[var(--primary)]" />
          Getting Started
        </h2>
        <div className="space-y-4 text-[var(--muted-foreground)]">
          <p>
            Welcome to the VisaEval API! Our API allows you to programmatically evaluate visa applications,
            analyze documents, and get instant eligibility reports.
          </p>
          <div className="bg-[var(--muted)] rounded-lg p-4 border-l-4 border-[var(--primary)]">
            <p className="font-semibold text-[var(--foreground)] mb-2">Base URL</p>
            <code className="text-sm font-mono text-[var(--primary)]">https://backend.visaeval.live</code>
          </div>
        </div>
      </section>

      {/* Authentication */}
      <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
        <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">Authentication</h2>
        <p className="text-[var(--muted-foreground)] mb-4">
          All API requests require authentication using your API key. Include your API key in the
          <code className="mx-1 px-2 py-1 bg-[var(--muted)] rounded text-sm">Authorization</code> header:
        </p>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
          <pre className="text-sm overflow-x-auto">
            <code className="text-[var(--foreground)]">Authorization: Bearer YOUR_API_KEY</code>
          </pre>
        </div>
        <p className="text-sm text-[var(--muted-foreground)] mt-3">
          You can manage your API keys in the <a href="/dashboard/api-keys" className="text-[var(--primary)] hover:underline">API Keys</a> section.
        </p>
      </section>

      {/* Language Selector */}
      <div className="flex gap-2">
        {['curl', 'javascript', 'python'].map((lang) => (
          <button
            key={lang}
            onClick={() => setSelectedLanguage(lang)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedLanguage === lang
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80'
            }`}
          >
            {lang === 'curl' ? 'cURL' : lang.charAt(0).toUpperCase() + lang.slice(1)}
          </button>
        ))}
      </div>

      {/* Endpoints */}
      <section className="space-y-6">
        {/* Create Evaluation */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-[var(--foreground)]">Create Evaluation</h3>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Upload documents and create a new visa evaluation</p>
            </div>
            <span className="px-3 py-1 bg-[var(--success)] text-[var(--success-foreground)] rounded-full text-sm font-medium">
              POST
            </span>
          </div>

          <div className="mb-4">
            <p className="text-sm text-[var(--muted-foreground)] mb-2">Endpoint</p>
            <code className="px-3 py-2 bg-[var(--muted)] text-[var(--foreground)] rounded text-sm block">
              /api/evaluations
            </code>
          </div>

          <div className="mb-4">
            <p className="text-sm font-semibold text-[var(--foreground)] mb-2">Request Body (multipart/form-data)</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 text-[var(--foreground)]">Parameter</th>
                  <th className="text-left py-2 text-[var(--foreground)]">Type</th>
                  <th className="text-left py-2 text-[var(--foreground)]">Required</th>
                  <th className="text-left py-2 text-[var(--foreground)]">Description</th>
                </tr>
              </thead>
              <tbody className="text-[var(--muted-foreground)]">
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 font-mono">country</td>
                  <td className="py-2">string</td>
                  <td className="py-2">Yes</td>
                  <td className="py-2">Target country (e.g., "USA", "UK", "Canada")</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 font-mono">visaType</td>
                  <td className="py-2">string</td>
                  <td className="py-2">Yes</td>
                  <td className="py-2">Visa type code (e.g., "H1B", "F1", "Skilled")</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono">documents</td>
                  <td className="py-2">file[]</td>
                  <td className="py-2">Yes</td>
                  <td className="py-2">Document files (PDF, DOC, DOCX)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-[var(--foreground)]">Example Request</p>
              <button
                onClick={() => copyToClipboard(examples[selectedLanguage as keyof typeof examples].authentication, 0)}
                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] transition-colors"
              >
                {copiedIndex === 0 ? (
                  <>
                    <Check className="w-4 h-4 text-[var(--success)]" />
                    <span className="text-sm">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm">
                <code className="text-[var(--foreground)]">{examples[selectedLanguage as keyof typeof examples].authentication}</code>
              </pre>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-[var(--foreground)] mb-2">Response</p>
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm">
                <code className="text-[var(--foreground)]">{`{
  "success": true,
  "message": "Evaluation created successfully",
  "data": {
    "evaluationId": "507f1f77bcf86cd799439011",
    "status": "completed",
    "country": "USA",
    "visaType": "H1B",
    "documentsUploaded": 3,
    "result": {
      "score": 75,
      "summary": "Your profile shows strong qualifications...",
      "strengths": [...],
      "weaknesses": [...],
      "suggestions": [...]
    }
  }
}`}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Get All Evaluations */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-[var(--foreground)]">Get All Evaluations</h3>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Retrieve all your evaluations</p>
            </div>
            <span className="px-3 py-1 bg-[var(--info)] text-[var(--info-foreground)] rounded-full text-sm font-medium">
              GET
            </span>
          </div>

          <div className="mb-4">
            <p className="text-sm text-[var(--muted-foreground)] mb-2">Endpoint</p>
            <code className="px-3 py-2 bg-[var(--muted)] text-[var(--foreground)] rounded text-sm block">
              /api/evaluations
            </code>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-[var(--foreground)]">Example Request</p>
              <button
                onClick={() => copyToClipboard(examples[selectedLanguage as keyof typeof examples].getEvaluations, 1)}
                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] transition-colors"
              >
                {copiedIndex === 1 ? (
                  <>
                    <Check className="w-4 h-4 text-[var(--success)]" />
                    <span className="text-sm">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm">
                <code className="text-[var(--foreground)]">{examples[selectedLanguage as keyof typeof examples].getEvaluations}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Get Evaluation by ID */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-[var(--foreground)]">Get Evaluation by ID</h3>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Retrieve a specific evaluation by its ID</p>
            </div>
            <span className="px-3 py-1 bg-[var(--info)] text-[var(--info-foreground)] rounded-full text-sm font-medium">
              GET
            </span>
          </div>

          <div className="mb-4">
            <p className="text-sm text-[var(--muted-foreground)] mb-2">Endpoint</p>
            <code className="px-3 py-2 bg-[var(--muted)] text-[var(--foreground)] rounded text-sm block">
              /api/evaluations/:id
            </code>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-[var(--foreground)]">Example Request</p>
              <button
                onClick={() => copyToClipboard(examples[selectedLanguage as keyof typeof examples].getEvaluationById, 2)}
                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] transition-colors"
              >
                {copiedIndex === 2 ? (
                  <>
                    <Check className="w-4 h-4 text-[var(--success)]" />
                    <span className="text-sm">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm">
                <code className="text-[var(--foreground)]">{examples[selectedLanguage as keyof typeof examples].getEvaluationById}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Rate Limits */}
      <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
        <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">Rate Limits</h2>
        <div className="space-y-3 text-[var(--muted-foreground)]">
          <p>API rate limits vary by plan:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong className="text-[var(--foreground)]">Free Plan:</strong> 5 evaluations per month</li>
            <li><strong className="text-[var(--foreground)]">Starter Plan:</strong> 50 evaluations per month</li>
            <li><strong className="text-[var(--foreground)]">Professional Plan:</strong> 200 evaluations per month</li>
            <li><strong className="text-[var(--foreground)]">Enterprise Plan:</strong> Unlimited evaluations</li>
          </ul>
          <p className="mt-4">
            Rate limit headers are included in all API responses:
          </p>
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 mt-2">
            <pre className="text-sm">
              <code className="text-[var(--foreground)]">{`X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Error Codes */}
      <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
        <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">Error Codes</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-2 text-[var(--foreground)]">Code</th>
              <th className="text-left py-2 text-[var(--foreground)]">Description</th>
            </tr>
          </thead>
          <tbody className="text-[var(--muted-foreground)]">
            <tr className="border-b border-[var(--border)]">
              <td className="py-2 font-mono">200</td>
              <td className="py-2">Success</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="py-2 font-mono">400</td>
              <td className="py-2">Bad Request - Invalid parameters</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="py-2 font-mono">401</td>
              <td className="py-2">Unauthorized - Invalid or missing API key</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="py-2 font-mono">403</td>
              <td className="py-2">Forbidden - API key lacks required permissions</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="py-2 font-mono">404</td>
              <td className="py-2">Not Found - Resource doesn't exist</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="py-2 font-mono">429</td>
              <td className="py-2">Too Many Requests - Rate limit exceeded</td>
            </tr>
            <tr>
              <td className="py-2 font-mono">500</td>
              <td className="py-2">Internal Server Error</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Support */}
      <section className="bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl p-6">
        <h2 className="text-2xl font-semibold mb-2">Need Help?</h2>
        <p className="mb-4 opacity-90">
          If you have questions or need assistance with the API, we're here to help!
        </p>
        <a
          href="mailto:support@visaeval.com"
          className="inline-block bg-[var(--background)] text-[var(--foreground)] px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Contact Support
        </a>
      </section>
    </div>
  );
}
