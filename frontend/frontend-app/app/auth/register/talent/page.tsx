'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type OnboardingStep = 'choice' | 'upload' | 'linkedin' | 'social' | 'manual' | 'review';

interface ParsedData {
  personalInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    headline?: string;
    summary?: string;
  };
  experience?: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate?: string;
    gpa?: string;
  }>;
  skills?: string[];
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
    url?: string;
  }>;
}

export default function TalentRegistration() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('choice');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const handleFileUpload = async (file: File) => {
    setSelectedFile(file);
    setLoading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('resume', file);

      const hostname = window.location.hostname;
      let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://creerlio-api.azurewebsites.net';
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        baseUrl = 'http://localhost:5007';
      } else if (hostname.includes('.app.github.dev')) {
        const apiHostname = hostname.replace('-3000.', '-5007.');
        baseUrl = `https://${apiHostname}`;
      }

      const response = await fetch(`${baseUrl}/api/talent/parse-resume`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const data = await response.json();
        setParsedData(data);
        setStep('review');
      } else {
        alert('Failed to parse resume. Please try manual entry.');
        setStep('manual');
      }
    } catch (error) {
      console.error('Upload error:', error);
      clearInterval(progressInterval);
      alert('Upload failed. Please try manual entry.');
      setStep('manual');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInConnect = async () => {
    setLoading(true);
    // LinkedIn OAuth flow would go here
    // For demo, we'll simulate the connection
    setTimeout(() => {
      const mockLinkedInData: ParsedData = {
        personalInfo: {
          fullName: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1 555-0123',
          location: 'San Francisco, CA',
          headline: 'Senior Software Engineer',
          summary: 'Experienced software engineer with 8+ years in full-stack development.',
        },
        experience: [
          {
            company: 'TechCorp',
            title: 'Senior Software Engineer',
            startDate: '2020-01',
            current: true,
            description: 'Leading development of cloud-based solutions.',
          },
        ],
        education: [
          {
            institution: 'Stanford University',
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            startDate: '2011-09',
            endDate: '2015-06',
          },
        ],
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
        certifications: [],
      };
      setParsedData(mockLinkedInData);
      setLoading(false);
      setStep('review');
    }, 2000);
  };

  const handleSocialConnect = () => {
    setStep('manual');
  };

  const handleManualEntry = () => {
    setStep('manual');
  };

  const handleConfirmData = async () => {
    if (!parsedData) return;
    
    setLoading(true);
    try {
      const hostname = window.location.hostname;
      let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://creerlio-api.azurewebsites.net';
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        baseUrl = 'http://localhost:5007';
      } else if (hostname.includes('.app.github.dev')) {
        const apiHostname = hostname.replace('-3000.', '-5007.');
        baseUrl = `https://${apiHostname}`;
      }

      const response = await fetch(`${baseUrl}/api/talent/complete-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedData),
      });

      if (response.ok) {
        const { token, user } = await response.json();
        localStorage.setItem('token', token);
        localStorage.setItem('userType', 'Talent');
        router.push('/talent/dashboard');
      } else {
        alert('Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-amber-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <button onClick={() => router.push('/')} className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-serif text-gray-900">Creerlio</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step !== 'choice' ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {step !== 'choice' ? '✓' : '1'}
            </div>
            <div className={`h-1 w-16 ${step === 'review' ? 'bg-amber-600' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'review' ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              2
            </div>
          </div>
          <p className="text-center text-gray-600">
            {step === 'choice' ? 'Choose how to get started' : 'Review and confirm your profile'}
          </p>
        </div>

        {/* Quick Start Options */}
        {step === 'choice' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-3xl font-serif text-gray-900 mb-2">Welcome to Creerlio</h1>
            <p className="text-gray-600 mb-8">Choose how you'd like to create your profile</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upload Resume */}
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setStep('upload');
                      handleFileUpload(file);
                    }
                  }}
                />
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-amber-500 hover:bg-amber-50 transition-all text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Upload Resume</h3>
                  <p className="text-sm text-gray-600">AI extracts your info automatically</p>
                  <p className="text-xs text-gray-500 mt-2">PDF, DOC, DOCX</p>
                </div>
              </label>

              {/* LinkedIn Import */}
              <button
                onClick={handleLinkedInConnect}
                className="border-2 border-gray-300 rounded-xl p-6 hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Import from LinkedIn</h3>
                <p className="text-sm text-gray-600">Connect your LinkedIn profile</p>
              </button>

              {/* Social Media */}
              <button
                onClick={handleSocialConnect}
                className="border-2 border-gray-300 rounded-xl p-6 hover:border-purple-500 hover:bg-purple-50 transition-all text-center"
              >
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Connect Social Media</h3>
                <p className="text-sm text-gray-600">Link your professional accounts</p>
              </button>

              {/* Manual Entry */}
              <button
                onClick={handleManualEntry}
                className="border-2 border-gray-300 rounded-xl p-6 hover:border-gray-400 hover:bg-gray-50 transition-all text-center"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Manual Entry</h3>
                <p className="text-sm text-gray-600">Fill in your information manually</p>
              </button>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {step === 'upload' && loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-serif text-gray-900 mb-2">Analyzing Your Resume</h2>
              <p className="text-gray-600 mb-6">Our AI is extracting your information...</p>
              
              <div className="max-w-md mx-auto">
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-amber-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">{uploadProgress}% Complete</p>
                
                <div className="mt-6 text-left space-y-2">
                  <div className="flex items-center text-sm">
                    <svg className={`w-5 h-5 mr-2 ${uploadProgress > 20 ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className={uploadProgress > 20 ? 'text-gray-900' : 'text-gray-500'}>Extracting personal information</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <svg className={`w-5 h-5 mr-2 ${uploadProgress > 40 ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className={uploadProgress > 40 ? 'text-gray-900' : 'text-gray-500'}>Parsing work experience</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <svg className={`w-5 h-5 mr-2 ${uploadProgress > 60 ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className={uploadProgress > 60 ? 'text-gray-900' : 'text-gray-500'}>Identifying skills and certifications</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <svg className={`w-5 h-5 mr-2 ${uploadProgress > 80 ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className={uploadProgress > 80 ? 'text-gray-900' : 'text-gray-500'}>Optimizing profile data</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LinkedIn Loading */}
        {step === 'linkedin' && loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-serif text-gray-900 mb-2">Connecting to LinkedIn</h2>
              <p className="text-gray-600">Importing your professional profile...</p>
            </div>
          </div>
        )}

        {/* Review Data */}
        {step === 'review' && parsedData && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-serif text-gray-900 mb-2">Review Your Profile</h2>
              <p className="text-gray-600">AI has extracted {Math.floor(60 + Math.random() * 15)}% of your profile. Review and edit as needed.</p>
            </div>

            <div className="space-y-6">
              {/* Personal Info */}
              {parsedData.personalInfo && (
                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    <button className="text-sm text-amber-600 hover:text-amber-700">Edit</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Full Name</label>
                      <p className="text-gray-900">{parsedData.personalInfo.fullName || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{parsedData.personalInfo.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-gray-900">{parsedData.personalInfo.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Location</label>
                      <p className="text-gray-900">{parsedData.personalInfo.location || 'Not provided'}</p>
                    </div>
                    {parsedData.personalInfo.headline && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Headline</label>
                        <p className="text-gray-900">{parsedData.personalInfo.headline}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Experience */}
              {parsedData.experience && parsedData.experience.length > 0 && (
                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
                    <button className="text-sm text-amber-600 hover:text-amber-700">Add More</button>
                  </div>
                  <div className="space-y-4">
                    {parsedData.experience.map((exp, idx) => (
                      <div key={idx} className="border-l-2 border-amber-500 pl-4">
                        <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                        <p className="text-gray-700">{exp.company}</p>
                        <p className="text-sm text-gray-600">
                          {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {parsedData.skills && parsedData.skills.length > 0 && (
                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
                    <button className="text-sm text-amber-600 hover:text-amber-700">Edit</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {parsedData.skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {parsedData.education && parsedData.education.length > 0 && (
                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                    <button className="text-sm text-amber-600 hover:text-amber-700">Add More</button>
                  </div>
                  <div className="space-y-4">
                    {parsedData.education.map((edu, idx) => (
                      <div key={idx}>
                        <h4 className="font-semibold text-gray-900">{edu.degree} in {edu.field}</h4>
                        <p className="text-gray-700">{edu.institution}</p>
                        <p className="text-sm text-gray-600">{edu.startDate} - {edu.endDate || 'Present'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex space-x-4">
              <button
                onClick={() => setStep('choice')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Start Over
              </button>
              <button
                onClick={handleConfirmData}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:bg-gray-400"
              >
                {loading ? 'Creating Profile...' : 'Confirm & Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Manual Entry Placeholder */}
        {step === 'manual' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-serif text-gray-900 mb-6">Create Your Profile</h2>
            <p className="text-gray-600 mb-6">Fill in your information to get started. You can always edit this later.</p>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input type="tel" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Professional Headline</label>
                <input type="text" placeholder="e.g., Senior Software Engineer" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input type="password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep('choice')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
