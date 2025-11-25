'use client';

import { useEffect, useState } from 'react';

interface FootprintReport {
  talentProfileId: string;
  scannedAt: string;
  reputationScore: ReputationScore;
  newsMentions: NewsMention[];
  socialMediaProfiles: SocialMediaProfile[];
  githubActivity: GitHubActivity;
  publications: Publication[];
  awards: Award[];
  footprintAnalytics: FootprintAnalytics;
  alerts: FootprintAlert[];
}

interface ReputationScore {
  overallScore: number;
  onlinePresenceScore: number;
  professionalImpactScore: number;
  socialInfluenceScore: number;
  credibilityScore: number;
  calculatedAt: string;
}

interface NewsMention {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: string;
  relevanceScore: number;
  snippet: string;
  topics: string[];
}

interface SocialMediaProfile {
  platform: string;
  username: string;
  profileUrl: string;
  followers: number;
  following: number;
  posts: number;
  engagementRate: number;
  lastUpdated: string;
}

interface GitHubActivity {
  username: string;
  profileUrl: string;
  publicRepos: number;
  followers: number;
  following: number;
  totalStars: number;
  topRepositories: GitHubRepo[];
  languages: { [key: string]: number };
  contributionsLastYear: number;
}

interface GitHubRepo {
  name: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  language: string;
  lastUpdated: string;
}

interface Publication {
  title: string;
  authors: string[];
  venue: string;
  year: number;
  url: string;
  citations: number;
}

interface Award {
  title: string;
  organization: string;
  year: number;
  description: string;
}

interface FootprintAnalytics {
  totalMentions: number;
  positiveMentions: number;
  neutralMentions: number;
  negativeMentions: number;
  mentionsLastMonth: number;
  mentionsLastYear: number;
  topTopics: string[];
  activityTrend: string;
}

interface FootprintAlert {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  detectedAt: string;
  url: string | null;
}

export default function FootprintPage() {
  const [report, setReport] = useState<FootprintReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchFootprintReport();
  }, []);

  const fetchFootprintReport = async () => {
    try {
      setLoading(true);
      const talentId = localStorage.getItem('talentProfileId');

      if (!talentId) {
        setError('Please complete your profile first');
        return;
      }

      const response = await fetch(
        `https://creerlio-api.azurewebsites.net/api/footprint/talent/${talentId}/scan`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch footprint report');
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load footprint');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Scanning your digital footprint...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Footprint Unavailable</h3>
          <p className="text-gray-600 mb-6">{error || 'Unable to load footprint report'}</p>
          <button
            onClick={fetchFootprintReport}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry Scan
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
              <h1 className="text-3xl font-bold text-gray-900">Electronic Footprint Monitor</h1>
              <p className="mt-2 text-gray-600">
                Track your professional presence across the digital landscape
              </p>
            </div>
            <button
              onClick={fetchFootprintReport}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              Rescan Footprint
            </button>
          </div>
        </div>

        {/* Reputation Score Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg shadow-lg p-6 text-white md:col-span-2">
            <h2 className="text-lg font-semibold mb-2">Overall Reputation</h2>
            <div className="text-5xl font-bold mb-2">{report.reputationScore.overallScore.toFixed(0)}%</div>
            <div className="text-sm opacity-90">
              Updated: {new Date(report.reputationScore.calculatedAt).toLocaleDateString()}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Online Presence</div>
            <div className="text-2xl font-bold text-blue-600">{report.reputationScore.onlinePresenceScore.toFixed(0)}%</div>
            <div className="text-xs text-gray-500 mt-1">25% weight</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Professional Impact</div>
            <div className="text-2xl font-bold text-green-600">{report.reputationScore.professionalImpactScore.toFixed(0)}%</div>
            <div className="text-xs text-gray-500 mt-1">30% weight</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Social Influence</div>
            <div className="text-2xl font-bold text-purple-600">{report.reputationScore.socialInfluenceScore.toFixed(0)}%</div>
            <div className="text-xs text-gray-500 mt-1">25% weight</div>
          </div>
        </div>

        {/* Analytics Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Footprint Analytics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{report.footprintAnalytics.totalMentions}</div>
              <div className="text-sm text-gray-600 mt-1">Total Mentions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{report.footprintAnalytics.positiveMentions}</div>
              <div className="text-sm text-gray-600 mt-1">Positive</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{report.footprintAnalytics.neutralMentions}</div>
              <div className="text-sm text-gray-600 mt-1">Neutral</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{report.footprintAnalytics.negativeMentions}</div>
              <div className="text-sm text-gray-600 mt-1">Negative</div>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between text-sm">
            <div>
              <span className="text-gray-600">Activity Trend:</span>
              <span className={`ml-2 font-semibold ${
                report.footprintAnalytics.activityTrend === 'Increasing' ? 'text-green-600' :
                report.footprintAnalytics.activityTrend === 'Decreasing' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {report.footprintAnalytics.activityTrend}
              </span>
            </div>
            <div className="text-gray-600">
              Last month: <span className="font-semibold text-gray-900">{report.footprintAnalytics.mentionsLastMonth}</span> mentions
            </div>
          </div>
        </div>

        {/* Alerts */}
        {report.alerts.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
            <div className="space-y-3">
              {report.alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{alert.type}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full border ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <h4 className="font-medium mb-1">{alert.title}</h4>
                      <p className="text-sm">{alert.description}</p>
                      {alert.url && (
                        <a href={alert.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                          View Source →
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                      {new Date(alert.detectedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'overview', label: 'Overview', icon: '🌐' },
                { id: 'news', label: 'News Mentions', icon: '📰', count: report.newsMentions.length },
                { id: 'social', label: 'Social Media', icon: '📱', count: report.socialMediaProfiles.length },
                { id: 'github', label: 'GitHub', icon: '💻' },
                { id: 'publications', label: 'Publications', icon: '📚', count: report.publications.length },
                { id: 'awards', label: 'Awards', icon: '🏆', count: report.awards.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {report.footprintAnalytics.totalMentions}
                    </div>
                    <div className="text-sm text-gray-600">Total Mentions</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                      {report.socialMediaProfiles.reduce((sum, p) => sum + p.followers, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Followers</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {report.githubActivity?.totalStars || 0}
                    </div>
                    <div className="text-sm text-gray-600">GitHub Stars</div>
                  </div>
                </div>

                {/* Top Topics */}
                {report.footprintAnalytics.topTopics.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Top Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {report.footprintAnalytics.topTopics.map((topic, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* News Mentions Tab */}
            {activeTab === 'news' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  News Mentions ({report.newsMentions.length})
                </h3>
                {report.newsMentions
                  .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
                  .map((mention) => (
                    <div key={mention.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{mention.title}</h4>
                          <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                            <span>{mention.source}</span>
                            <span>•</span>
                            <span>{new Date(mention.publishedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end ml-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSentimentColor(mention.sentiment)}`}>
                            {mention.sentiment}
                          </span>
                          <div className="text-sm text-gray-600">
                            Relevance: <span className="font-medium">{mention.relevanceScore.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{mention.snippet}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {mention.topics.map((topic, i) => (
                            <span key={i} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              {topic}
                            </span>
                          ))}
                        </div>
                        <a
                          href={mention.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Read More →
                        </a>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Social Media Tab */}
            {activeTab === 'social' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Social Media Profiles ({report.socialMediaProfiles.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.socialMediaProfiles.map((profile, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">{profile.platform}</h4>
                          <a
                            href={profile.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            @{profile.username}
                          </a>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center mb-3">
                        <div>
                          <div className="text-2xl font-bold text-gray-900">{profile.followers.toLocaleString()}</div>
                          <div className="text-xs text-gray-600">Followers</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">{profile.following.toLocaleString()}</div>
                          <div className="text-xs text-gray-600">Following</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">{profile.posts.toLocaleString()}</div>
                          <div className="text-xs text-gray-600">Posts</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-200">
                        <span className="text-gray-600">Engagement Rate</span>
                        <span className="font-semibold text-green-600">{profile.engagementRate.toFixed(1)}%</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Updated: {new Date(profile.lastUpdated).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GitHub Tab */}
            {activeTab === 'github' && report.githubActivity && (
              <div className="space-y-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      GitHub Activity
                    </h3>
                    <a
                      href={report.githubActivity.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      @{report.githubActivity.username}
                    </a>
                  </div>
                  <a
                    href={report.githubActivity.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm"
                  >
                    View on GitHub
                  </a>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                    <div className="text-3xl font-bold text-blue-600">{report.githubActivity.publicRepos}</div>
                    <div className="text-sm text-gray-600 mt-1">Repositories</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center border border-yellow-200">
                    <div className="text-3xl font-bold text-yellow-600">{report.githubActivity.totalStars}</div>
                    <div className="text-sm text-gray-600 mt-1">Total Stars</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                    <div className="text-3xl font-bold text-purple-600">{report.githubActivity.followers}</div>
                    <div className="text-sm text-gray-600 mt-1">Followers</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                    <div className="text-3xl font-bold text-green-600">{report.githubActivity.contributionsLastYear}</div>
                    <div className="text-sm text-gray-600 mt-1">Contributions</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                    <div className="text-3xl font-bold text-gray-600">{report.githubActivity.following}</div>
                    <div className="text-sm text-gray-600 mt-1">Following</div>
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(report.githubActivity.languages)
                      .sort(([, a], [, b]) => b - a)
                      .map(([lang, count]) => (
                        <span key={lang} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                          {lang} <span className="text-gray-600">({count})</span>
                        </span>
                      ))}
                  </div>
                </div>

                {/* Top Repositories */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Top Repositories</h4>
                  <div className="space-y-3">
                    {report.githubActivity.topRepositories.map((repo, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <a
                              href={repo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-blue-600 hover:underline text-lg"
                            >
                              {repo.name}
                            </a>
                            {repo.description && (
                              <p className="text-gray-600 text-sm mt-1">{repo.description}</p>
                            )}
                          </div>
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded ml-4">
                            {repo.language}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>⭐ {repo.stars} stars</span>
                          <span>🔱 {repo.forks} forks</span>
                          <span className="ml-auto text-xs">
                            Updated: {new Date(repo.lastUpdated).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Publications Tab */}
            {activeTab === 'publications' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Publications ({report.publications.length})
                </h3>
                {report.publications
                  .sort((a, b) => b.year - a.year)
                  .map((pub, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{pub.title}</h4>
                      <div className="text-sm text-gray-600 mb-2">
                        {pub.authors.join(', ')}
                      </div>
                      <div className="flex items-center gap-4 text-sm mb-3">
                        <span className="text-gray-600">{pub.venue}</span>
                        <span className="text-gray-600">•</span>
                        <span className="font-medium text-gray-900">{pub.year}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-600">{pub.citations} citations</span>
                      </div>
                      <a
                        href={pub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Publication →
                      </a>
                    </div>
                  ))}
              </div>
            )}

            {/* Awards Tab */}
            {activeTab === 'awards' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Awards & Recognition ({report.awards.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.awards
                    .sort((a, b) => b.year - a.year)
                    .map((award, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-yellow-50 to-white">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="text-3xl">🏆</div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{award.title}</h4>
                            <div className="text-sm text-gray-600 mb-1">{award.organization}</div>
                            <div className="text-sm font-medium text-gray-900">{award.year}</div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{award.description}</p>
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
