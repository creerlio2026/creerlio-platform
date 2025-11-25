'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CareerPathway {
  id: string;
  currentRole: string;
  targetRole: string;
  estimatedMonths: number;
  estimatedCost: number;
  completionPercentage: number;
  steps: PathwayStep[];
  skillGapAnalysis: SkillGapAnalysis;
  trainingRecommendations: TrainingRecommendation[];
  intermediateRoles: IntermediateRole[];
  milestones: Milestone[];
}

interface PathwayStep {
  stepNumber: number;
  title: string;
  description: string;
  type: string;
  estimatedMonths: number;
  estimatedCost: number;
  isCompleted: boolean;
}

interface SkillGapAnalysis {
  currentSkills: string[];
  requiredSkills: string[];
  missingSkills: string[];
  totalGapCount: number;
  gapSeverity: number;
}

interface TrainingRecommendation {
  title: string;
  provider: string;
  url: string;
  type: string;
  durationHours: number;
  cost: number;
  rating: number;
  reviews: number;
  skillsCovered: string[];
}

interface IntermediateRole {
  roleTitle: string;
  description: string;
  estimatedMonthsInRole: number;
  averageSalary: number;
  requiredSkills: string[];
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  isCompleted: boolean;
}

export default function CareerPathwayPage() {
  const router = useRouter();
  const [targetRole, setTargetRole] = useState('');
  const [pathway, setPathway] = useState<CareerPathway | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const generatePathway = async () => {
    if (!targetRole.trim()) {
      setError('Please enter a target role');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const talentId = localStorage.getItem('talentProfileId');

      if (!talentId) {
        setError('Please complete your profile first');
        return;
      }

      const response = await fetch(
        `https://creerlio-api.azurewebsites.net/api/career-pathway/generate?talentId=${talentId}&targetRole=${encodeURIComponent(targetRole)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate career pathway');
      }

      const data = await response.json();
      setPathway(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate pathway');
    } finally {
      setLoading(false);
    }
  };

  const popularRoles = [
    'Senior Software Engineer',
    'Tech Lead',
    'Engineering Manager',
    'Solutions Architect',
    'DevOps Engineer',
    'Data Scientist',
    'Product Manager',
    'Full Stack Developer',
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Career Pathway Planner</h1>
          <p className="mt-2 text-gray-600">
            Get personalized career guidance powered by AI
          </p>
        </div>

        {/* Target Role Input */}
        {!pathway && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              What's your target role?
            </h2>
            <p className="text-gray-600 mb-6">
              Enter your desired job title and we'll create a personalized career roadmap
            </p>

            <div className="mb-6">
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && generatePathway()}
                placeholder="e.g., Senior Software Engineer, Product Manager"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <button
              onClick={generatePathway}
              disabled={loading || !targetRole.trim()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating Your Pathway...
                </span>
              ) : (
                'Generate Career Pathway'
              )}
            </button>

            {/* Popular Roles */}
            <div className="mt-8">
              <p className="text-sm text-gray-600 mb-3">Popular career paths:</p>
              <div className="flex flex-wrap gap-2">
                {popularRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => setTargetRole(role)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pathway Results */}
        {pathway && (
          <div className="space-y-6">
            {/* Pathway Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {pathway.currentRole} → {pathway.targetRole}
                  </h2>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span>⏱️ {pathway.estimatedMonths} months</span>
                    <span>💰 ${pathway.estimatedCost.toLocaleString()} AUD</span>
                    <span>📊 {pathway.completionPercentage}% complete</span>
                  </div>
                </div>
                <button
                  onClick={() => setPathway(null)}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  Generate New Pathway
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">Overall Progress</span>
                  <span className="text-gray-600">{pathway.completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${pathway.completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {[
                    { id: 'overview', label: 'Overview', icon: '📋' },
                    { id: 'steps', label: 'Steps', icon: '📝' },
                    { id: 'skills', label: 'Skill Gaps', icon: '🎯' },
                    { id: 'training', label: 'Training', icon: '📚' },
                    { id: 'roles', label: 'Career Ladder', icon: '🪜' },
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
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-3xl font-bold text-blue-600 mb-1">
                          {pathway.steps.length}
                        </div>
                        <div className="text-sm text-gray-600">Total Steps</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-3xl font-bold text-green-600 mb-1">
                          {pathway.skillGapAnalysis.currentSkills.length}
                        </div>
                        <div className="text-sm text-gray-600">Current Skills</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <div className="text-3xl font-bold text-orange-600 mb-1">
                          {pathway.skillGapAnalysis.missingSkills.length}
                        </div>
                        <div className="text-sm text-gray-600">Skills to Learn</div>
                      </div>
                    </div>

                    {/* Milestones */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Milestones</h3>
                      <div className="space-y-3">
                        {pathway.milestones.map((milestone) => (
                          <div
                            key={milestone.id}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center ${
                              milestone.isCompleted ? 'bg-green-500' : 'bg-gray-300'
                            }`}>
                              {milestone.isCompleted && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Target: {new Date(milestone.targetDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Steps Tab */}
                {activeTab === 'steps' && (
                  <div className="space-y-4">
                    {pathway.steps.map((step) => (
                      <div
                        key={step.stepNumber}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                            step.isCompleted ? 'bg-green-500' : 'bg-blue-600'
                          }`}>
                            {step.stepNumber}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                              <span className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                                {step.type}
                              </span>
                            </div>
                            <p className="text-gray-600 mt-2">{step.description}</p>
                            <div className="flex items-center gap-6 mt-3 text-sm text-gray-600">
                              <span>⏱️ {step.estimatedMonths} months</span>
                              <span>💰 ${step.estimatedCost.toLocaleString()} AUD</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Skills Tab */}
                {activeTab === 'skills' && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Skills Gap Analysis
                        </h3>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          pathway.skillGapAnalysis.gapSeverity > 70
                            ? 'bg-red-100 text-red-800'
                            : pathway.skillGapAnalysis.gapSeverity > 40
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {pathway.skillGapAnalysis.gapSeverity.toFixed(0)}% Gap Severity
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        ✅ Your Current Skills ({pathway.skillGapAnalysis.currentSkills.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {pathway.skillGapAnalysis.currentSkills.map((skill, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-green-50 text-green-700 rounded-lg border border-green-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        🎯 Required for Target Role ({pathway.skillGapAnalysis.requiredSkills.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {pathway.skillGapAnalysis.requiredSkills.map((skill, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        📚 Skills to Learn ({pathway.skillGapAnalysis.missingSkills.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {pathway.skillGapAnalysis.missingSkills.map((skill, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-orange-50 text-orange-700 rounded-lg border border-orange-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Training Tab */}
                {activeTab === 'training' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Recommended Courses & Training
                    </h3>
                    {pathway.trainingRecommendations.map((training, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{training.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{training.provider}</p>
                            <div className="flex items-center gap-4 mt-3 text-sm">
                              <span className="flex items-center gap-1">
                                <span className="text-yellow-500">⭐</span>
                                {training.rating.toFixed(1)} ({training.reviews.toLocaleString()} reviews)
                              </span>
                              <span>⏱️ {training.durationHours}h</span>
                              <span className="font-medium text-green-600">
                                ${training.cost} AUD
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {training.skillsCovered.map((skill, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <a
                            href={training.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
                          >
                            View Course
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Roles Tab */}
                {activeTab === 'roles' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Career Progression Path
                    </h3>
                    <div className="relative">
                      {pathway.intermediateRoles.map((role, index) => (
                        <div key={index} className="relative">
                          <div className="border border-gray-200 rounded-lg p-4 mb-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 text-lg">
                                  {role.roleTitle}
                                </h4>
                                <p className="text-gray-600 mt-2">{role.description}</p>
                                <div className="flex items-center gap-6 mt-3 text-sm text-gray-600">
                                  <span>⏱️ {role.estimatedMonthsInRole} months</span>
                                  <span className="font-medium text-green-600">
                                    ${role.averageSalary.toLocaleString()} AUD avg
                                  </span>
                                </div>
                                <div className="mt-3">
                                  <p className="text-sm font-medium text-gray-700 mb-2">
                                    Required Skills:
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {role.requiredSkills.map((skill, i) => (
                                      <span
                                        key={i}
                                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          {index < pathway.intermediateRoles.length - 1 && (
                            <div className="flex justify-center my-2">
                              <div className="text-2xl text-blue-600">↓</div>
                            </div>
                          )}
                        </div>
                      ))}
                      {/* Final Target Role */}
                      <div className="border-2 border-blue-600 rounded-lg p-4 bg-blue-50">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🎯</span>
                          <h4 className="font-bold text-blue-900 text-lg">
                            {pathway.targetRole}
                          </h4>
                        </div>
                        <p className="text-blue-800">Your target destination!</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
