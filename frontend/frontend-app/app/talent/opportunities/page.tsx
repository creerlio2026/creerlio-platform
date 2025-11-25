'use client';

import { useState, useEffect } from 'react';
import { 
  Briefcase, 
  TrendingUp, 
  MapPin, 
  Building2, 
  Target,
  Zap,
  Eye,
  ThumbsUp,
  Clock,
  DollarSign,
  Users,
  Star,
  Filter,
  Search,
  Bell,
  Route
} from 'lucide-react';

interface Opportunity {
  id: string;
  type: 'pathway' | 'expansion' | 'radar' | 'proximity';
  title: string;
  company: string;
  location: string;
  salary: string;
  matchScore: number;
  distance?: string;
  postedTime: string;
  isNew: boolean;
  description: string;
  skills: string[];
}

export default function TalentOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([
    {
      id: '1',
      type: 'pathway',
      title: 'Senior Software Engineer',
      company: 'TechCorp Australia',
      location: 'Sydney, NSW',
      salary: '$130K - $160K',
      matchScore: 95,
      postedTime: '2 hours ago',
      isNew: true,
      description: 'Lead development of cloud-native applications using modern tech stack',
      skills: ['React', 'Node.js', 'AWS', 'TypeScript']
    },
    {
      id: '2',
      type: 'expansion',
      title: 'Full Stack Developer',
      company: 'InnovateTech',
      location: 'Melbourne, VIC',
      salary: '$110K - $140K',
      matchScore: 88,
      postedTime: '5 hours ago',
      isNew: true,
      description: 'Join our expanding team to build next-gen SaaS products',
      skills: ['.NET', 'React', 'SQL', 'Azure']
    },
    {
      id: '3',
      type: 'radar',
      title: 'Solutions Architect',
      company: 'CloudFirst Systems',
      location: 'Brisbane, QLD',
      salary: '$150K - $180K',
      matchScore: 92,
      postedTime: '1 day ago',
      isNew: false,
      description: 'Design and implement enterprise cloud solutions for major clients',
      skills: ['AWS', 'Azure', 'Kubernetes', 'Terraform']
    },
    {
      id: '4',
      type: 'proximity',
      title: 'Software Developer',
      company: 'Local Tech Hub',
      location: 'Sydney, NSW',
      salary: '$95K - $120K',
      matchScore: 82,
      distance: '2.5 km',
      postedTime: '3 days ago',
      isNew: false,
      description: 'Build innovative solutions for local businesses',
      skills: ['JavaScript', 'Python', 'PostgreSQL']
    }
  ]);

  const [filter, setFilter] = useState<'all' | 'pathway' | 'expansion' | 'radar' | 'proximity'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pathway':
        return <Target className="w-5 h-5" />;
      case 'expansion':
        return <TrendingUp className="w-5 h-5" />;
      case 'radar':
        return <Zap className="w-5 h-5" />;
      case 'proximity':
        return <MapPin className="w-5 h-5" />;
      default:
        return <Briefcase className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'pathway':
        return 'Career Pathway';
      case 'expansion':
        return 'Business Expansion';
      case 'radar':
        return 'Opportunity Radar';
      case 'proximity':
        return 'Proximity Match';
      default:
        return 'Opportunity';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pathway':
        return 'blue';
      case 'expansion':
        return 'green';
      case 'radar':
        return 'purple';
      case 'proximity':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesFilter = filter === 'all' || opp.type === filter;
    const matchesSearch = searchQuery === '' || 
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.company.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Opportunities</h1>
              <p className="text-gray-600">AI-curated opportunities based on your profile and preferences</p>
            </div>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Set Alerts</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">12</span>
              </div>
              <p className="text-sm text-gray-700 font-medium">Pathway Matches</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <span className="text-2xl font-bold text-green-600">8</span>
              </div>
              <p className="text-sm text-gray-700 font-medium">Expansions</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-8 h-8 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">5</span>
              </div>
              <p className="text-sm text-gray-700 font-medium">Radar Alerts</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="w-8 h-8 text-orange-600" />
                <span className="text-2xl font-bold text-orange-600">3</span>
              </div>
              <p className="text-sm text-gray-700 font-medium">Nearby</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search opportunities..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('pathway')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  filter === 'pathway' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pathways
              </button>
              <button
                onClick={() => setFilter('expansion')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  filter === 'expansion' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Expansions
              </button>
              <button
                onClick={() => setFilter('radar')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  filter === 'radar' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Radar
              </button>
              <button
                onClick={() => setFilter('proximity')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  filter === 'proximity' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Nearby
              </button>
            </div>
          </div>
        </div>

        {/* Opportunities List */}
        <div className="space-y-4">
          {filteredOpportunities.map((opp) => (
            <div key={opp.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Company Logo Placeholder */}
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {opp.company.charAt(0)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-2xl font-bold text-gray-900">{opp.title}</h3>
                      {opp.isNew && (
                        <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                          NEW
                        </span>
                      )}
                      <div className={`flex items-center space-x-1 px-3 py-1 bg-${getTypeColor(opp.type)}-100 text-${getTypeColor(opp.type)}-600 rounded-full`}>
                        {getTypeIcon(opp.type)}
                        <span className="text-xs font-semibold">{getTypeLabel(opp.type)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <Building2 className="w-4 h-4" />
                        <span className="text-sm font-medium">{opp.company}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{opp.location}</span>
                      </div>
                      {opp.distance && (
                        <div className="flex items-center space-x-1">
                          <Route className="w-4 h-4" />
                          <span className="text-sm">{opp.distance} away</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{opp.postedTime}</span>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">{opp.description}</p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {opp.skills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1 text-green-600 font-semibold">
                        <DollarSign className="w-4 h-4" />
                        <span>{opp.salary}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>50-200 employees</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match Score */}
                <div className="flex flex-col items-end space-y-4 ml-4">
                  <div className="text-center">
                    <div className="relative w-24 h-24">
                      <svg className="transform -rotate-90 w-24 h-24">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="#3b82f6"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${opp.matchScore * 2.51} 251`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-blue-600">{opp.matchScore}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Match Score</p>
                  </div>

                  <div className="flex flex-col space-y-2 w-full">
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center space-x-2 w-full">
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                    <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold flex items-center justify-center space-x-2 w-full">
                      <ThumbsUp className="w-4 h-4" />
                      <span>Interested</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Silent Interaction Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-blue-700">
                  🔒 <strong>Silent Mode:</strong> Your profile will only be shared when you choose to interact. 
                  View details without revealing your interest.
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredOpportunities.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No opportunities found</h3>
            <p className="text-gray-600">Try adjusting your filters or search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
