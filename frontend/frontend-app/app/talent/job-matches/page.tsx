'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface JobMatch {
  jobPostingId: string;
  overallScore: number;
  matchLevel: string;
  breakdown: {
    skillsScore: number;
    experienceScore: number;
    educationScore: number;
    locationScore: number;
    cultureScore: number;
    behavioralScore: number;
  };
  matchingSkills: string[];
  missingSkills: string[];
  highlights: string[];
  concerns: string[];
}

export default function JobMatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<JobMatch | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const talentId = localStorage.getItem('talentProfileId');
      
      if (!talentId) {
        setError('Please complete your profile first');
        return;
      }

      const response = await fetch(`https://creerlio-api.azurewebsites.net/api/job-matching/talent/${talentId}/matches`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job matches');
      }

      const data = await response.json();
      setMatches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const recalculateMatches = async () => {
    try {
      setLoading(true);
      const talentId = localStorage.getItem('talentProfileId');
      
      await fetch(`https://creerlio-api.azurewebsites.net/api/job-matching/talent/${talentId}/recalculate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      await fetchMatches();
    } catch (err) {
      setError('Failed to recalculate matches');
    }
  };

  const getMatchColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-300';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredMatches = filterLevel === 'all' 
    ? matches 
    : matches.filter(m => m.matchLevel.toLowerCase() === filterLevel.toLowerCase());

  if (loading && matches.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analyzing job matches...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">AI Job Matches</h1>
              <p className="mt-2 text-gray-600">
                Intelligent job recommendations based on your profile
              </p>
            </div>
            <button
              onClick={recalculateMatches}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Recalculating...' : 'Recalculate Matches'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setFilterLevel('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filterLevel === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Matches ({matches.length})
          </button>
          <button
            onClick={() => setFilterLevel('excellent')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filterLevel === 'excellent'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Excellent ({matches.filter(m => m.matchLevel === 'Excellent').length})
          </button>
          <button
            onClick={() => setFilterLevel('good')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filterLevel === 'good'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Good ({matches.filter(m => m.matchLevel === 'Good').length})
          </button>
          <button
            onClick={() => setFilterLevel('fair')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filterLevel === 'fair'
                ? 'bg-yellow-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Fair ({matches.filter(m => m.matchLevel === 'Fair').length})
          </button>
        </div>

        {/* Matches Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMatches.map((match, index) => (
            <div
              key={index}
              onClick={() => setSelectedMatch(match)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
            >
              {/* Match Score */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl font-bold text-blue-600">
                    {match.overallScore}%
                  </div>
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getMatchColor(match.matchLevel)}`}>
                      {match.matchLevel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Skills Match</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${match.breakdown.skillsScore}%` }}
                      ></div>
                    </div>
                    <span className="font-medium text-gray-900 w-12 text-right">
                      {match.breakdown.skillsScore}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Experience</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${match.breakdown.experienceScore}%` }}
                      ></div>
                    </div>
                    <span className="font-medium text-gray-900 w-12 text-right">
                      {match.breakdown.experienceScore}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Education</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${match.breakdown.educationScore}%` }}
                      ></div>
                    </div>
                    <span className="font-medium text-gray-900 w-12 text-right">
                      {match.breakdown.educationScore}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Location</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{ width: `${match.breakdown.locationScore}%` }}
                      ></div>
                    </div>
                    <span className="font-medium text-gray-900 w-12 text-right">
                      {match.breakdown.locationScore}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Matching Skills */}
              {match.matchingSkills.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Matching Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {match.matchingSkills.slice(0, 5).map((skill, i) => (
                      <span
                        key={i}
                        className="inline-block px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-200"
                      >
                        {skill}
                      </span>
                    ))}
                    {match.matchingSkills.length > 5 && (
                      <span className="inline-block px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
                        +{match.matchingSkills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Highlights */}
              {match.highlights.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Highlights</h4>
                  <ul className="space-y-1">
                    {match.highlights.map((highlight, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Concerns */}
              {match.concerns.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Areas to Consider</h4>
                  <ul className="space-y-1">
                    {match.concerns.map((concern, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start">
                        <span className="text-yellow-500 mr-2">!</span>
                        {concern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  View Job Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredMatches.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Matches Found</h3>
            <p className="text-gray-600 mb-6">
              {filterLevel === 'all'
                ? 'We haven\'t found any matching jobs yet. Complete your profile to get better matches.'
                : `No ${filterLevel} matches found. Try adjusting your filter.`}
            </p>
            <button
              onClick={() => router.push('/talent/profile')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Complete Profile
            </button>
          </div>
        )}
      </div>

      {/* Detailed Match Modal */}
      {selectedMatch && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMatch(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Match Details</h2>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Overall Score */}
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <div className="text-5xl font-bold text-blue-600 mb-2">
                    {selectedMatch.overallScore}%
                  </div>
                  <span className={`inline-block px-4 py-2 rounded-full text-lg font-medium border ${getMatchColor(selectedMatch.matchLevel)}`}>
                    {selectedMatch.matchLevel} Match
                  </span>
                </div>

                {/* All Skills */}
                {selectedMatch.matchingSkills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      All Matching Skills ({selectedMatch.matchingSkills.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMatch.matchingSkills.map((skill, i) => (
                        <span
                          key={i}
                          className="inline-block px-3 py-1 bg-green-50 text-green-700 text-sm rounded border border-green-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Skills */}
                {selectedMatch.missingSkills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Skills to Develop ({selectedMatch.missingSkills.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMatch.missingSkills.map((skill, i) => (
                        <span
                          key={i}
                          className="inline-block px-3 py-1 bg-orange-50 text-orange-700 text-sm rounded border border-orange-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                    Apply Now
                  </button>
                  <button className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                    Save for Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
