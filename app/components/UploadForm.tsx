'use client';

import React, { useState } from 'react';

type UploadResult = {
  finalScore?: number;
  readinessLevel?: string;
  requiredSkillScore?: number;
  preferredSkillScore?: number;
  experienceScore?: number;
  experienceAlignmentScore?: number;
  impactScore?: number;
  professionalScore?: number;
  missingRequiredSkills?: string[];
  missingPreferredSkills?: string[];
  roadmapRecommendations?: string[];
  aiInsights?: any;
  error?: string;
  atsScore?: number;
  missingSkills?: string[];
  improvements?: string[];
  interviewQuestions?: string[];
  improvedResumeSuggestion?: string;
};

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!file) {
      setError('Please choose a PDF resume.');
      return;
    }

    const form = new FormData();
    form.append('file', file);
    form.append('jobDescription', jobDescription);

    setLoading(true);
    try {
      const res = await fetch('/api/resume/upload', {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Upload failed');
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit} className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Resume (PDF only)</span>
          <input
            type="file"
            accept="application/pdf"
            onChange={onFileChange}
            className="rounded border p-2"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Job Description</span>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={6}
            placeholder="Paste the JD here…"
            className="rounded border p-2"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-60 dark:bg-white dark:text-black"
        >
          {loading ? 'Uploading…' : 'Upload & Analyze'}
        </button>
      </form>

      {error && <div className="text-red-600">Error: {error}</div>}

      {result && (
        <div className="rounded border p-4">
          <h3 className="mb-2 text-lg font-semibold">Analysis</h3>
          {'error' in result && result.error ? (
            <div className="text-red-600">{result.error}</div>
          ) : (
            <div className="grid gap-2 text-sm">
              <div>
                <span className="font-medium">Final Score:</span>{' '}
                {result.finalScore ?? '—'} ({result.readinessLevel ?? '—'})
              </div>
              <div>
                <span className="font-medium">ATS Score:</span>{' '}
                {result.atsScore ?? result.finalScore ?? '—'}
              </div>
              <div>
                <span className="font-medium">Missing Required Skills:</span>{' '}
                {result.missingRequiredSkills?.join(', ') || '—'}
              </div>
              <div>
                <span className="font-medium">Missing Preferred Skills:</span>{' '}
                {result.missingPreferredSkills?.join(', ') || '—'}
              </div>
              <div>
                <span className="font-medium">Missing Skills:</span>{' '}
                {result.missingSkills?.join(', ') || '—'}
              </div>
              <div>
                <span className="font-medium">Roadmap Recommendations:</span>{' '}
                {result.roadmapRecommendations?.join(', ') || '—'}
              </div>
              <div>
                <span className="font-medium">Scope of Improvement:</span>
                <ul className="list-disc pl-5">
                  {(result.improvements && result.improvements.length > 0
                    ? result.improvements
                    : result.aiInsights?.immediateActionChecklist || []
                  ).map((it: string, idx: number) => (
                    <li key={idx}>{it}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="font-medium">Interview Questions:</span>
                <ul className="list-disc pl-5">
                  {(result.interviewQuestions && result.interviewQuestions.length > 0
                    ? result.interviewQuestions
                    : [
                        ...(result.aiInsights?.interviewQuestions?.technicalQuestions || []),
                        ...(result.aiInsights?.interviewQuestions?.behavioralQuestions || []),
                        ...(result.aiInsights?.interviewQuestions?.projectBasedQuestions || []),
                      ]
                  ).map((q: string, idx: number) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="font-medium">Improved Resume Suggestion:</span>
                <p>{result.improvedResumeSuggestion || result.aiInsights?.professionalSummarySuggestion || '—'}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
