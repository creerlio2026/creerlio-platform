'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  Upload, 
  Share2, 
  Award, 
  FileText, 
  CheckCircle,
  Mail,
  Shield,
  Linkedin,
  Github,
  Instagram,
  Facebook,
  Video,
  FileImage,
  Sparkles,
  ArrowRight,
  Lock,
  Globe
} from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: any;
  status: 'pending' | 'current' | 'completed';
}

export default function TalentOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [resume, setResume] = useState<File | null>(null);
  const [socialAccounts, setSocialAccounts] = useState({
    linkedin: '',
    github: '',
    instagram: '',
    facebook: '',
    tiktok: ''
  });
  const [media, setMedia] = useState<File[]>([]);
  const [privacySettings, setPrivacySettings] = useState({
    shareWorkHistory: true,
    shareEducation: true,
    shareSkills: true,
    shareCertifications: true,
    sharePortfolio: true,
    shareContactInfo: false,
    shareSocialMedia: false
  });

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: 'Account Creation',
      description: 'Sign up with email and verify identity',
      icon: UserPlus,
      status: currentStep === 1 ? 'current' : currentStep > 1 ? 'completed' : 'pending'
    },
    {
      id: 2,
      title: 'Resume Import',
      description: 'Auto-extract your professional history',
      icon: Upload,
      status: currentStep === 2 ? 'current' : currentStep > 2 ? 'completed' : 'pending'
    },
    {
      id: 3,
      title: 'Social Footprint',
      description: 'Connect your professional networks',
      icon: Share2,
      status: currentStep === 3 ? 'current' : currentStep > 3 ? 'completed' : 'pending'
    },
    {
      id: 4,
      title: 'Media & Portfolio',
      description: 'Upload videos, documents, and work samples',
      icon: FileImage,
      status: currentStep === 4 ? 'current' : currentStep > 4 ? 'completed' : 'pending'
    },
    {
      id: 5,
      title: 'Achievements',
      description: 'AI classifies your skills and achievements',
      icon: Award,
      status: currentStep === 5 ? 'current' : currentStep > 5 ? 'completed' : 'pending'
    },
    {
      id: 6,
      title: 'Privacy Settings',
      description: 'Choose what to share with businesses',
      icon: Lock,
      status: currentStep === 6 ? 'current' : currentStep > 6 ? 'completed' : 'pending'
    },
    {
      id: 7,
      title: 'Career Pathways',
      description: 'AI generates personalized career paths',
      icon: Sparkles,
      status: currentStep === 7 ? 'current' : currentStep > 7 ? 'completed' : 'pending'
    },
    {
      id: 8,
      title: 'Complete',
      description: 'Start receiving opportunities',
      icon: CheckCircle,
      status: currentStep === 8 ? 'completed' : 'pending'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h2>
              <p className="text-gray-600">Join CareerLio and unlock your career potential</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Shield className="w-4 h-4 inline mr-2" />
                  Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Create a secure password"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Identity Verification</h4>
                    <p className="text-sm text-blue-700">
                      We'll send a verification email to confirm your identity and secure your account.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Import Your Resume</h2>
              <p className="text-gray-600">AI will automatically extract your work history, skills, and qualifications</p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Drop your resume here</h3>
              <p className="text-gray-600 mb-4">or click to browse</p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => e.target.files && setResume(e.target.files[0])}
                className="hidden"
                id="resume-upload"
              />
              <label
                htmlFor="resume-upload"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                Select File
              </label>
              {resume && (
                <div className="mt-4 text-sm text-green-600">
                  ✓ {resume.name} uploaded
                </div>
              )}
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start">
                <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="font-semibold text-purple-900 mb-1">AI-Powered Extraction</h4>
                  <p className="text-sm text-purple-700">
                    Our AI will automatically extract:
                  </p>
                  <ul className="text-sm text-purple-700 mt-2 space-y-1">
                    <li>• Employment history and job titles</li>
                    <li>• Skills and competencies</li>
                    <li>• Education and qualifications</li>
                    <li>• Certifications and licenses</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Connect Your Social Footprint</h2>
              <p className="text-gray-600">Import your professional and social networks</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <Linkedin className="w-8 h-8 text-blue-600" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">LinkedIn</h4>
                  <p className="text-sm text-gray-600">Professional network and work history</p>
                </div>
                <input
                  type="text"
                  value={socialAccounts.linkedin}
                  onChange={(e) => setSocialAccounts({...socialAccounts, linkedin: e.target.value})}
                  placeholder="linkedin.com/in/yourprofile"
                  className="px-4 py-2 border border-gray-300 rounded-lg w-64"
                />
              </div>

              <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <Github className="w-8 h-8 text-gray-900" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">GitHub</h4>
                  <p className="text-sm text-gray-600">Code contributions and projects</p>
                </div>
                <input
                  type="text"
                  value={socialAccounts.github}
                  onChange={(e) => setSocialAccounts({...socialAccounts, github: e.target.value})}
                  placeholder="github.com/yourprofile"
                  className="px-4 py-2 border border-gray-300 rounded-lg w-64"
                />
              </div>

              <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <Instagram className="w-8 h-8 text-pink-600" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Instagram</h4>
                  <p className="text-sm text-gray-600">Visual portfolio and content</p>
                </div>
                <input
                  type="text"
                  value={socialAccounts.instagram}
                  onChange={(e) => setSocialAccounts({...socialAccounts, instagram: e.target.value})}
                  placeholder="instagram.com/yourprofile"
                  className="px-4 py-2 border border-gray-300 rounded-lg w-64"
                />
              </div>

              <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <Facebook className="w-8 h-8 text-blue-700" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Facebook</h4>
                  <p className="text-sm text-gray-600">Social presence and connections</p>
                </div>
                <input
                  type="text"
                  value={socialAccounts.facebook}
                  onChange={(e) => setSocialAccounts({...socialAccounts, facebook: e.target.value})}
                  placeholder="facebook.com/yourprofile"
                  className="px-4 py-2 border border-gray-300 rounded-lg w-64"
                />
              </div>

              <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <Video className="w-8 h-8 text-black" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">TikTok</h4>
                  <p className="text-sm text-gray-600">Creative content and engagement</p>
                </div>
                <input
                  type="text"
                  value={socialAccounts.tiktok}
                  onChange={(e) => setSocialAccounts({...socialAccounts, tiktok: e.target.value})}
                  placeholder="tiktok.com/@yourprofile"
                  className="px-4 py-2 border border-gray-300 rounded-lg w-64"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Upload Media & Portfolio</h2>
              <p className="text-gray-600">Showcase your work with videos, documents, and images</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-1">Videos</h4>
                <p className="text-sm text-gray-600 mb-3">Demo reels, presentations</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  Upload
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-1">Documents</h4>
                <p className="text-sm text-gray-600 mb-3">Certificates, reports</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  Upload
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-1">Images</h4>
                <p className="text-sm text-gray-600 mb-3">Work samples, designs</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  Upload
                </button>
              </div>
            </div>

            {media.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-semibold">
                  ✓ {media.length} file(s) uploaded successfully
                </p>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">AI Classification Engine</h2>
              <p className="text-gray-600">Mapping your achievements to global skill taxonomy</p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-8">
              <div className="flex items-center justify-center mb-6">
                <Sparkles className="w-16 h-16 text-purple-600 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-4">
                AI is analyzing your profile...
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Extracting skills from work history</span>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Mapping to global skill taxonomy</span>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Analyzing achievements and certifications</span>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Identifying skill gaps and opportunities</span>
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Skills Identified</h4>
                <div className="flex flex-wrap gap-2">
                  {['JavaScript', 'React', 'Node.js', 'SQL', 'Python', 'AWS'].map(skill => (
                    <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Certifications</h4>
                <div className="flex flex-wrap gap-2">
                  {['AWS Certified', 'Scrum Master', 'PMP'].map(cert => (
                    <span key={cert} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Privacy & Sharing Settings</h2>
              <p className="text-gray-600">Choose what information to share with businesses</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Lock className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-1">Granular Privacy Control</h4>
                  <p className="text-sm text-yellow-700">
                    You have full control over what businesses can see. Change these settings anytime.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries({
                shareWorkHistory: 'Work History & Employment',
                shareEducation: 'Education & Qualifications',
                shareSkills: 'Skills & Competencies',
                shareCertifications: 'Certifications & Licenses',
                sharePortfolio: 'Portfolio & Work Samples',
                shareContactInfo: 'Contact Information',
                shareSocialMedia: 'Social Media Profiles'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="font-medium text-gray-900">{label}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacySettings[key as keyof typeof privacySettings]}
                      onChange={(e) => setPrivacySettings({
                        ...privacySettings,
                        [key]: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">AI Career Pathways</h2>
              <p className="text-gray-600">Personalized career paths based on your profile and goals</p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <Sparkles className="w-6 h-6 text-blue-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">3-5 Career Pathways Generated</h4>
                  <p className="text-sm text-blue-700">
                    Based on your skills, experience, and industry trends, we've created personalized career pathways for you.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: 'Senior Software Engineer',
                  industry: 'Technology',
                  timeline: '18-24 months',
                  probability: '85%',
                  color: 'blue'
                },
                {
                  title: 'Engineering Manager',
                  industry: 'Technology',
                  timeline: '24-36 months',
                  probability: '72%',
                  color: 'purple'
                },
                {
                  title: 'Solutions Architect',
                  industry: 'Cloud Computing',
                  timeline: '12-18 months',
                  probability: '78%',
                  color: 'green'
                }
              ].map((pathway, index) => (
                <div key={index} className={`border-2 border-${pathway.color}-200 bg-${pathway.color}-50 rounded-lg p-6 hover:shadow-lg transition-shadow`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{pathway.title}</h3>
                      <p className="text-sm text-gray-600">{pathway.industry}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold text-${pathway.color}-600`}>{pathway.probability}</div>
                      <div className="text-xs text-gray-600">Success Rate</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Timeline: {pathway.timeline}</span>
                    <button className={`px-4 py-2 bg-${pathway.color}-600 text-white rounded-lg hover:bg-${pathway.color}-700`}>
                      View Pathway
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <CheckCircle className="w-24 h-24 text-green-600 mx-auto mb-6" />
              <h2 className="text-4xl font-bold text-gray-900 mb-4">You're All Set!</h2>
              <p className="text-xl text-gray-600">Your Talent Core Profile is complete</p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Start Receiving Opportunities
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-2">🎯 Career Pathways</h4>
                  <p className="text-sm text-gray-600">AI-powered career recommendations</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-2">🏢 Business Matches</h4>
                  <p className="text-sm text-gray-600">Companies aligned with your profile</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-2">📡 Opportunity Radar</h4>
                  <p className="text-sm text-gray-600">New roles flagged in real-time</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-2">📍 Proximity Match</h4>
                  <p className="text-sm text-gray-600">Local opportunities near you</p>
                </div>
              </div>

              <div className="text-center">
                <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg">
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 inline ml-2" />
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-semibold text-blue-900 mb-3">🔒 Silent Interaction Mode</h4>
              <p className="text-sm text-blue-700">
                You can now interact with businesses silently. They'll see your profile when you apply, 
                but you control all visibility settings. Build pre-employment relationships without revealing 
                your identity until you're ready.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Talent Onboarding</h1>
            <span className="text-sm text-gray-600">
              Step {currentStep} of {steps.length}
            </span>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
                    ${step.status === 'completed' ? 'bg-green-600 border-green-600' : 
                      step.status === 'current' ? 'bg-blue-600 border-blue-600' : 
                      'bg-white border-gray-300'}
                  `}>
                    <step.icon className={`w-6 h-6 ${
                      step.status === 'completed' || step.status === 'current' ? 'text-white' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="text-xs mt-2 text-center text-gray-600 hidden sm:block">
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 ${
                    step.status === 'completed' ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={currentStep === steps.length}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                currentStep === steps.length
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
              <ArrowRight className="w-4 h-4 inline ml-2" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
