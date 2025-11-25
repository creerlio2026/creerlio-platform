'use client';

import { useEffect, useState } from 'react';

interface VerificationReport {
  talentProfileId: string;
  generatedAt: string;
  overallScore: number;
  verificationLevel: string;
  educationVerifications: VerificationResult[];
  employmentVerifications: VerificationResult[];
  certificationVerifications: VerificationResult[];
  timelineConsistency: TimelineConsistency;
  totalCredentials: number;
  verifiedCredentials: number;
  partiallyVerifiedCredentials: number;
  unverifiedCredentials: number;
  warnings: string[];
  concerns: string[];
  hasTimelineGaps: boolean;
  hasOverlappingExperiences: boolean;
}

interface VerificationResult {
  id: string;
  type: string;
  itemName: string;
  confidenceScore: number;
  status: string;
  verificationSources: string[];
  verifiedAt: string;
  matchedDataPoints: string[];
  mismatchedDataPoints: string[];
  missingDataPoints: string[];
  explanation: string;
  recommendedActions: string[];
}

interface TimelineConsistency {
  isConsistent: boolean;
  consistencyScore: number;
  issues: TimelineIssue[];
  totalGapMonths: number;
  overlappingPeriodsCount: number;
  timeline: TimelineEvent[];
}

interface TimelineIssue {
  type: string;
  severity: string;
  description: string;
  affectedItems: string[];
}

interface TimelineEvent {
  type: string;
  title: string;
  organization: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
}

export default function VerificationPage() {
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchVerificationReport();
  }, []);

  const fetchVerificationReport = async () => {
    try {
      setLoading(true);
      const talentId = localStorage.getItem('talentProfileId');

      if (!talentId) {
        setError('Please complete your profile first');
        return;
      }

      const response = await fetch(
        `https://creerlio-api.azurewebsites.net/api/verification/talent/${talentId}/report`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch verification report');
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load verification');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your credentials...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Verification Unavailable</h3>
          <p className="text-gray-600 mb-6">{error || 'Unable to load verification report'}</p>
          <button
            onClick={fetchVerificationReport}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Credential Verification</h1>
              <p className="mt-2 text-gray-600">
                Multi-source verification of your professional credentials
              </p>
            </div>
            <button
              onClick={fetchVerificationReport}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              Refresh Verification
            </button>
          </div>
        </div>

        {/* Overall Score Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Overall Verification Score</h2>
              <div className="text-6xl font-bold mb-4">{report.overallScore.toFixed(0)}%</div>
              <div className="inline-block px-4 py-2 bg-white bg-opacity-20 rounded-full text-lg font-medium">
                {report.verificationLevel}
              </div>
            </div>
            <div className="text-right">
              <div className="space-y-3">
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-3xl font-bold">{report.verifiedCredentials}</div>
                  <div className="text-sm opacity-90">Verified</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-3xl font-bold">{report.partiallyVerifiedCredentials}</div>
                  <div className="text-sm opacity-90">Partial</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-3xl font-bold">{report.unverifiedCredentials}</div>
                  <div className="text-sm opacity-90">Unverified</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warnings & Concerns */}
        {(report.warnings.length > 0 || report.concerns.length > 0) && (
          <div className="mb-8 space-y-4">
            {report.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Warnings</h3>
                <ul className="space-y-1">
                  {report.warnings.map((warning, i) => (
                    <li key={i} className="text-yellow-800 text-sm">• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.concerns.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">🚨 Concerns</h3>
                <ul className="space-y-1">
                  {report.concerns.map((concern, i) => (
                    <li key={i} className="text-red-800 text-sm">• {concern}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'education', label: 'Education', icon: '🎓', count: report.educationVerifications.length },
                { id: 'employment', label: 'Employment', icon: '💼', count: report.employmentVerifications.length },
                { id: 'certifications', label: 'Certifications', icon: '📜', count: report.certificationVerifications.length },
                { id: 'timeline', label: 'Timeline', icon: '📅' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {report.verifiedCredentials}
                    </div>
                    <div className="text-sm text-gray-600">Fully Verified</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="text-3xl font-bold text-yellow-600 mb-1">
                      {report.partiallyVerifiedCredentials}
                    </div>
                    <div className="text-sm text-gray-600">Partially Verified</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="text-3xl font-bold text-red-600 mb-1">
                      {report.unverifiedCredentials}
                    </div>
                    <div className="text-sm text-gray-600">Unverified</div>
                  </div>
                </div>

                {/* Timeline Consistency */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline Consistency</h3>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600">Consistency Score</span>
                    <div className="flex items-center gap-3">
                      <div className="w-48 bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            report.timelineConsistency.consistencyScore >= 80
                              ? 'bg-green-600'
                              : report.timelineConsistency.consistencyScore >= 60
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                          }`}
                          style={{ width: `${report.timelineConsistency.consistencyScore}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-gray-900 w-16 text-right">
                        {report.timelineConsistency.consistencyScore.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={report.hasTimelineGaps ? 'text-yellow-600' : 'text-green-600'}>
                        {report.hasTimelineGaps ? '⚠️' : '✓'}
                      </span>
                      <span className="text-gray-600">
                        {report.timelineConsistency.totalGapMonths} months in gaps
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={report.hasOverlappingExperiences ? 'text-yellow-600' : 'text-green-600'}>
                        {report.hasOverlappingExperiences ? '⚠️' : '✓'}
                      </span>
                      <span className="text-gray-600">
                        {report.timelineConsistency.overlappingPeriodsCount} overlapping periods
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Education Tab */}
            {activeTab === 'education' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Education Verification ({report.educationVerifications.length})
                </h3>
                {report.educationVerifications.map((edu) => (
                  <div key={edu.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">{edu.itemName}</h4>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border mt-2 ${getStatusBadge(edu.status)}`}>
                          {edu.status}
                        </span>
                      </div>
                      <div className={`text-3xl font-bold ${getScoreColor(edu.confidenceScore)} px-4 py-2 rounded-lg`}>
                        {edu.confidenceScore.toFixed(0)}%
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{edu.explanation}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {edu.matchedDataPoints.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-700 mb-2">✓ Verified:</p>
                          <ul className="space-y-1">
                            {edu.matchedDataPoints.map((point, i) => (
                              <li key={i} className="text-green-600">• {point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {edu.missingDataPoints.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-700 mb-2">! Missing:</p>
                          <ul className="space-y-1">
                            {edu.missingDataPoints.map((point, i) => (
                              <li key={i} className="text-orange-600">• {point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {edu.recommendedActions.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="font-medium text-gray-700 text-sm mb-2">Recommended Actions:</p>
                        <ul className="space-y-1">
                          {edu.recommendedActions.map((action, i) => (
                            <li key={i} className="text-sm text-blue-600">→ {action}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-4 text-xs text-gray-500">
                      Verified: {new Date(edu.verifiedAt).toLocaleDateString()} • 
                      Sources: {edu.verificationSources.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Employment Tab */}
            {activeTab === 'employment' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Employment Verification ({report.employmentVerifications.length})
                </h3>
                {report.employmentVerifications.map((emp) => (
                  <div key={emp.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">{emp.itemName}</h4>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border mt-2 ${getStatusBadge(emp.status)}`}>
                          {emp.status}
                        </span>
                      </div>
                      <div className={`text-3xl font-bold ${getScoreColor(emp.confidenceScore)} px-4 py-2 rounded-lg`}>
                        {emp.confidenceScore.toFixed(0)}%
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{emp.explanation}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {emp.matchedDataPoints.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-700 mb-2">✓ Verified:</p>
                          <ul className="space-y-1">
                            {emp.matchedDataPoints.map((point, i) => (
                              <li key={i} className="text-green-600">• {point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {emp.missingDataPoints.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-700 mb-2">! Missing:</p>
                          <ul className="space-y-1">
                            {emp.missingDataPoints.map((point, i) => (
                              <li key={i} className="text-orange-600">• {point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {emp.recommendedActions.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="font-medium text-gray-700 text-sm mb-2">Recommended Actions:</p>
                        <ul className="space-y-1">
                          {emp.recommendedActions.map((action, i) => (
                            <li key={i} className="text-sm text-blue-600">→ {action}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-4 text-xs text-gray-500">
                      Verified: {new Date(emp.verifiedAt).toLocaleDateString()} • 
                      Sources: {emp.verificationSources.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Certifications Tab */}
            {activeTab === 'certifications' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Certification Verification ({report.certificationVerifications.length})
                </h3>
                {report.certificationVerifications.map((cert) => (
                  <div key={cert.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">{cert.itemName}</h4>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border mt-2 ${getStatusBadge(cert.status)}`}>
                          {cert.status}
                        </span>
                      </div>
                      <div className={`text-3xl font-bold ${getScoreColor(cert.confidenceScore)} px-4 py-2 rounded-lg`}>
                        {cert.confidenceScore.toFixed(0)}%
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{cert.explanation}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {cert.matchedDataPoints.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-700 mb-2">✓ Verified:</p>
                          <ul className="space-y-1">
                            {cert.matchedDataPoints.map((point, i) => (
                              <li key={i} className="text-green-600">• {point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {cert.missingDataPoints.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-700 mb-2">! Missing:</p>
                          <ul className="space-y-1">
                            {cert.missingDataPoints.map((point, i) => (
                              <li key={i} className="text-orange-600">• {point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {cert.recommendedActions.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="font-medium text-gray-700 text-sm mb-2">Recommended Actions:</p>
                        <ul className="space-y-1">
                          {cert.recommendedActions.map((action, i) => (
                            <li key={i} className="text-sm text-blue-600">→ {action}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-4 text-xs text-gray-500">
                      Verified: {new Date(cert.verifiedAt).toLocaleDateString()} • 
                      Sources: {cert.verificationSources.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Timeline</h3>
                
                {/* Issues */}
                {report.timelineConsistency.issues.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-3">Timeline Issues</h4>
                    <div className="space-y-2">
                      {report.timelineConsistency.issues.map((issue, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border ${
                            issue.severity === 'High'
                              ? 'bg-red-50 border-red-200'
                              : issue.severity === 'Medium'
                              ? 'bg-yellow-50 border-yellow-200'
                              : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="font-medium">
                              {issue.severity === 'High' ? '🔴' : issue.severity === 'Medium' ? '🟡' : '🔵'}
                            </span>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{issue.type}</p>
                              <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Affected: {issue.affectedItems.join(', ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline Visualization */}
                <div className="relative">
                  {report.timelineConsistency.timeline
                    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                    .map((event, index) => (
                      <div key={index} className="flex gap-4 mb-6 last:mb-0">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            event.type === 'Employment' ? 'bg-blue-600' : 'bg-green-600'
                          }`}></div>
                          {index < report.timelineConsistency.timeline.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-300 mt-1"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900">{event.title}</h4>
                                <p className="text-sm text-gray-600">{event.organization}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                event.type === 'Employment'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {event.type}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {new Date(event.startDate).toLocaleDateString()} - {' '}
                              {event.isCurrent ? 'Present' : event.endDate ? new Date(event.endDate).toLocaleDateString() : 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
