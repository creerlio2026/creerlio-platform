'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ParsedResume {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  headline: string;
  summary: string;
  linkedInUrl: string;
  gitHubUrl: string;
  portfolioUrl: string;
  workExperiences: Array<{
    jobTitle: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    description: string;
    achievements: string[];
    technologies: string[];
    employmentType: string;
  }>;
  educations: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa: string;
    honors: string[];
  }>;
  skills: Array<{
    name: string;
    category: string;
    yearsOfExperience?: number;
    proficiencyLevel?: number;
  }>;
  certifications: Array<{
    name: string;
    issuingOrganization: string;
    issueDate: string;
    expiryDate?: string;
    credentialId: string;
    credentialUrl: string;
  }>;
  awards: Array<{
    title: string;
    issuer: string;
    dateReceived: string;
    description: string;
  }>;
  confidenceScore: number;
  suggestedSections: string[];
  parsingWarnings: string[];
}

export default function ResumeUploadPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'text'>('file');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }

    // Validate file type
    const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a .txt, .pdf, or .docx file');
      return;
    }

    setUploading(true);
    setParsing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://creerlio-api.azurewebsites.net';
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/api/ResumeParsing/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse resume');
      }

      const data = await response.json();
      setParsedResume(data);
    } catch (err: any) {
      setError(err.message || 'Failed to upload and parse resume');
    } finally {
      setUploading(false);
      setParsing(false);
    }
  };

  const handleTextParse = async () => {
    if (!resumeText.trim()) {
      setError('Please paste your resume text');
      return;
    }

    if (resumeText.length > 50000) {
      setError('Resume text exceeds 50,000 character limit');
      return;
    }

    setParsing(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://creerlio-api.azurewebsites.net';
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/api/ResumeParsing/parse-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resumeText })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse resume');
      }

      const data = await response.json();
      setParsedResume(data);
    } catch (err: any) {
      setError(err.message || 'Failed to parse resume text');
    } finally {
      setParsing(false);
    }
  };

  const handleApplyParsedData = () => {
    // Save parsed data to localStorage for profile edit page to use
    if (parsedResume) {
      localStorage.setItem('parsedResumeData', JSON.stringify(parsedResume));
      router.push('/talent/profile/edit?from=resume');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-amber-600 hover:text-amber-700 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900">AI Resume Parser</h1>
          <p className="text-gray-600 mt-2">
            Upload your resume or paste the text, and our AI will automatically extract and populate your profile.
          </p>
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 font-medium">✨ Master Plan Feature</p>
            <p className="text-amber-700 text-sm mt-1">
              AI will pre-fill approximately 60-70% of your profile fields for you to review and confirm.
            </p>
          </div>
        </div>

        {!parsedResume ? (
          <>
            {/* Upload Method Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setUploadMethod('file')}
                  className={`px-6 py-3 rounded-lg font-medium transition ${
                    uploadMethod === 'file'
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📄 Upload File
                </button>
                <button
                  onClick={() => setUploadMethod('text')}
                  className={`px-6 py-3 rounded-lg font-medium transition ${
                    uploadMethod === 'text'
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📝 Paste Text
                </button>
              </div>

              {uploadMethod === 'file' && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-amber-500 transition">
                  <input
                    type="file"
                    id="resume-upload"
                    accept=".txt,.pdf,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <div className="text-6xl mb-4">📤</div>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      {uploading ? 'Uploading...' : 'Click to upload your resume'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Supported formats: .txt, .pdf (coming soon), .docx (coming soon)
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Max file size: 10MB</p>
                  </label>
                </div>
              )}

              {uploadMethod === 'text' && (
                <div>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your resume text here..."
                    className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    disabled={parsing}
                  />
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-500">
                      {resumeText.length} / 50,000 characters
                    </p>
                    <button
                      onClick={handleTextParse}
                      disabled={parsing || !resumeText.trim()}
                      className="px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {parsing ? 'Parsing...' : 'Parse Resume'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Parsing Status */}
            {parsing && (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4"></div>
                <p className="text-lg font-medium text-gray-900">Analyzing your resume with AI...</p>
                <p className="text-gray-600 mt-2">This may take 10-30 seconds</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-medium">❌ Error</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            )}
          </>
        ) : (
          /* Parsed Results */
          <div className="space-y-6">
            {/* Confidence Score */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Parsing Complete! ✨</h2>
                  <p className="text-gray-600 mt-1">Review the extracted data below and apply it to your profile.</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Confidence Score</p>
                  <p className="text-3xl font-bold text-amber-600">{parsedResume.confidenceScore}%</p>
                </div>
              </div>

              {parsedResume.parsingWarnings.length > 0 && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="font-medium text-yellow-800">⚠️ Parsing Warnings:</p>
                  <ul className="list-disc list-inside text-sm text-yellow-700 mt-2">
                    {parsedResume.parsingWarnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {parsedResume.suggestedSections.length > 0 && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-medium text-blue-800">💡 Suggested Additions:</p>
                  <ul className="list-disc list-inside text-sm text-blue-700 mt-2">
                    {parsedResume.suggestedSections.map((section, i) => (
                      <li key={i}>{section}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{parsedResume.firstName} {parsedResume.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{parsedResume.email || 'Not found'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{parsedResume.phone || 'Not found'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">
                    {[parsedResume.city, parsedResume.state, parsedResume.country].filter(Boolean).join(', ') || 'Not found'}
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Summary */}
            {parsedResume.headline && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Professional Summary</h3>
                <p className="text-lg font-medium text-gray-800 mb-2">{parsedResume.headline}</p>
                {parsedResume.summary && <p className="text-gray-600">{parsedResume.summary}</p>}
              </div>
            )}

            {/* Work Experience */}
            {parsedResume.workExperiences.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Work Experience ({parsedResume.workExperiences.length})
                </h3>
                <div className="space-y-4">
                  {parsedResume.workExperiences.map((exp, i) => (
                    <div key={i} className="border-l-4 border-amber-500 pl-4">
                      <p className="font-bold text-gray-900">{exp.jobTitle}</p>
                      <p className="text-gray-700">{exp.company} • {exp.location}</p>
                      <p className="text-sm text-gray-600">
                        {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}
                      </p>
                      {exp.achievements.length > 0 && (
                        <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                          {exp.achievements.slice(0, 3).map((achievement, j) => (
                            <li key={j}>{achievement}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {parsedResume.educations.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Education ({parsedResume.educations.length})
                </h3>
                <div className="space-y-4">
                  {parsedResume.educations.map((edu, i) => (
                    <div key={i} className="border-l-4 border-blue-500 pl-4">
                      <p className="font-bold text-gray-900">{edu.degree} in {edu.field}</p>
                      <p className="text-gray-700">{edu.institution}</p>
                      <p className="text-sm text-gray-600">
                        {edu.startDate} - {edu.endDate}
                        {edu.gpa && ` • GPA: ${edu.gpa}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {parsedResume.skills.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Skills ({parsedResume.skills.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {parsedResume.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                    >
                      {skill.name}
                      {skill.yearsOfExperience && ` (${skill.yearsOfExperience}y)`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {parsedResume.certifications.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Certifications ({parsedResume.certifications.length})
                </h3>
                <div className="space-y-3">
                  {parsedResume.certifications.map((cert, i) => (
                    <div key={i}>
                      <p className="font-medium text-gray-900">{cert.name}</p>
                      <p className="text-sm text-gray-600">
                        {cert.issuingOrganization} • {cert.issueDate}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setParsedResume(null)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
              >
                Parse Another Resume
              </button>
              <button
                onClick={handleApplyParsedData}
                className="px-8 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700"
              >
                Apply to My Profile →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
