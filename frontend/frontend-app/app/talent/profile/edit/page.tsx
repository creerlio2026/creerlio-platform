'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AutocompleteInput from '@/components/AutocompleteInput';
import { 
  JOB_TITLES, 
  AUSTRALIAN_CITIES, 
  AUSTRALIAN_STATES, 
  INDUSTRIES,
  SKILLS,
  CERTIFICATIONS,
  COMPANIES,
  UNIVERSITIES,
  DEGREES,
  EMPLOYMENT_TYPES
} from '@/lib/autocompleteData';
import {
  fileToUploadedFile,
  saveUploadedFile,
  getUploadedFiles,
  removeUploadedFile,
  validateFile,
  formatFileSize,
  UploadedFile
} from '@/lib/fileUploadUtils';

interface WorkExperience {
  id: string;
  jobTitle: string;
  company: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  currentPosition: boolean;
  location: string;
  industry: string;
  department: string;
  teamSize: string;
  roleOverview: string;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  certificationId: string;
  issueDate: string;
  expiryDate: string;
  noExpiration: boolean;
  verificationUrl: string;
  status: string;
}

export default function TalentEditProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // File uploads
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [portfolioImages, setPortfolioImages] = useState<UploadedFile[]>([]);
  const [portfolioVideos, setPortfolioVideos] = useState<UploadedFile[]>([]);
  const [resumeFile, setResumeFile] = useState<UploadedFile | null>(null);
  
  // Form data with autocomplete
  const [formData, setFormData] = useState({
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+61 412 345 678',
    city: 'Sydney, NSW',
    state: 'NSW - New South Wales',
    headline: 'Senior Software Engineer | Full Stack Developer',
    summary: 'Passionate software engineer with 8+ years of experience...'
  });
  
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [skills, setSkills] = useState<string[]>(['React', 'Node.js', 'AWS']);
  
  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
    { id: 'skills', label: 'Skills' },
    { id: 'certifications', label: 'Certifications' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'awards', label: 'Awards' },
    { id: 'references', label: 'References' },
    { id: 'preferences', label: 'Career Preferences' },
    { id: 'privacy', label: 'Privacy' }
  ];

  // Load persisted files on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const savedPortfolio = await getUploadedFiles(userId, 'portfolio');
        setPortfolioImages(savedPortfolio);
        
        const savedVideos = await getUploadedFiles(userId, 'video');
        setPortfolioVideos(savedVideos);
        
        const savedResume = await getUploadedFiles(userId, 'resume');
        if (savedResume.length > 0) {
          setResumeFile(savedResume[0]);
        }
        
        // Load profile photo from localStorage
        const savedPhoto = localStorage.getItem(`profilePhoto_${userId}`);
        if (savedPhoto) {
          setProfilePhoto(savedPhoto);
        }
      } catch (error) {
        console.error('Error loading files:', error);
      }
    };
    
    loadFiles();
  }, [userId]);

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, ['image/*'], 5);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setProfilePhoto(dataUrl);
      localStorage.setItem(`profilePhoto_${userId}`, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages: UploadedFile[] = [];

    for (const file of files) {
      const validation = validateFile(file, ['image/*'], 10);
      if (!validation.valid) {
        alert(`${file.name}: ${validation.error}`);
        continue;
      }

      const uploadedFile = await fileToUploadedFile(file, 'portfolio');
      const result = await saveUploadedFile(userId, 'portfolio', uploadedFile);
      
      if (result.success) {
        newImages.push(uploadedFile);
        if (result.error) {
          // Warning message if storage was cleared
          alert(result.error);
        }
      } else {
        alert(`Failed to save ${file.name}: ${result.error || 'Unknown error'}`);
      }
    }

    setPortfolioImages([...portfolioImages, ...newImages]);
  };

  const removePortfolioImage = async (fileId: string) => {
    await removeUploadedFile(userId, 'portfolio', fileId);
    setPortfolioImages(portfolioImages.filter(img => img.id !== fileId));
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newVideos: UploadedFile[] = [];

    for (const file of files) {
      const validation = validateFile(file, ['video/*'], 100); // 100MB limit for videos
      if (!validation.valid) {
        alert(`❌ ${file.name}: ${validation.error}`);
        continue;
      }

      try {
        // Show processing message for large files
        if (file.size > 10 * 1024 * 1024) {
          console.log(`Processing large video file: ${file.name} (${formatFileSize(file.size)})`);
        }

        // Convert file for preview
        const uploadedFile = await fileToUploadedFile(file, 'video');
        
        // Save to IndexedDB (passing original file)
        const result = await saveUploadedFile(userId, 'video', uploadedFile, file);
        
        if (result.success) {
          newVideos.push(uploadedFile);
          console.log(`✅ Video uploaded successfully: ${file.name}`);
        } else {
          // Show user-friendly error message
          alert(`❌ Failed to upload ${file.name}\n\n${result.error || 'Unknown error'}\n\nTip: Try closing other tabs or removing old videos to free up space.`);
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        alert(`❌ Failed to upload ${file.name}\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or use a smaller file.`);
      }
    }

    if (newVideos.length > 0) {
      setPortfolioVideos([...portfolioVideos, ...newVideos]);
      alert(`✅ Successfully uploaded ${newVideos.length} video(s) using IndexedDB storage!`);
    }
  };

  const removePortfolioVideo = async (fileId: string) => {
    try {
      await removeUploadedFile(userId, 'video', fileId);
      setPortfolioVideos(portfolioVideos.filter(vid => vid.id !== fileId));
    } catch (error) {
      console.error('Error removing video:', error);
      alert('Failed to remove video. Please try again.');
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], 5);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const uploadedFile = await fileToUploadedFile(file, 'resume');
    const result = await saveUploadedFile(userId, 'resume', uploadedFile);
    
    if (result.success) {
      setResumeFile(uploadedFile);
      // Trigger AI parsing (future enhancement)
      alert('Resume uploaded! AI parsing will pre-fill your profile in production.');
    } else {
      alert(`Failed to upload resume: ${result.error || 'Unknown error'}`);
    }
  };

  const addWorkExperience = () => {
    const newExp: WorkExperience = {
      id: Date.now().toString(),
      jobTitle: '',
      company: '',
      employmentType: 'Full-time',
      startDate: '',
      endDate: '',
      currentPosition: false,
      location: '',
      industry: '',
      department: '',
      teamSize: '',
      roleOverview: '',
      responsibilities: [''],
      achievements: [''],
      technologies: []
    };
    setWorkExperiences([...workExperiences, newExp]);
  };

  const addCertification = () => {
    const newCert: Certification = {
      id: Date.now().toString(),
      name: '',
      issuer: '',
      certificationId: '',
      issueDate: '',
      expiryDate: '',
      noExpiration: false,
      verificationUrl: '',
      status: 'Active'
    };
    setCertifications([...certifications, newCert]);
  };

  const handleSave = async () => {
    setSaving(true);
    // In production, save to backend API
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert('Profile updated successfully!');
    setSaving(false);
    router.push('/talent/profile');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-600 mt-2">Complete your professional profile with intelligent auto-complete</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/talent/profile')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-6 py-3 bg-amber-600 text-white rounded-lg font-medium ${
                saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-amber-700'
              }`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-8">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-amber-50 text-amber-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="flex-1">
            {activeTab === 'basic' && (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
                
                {/* Profile Photo with persistence */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Profile Photo</label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-bold text-amber-700">SJ</span>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoUpload}
                        id="profile-photo"
                        className="hidden"
                      />
                      <label 
                        htmlFor="profile-photo" 
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer inline-block font-medium"
                      >
                        Upload Photo
                      </label>
                      {profilePhoto && (
                        <button
                          onClick={() => {
                            setProfilePhoto(null);
                            localStorage.removeItem(`profilePhoto_${userId}`);
                          }}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF (max 5MB) - Photo persists across sessions</p>
                </div>

                {/* AI Import Options */}
                <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-3">🤖 Quick Import (AI-Powered)</h3>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                      Import from LinkedIn
                    </button>
                    <label className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium cursor-pointer flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload Resume (AI Parse)
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {resumeFile && (
                    <div className="mt-3 p-3 bg-white rounded border border-green-300">
                      <p className="text-sm text-gray-700">
                        ✓ Resume uploaded: <span className="font-medium">{resumeFile.name}</span> ({formatFileSize(resumeFile.size)})
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <input 
                      type="text" 
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                    <input 
                      type="text" 
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500" 
                    />
                  </div>
                  <AutocompleteInput
                    label="City"
                    value={formData.city}
                    onChange={(val) => setFormData({...formData, city: val})}
                    options={AUSTRALIAN_CITIES.map(c => ({ value: c.value, label: c.label, metadata: c.state }))}
                    placeholder="Start typing city name..."
                    required
                  />
                  <AutocompleteInput
                    label="State"
                    value={formData.state}
                    onChange={(val) => setFormData({...formData, state: val})}
                    options={AUSTRALIAN_STATES}
                    placeholder="Select state..."
                    required
                  />
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Professional Headline *</label>
                  <input 
                    type="text" 
                    value={formData.headline}
                    onChange={(e) => setFormData({...formData, headline: e.target.value})}
                    placeholder="e.g., Senior Software Engineer | Full Stack Developer"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500" 
                  />
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Professional Summary *</label>
                  <textarea 
                    rows={6} 
                    value={formData.summary}
                    onChange={(e) => setFormData({...formData, summary: e.target.value})}
                    placeholder="Tell us about your experience, expertise, and what you're looking for..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Min 100 characters recommended</p>
                </div>
              </div>
            )}

            {activeTab === 'experience' && (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Work Experience</h2>
                  <button 
                    onClick={addWorkExperience}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                  >
                    + Add Experience
                  </button>
                </div>

                {workExperiences.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500 mb-4">No work experience added yet</p>
                    <button 
                      onClick={addWorkExperience}
                      className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                    >
                      Add Your First Position
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {workExperiences.map((exp, index) => (
                      <div key={exp.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-lg text-gray-900">Position #{index + 1}</h3>
                          <button 
                            onClick={() => setWorkExperiences(workExperiences.filter(e => e.id !== exp.id))}
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <AutocompleteInput
                            label="Job Title"
                            value={exp.jobTitle}
                            onChange={(val) => {
                              const updated = [...workExperiences];
                              updated[index].jobTitle = val;
                              setWorkExperiences(updated);
                            }}
                            options={JOB_TITLES}
                            placeholder="e.g., Senior Software Engineer"
                            required
                          />

                          <AutocompleteInput
                            label="Company"
                            value={exp.company}
                            onChange={(val) => {
                              const updated = [...workExperiences];
                              updated[index].company = val;
                              setWorkExperiences(updated);
                            }}
                            options={COMPANIES}
                            placeholder="e.g., TechCorp Australia"
                            required
                          />

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type *</label>
                            <select 
                              value={exp.employmentType}
                              onChange={(e) => {
                                const updated = [...workExperiences];
                                updated[index].employmentType = e.target.value;
                                setWorkExperiences(updated);
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            >
                              {EMPLOYMENT_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>

                          <AutocompleteInput
                            label="Location"
                            value={exp.location}
                            onChange={(val) => {
                              const updated = [...workExperiences];
                              updated[index].location = val;
                              setWorkExperiences(updated);
                            }}
                            options={AUSTRALIAN_CITIES.map(c => ({ value: c.value, label: c.label }))}
                            placeholder="City, State"
                          />

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                            <input 
                              type="month"
                              value={exp.startDate}
                              onChange={(e) => {
                                const updated = [...workExperiences];
                                updated[index].startDate = e.target.value;
                                setWorkExperiences(updated);
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                            <input 
                              type="month"
                              value={exp.endDate}
                              onChange={(e) => {
                                const updated = [...workExperiences];
                                updated[index].endDate = e.target.value;
                                setWorkExperiences(updated);
                              }}
                              disabled={exp.currentPosition}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
                            />
                            <label className="flex items-center mt-2">
                              <input
                                type="checkbox"
                                checked={exp.currentPosition}
                                onChange={(e) => {
                                  const updated = [...workExperiences];
                                  updated[index].currentPosition = e.target.checked;
                                  if (e.target.checked) updated[index].endDate = '';
                                  setWorkExperiences(updated);
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">Current Position</span>
                            </label>
                          </div>

                          <AutocompleteInput
                            label="Industry"
                            value={exp.industry}
                            onChange={(val) => {
                              const updated = [...workExperiences];
                              updated[index].industry = val;
                              setWorkExperiences(updated);
                            }}
                            options={INDUSTRIES}
                            placeholder="e.g., Information Technology"
                          />

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                            <input 
                              type="text"
                              value={exp.department}
                              onChange={(e) => {
                                const updated = [...workExperiences];
                                updated[index].department = e.target.value;
                                setWorkExperiences(updated);
                              }}
                              placeholder="e.g., Engineering, Product Development"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Role Overview *</label>
                            <textarea 
                              rows={3}
                              value={exp.roleOverview}
                              onChange={(e) => {
                                const updated = [...workExperiences];
                                updated[index].roleOverview = e.target.value;
                                setWorkExperiences(updated);
                              }}
                              placeholder="Briefly describe your role and main responsibilities..."
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Min 100 characters</p>
                          </div>

                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Key Responsibilities</label>
                            <div className="space-y-2">
                              {exp.responsibilities.map((resp, respIndex) => (
                                <div key={respIndex} className="flex gap-2">
                                  <input 
                                    type="text"
                                    value={resp}
                                    onChange={(e) => {
                                      const updated = [...workExperiences];
                                      updated[index].responsibilities[respIndex] = e.target.value;
                                      setWorkExperiences(updated);
                                    }}
                                    placeholder="e.g., Led development of microservices architecture"
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                  />
                                  {respIndex > 0 && (
                                    <button
                                      onClick={() => {
                                        const updated = [...workExperiences];
                                        updated[index].responsibilities.splice(respIndex, 1);
                                        setWorkExperiences(updated);
                                      }}
                                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const updated = [...workExperiences];
                                  updated[index].responsibilities.push('');
                                  setWorkExperiences(updated);
                                }}
                                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                              >
                                + Add Responsibility
                              </button>
                            </div>
                          </div>

                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Major Achievements</label>
                            <div className="space-y-2">
                              {exp.achievements.map((ach, achIndex) => (
                                <div key={achIndex} className="flex gap-2">
                                  <input 
                                    type="text"
                                    value={ach}
                                    onChange={(e) => {
                                      const updated = [...workExperiences];
                                      updated[index].achievements[achIndex] = e.target.value;
                                      setWorkExperiences(updated);
                                    }}
                                    placeholder="e.g., Reduced API response time by 40%"
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                  />
                                  {achIndex > 0 && (
                                    <button
                                      onClick={() => {
                                        const updated = [...workExperiences];
                                        updated[index].achievements.splice(achIndex, 1);
                                        setWorkExperiences(updated);
                                      }}
                                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const updated = [...workExperiences];
                                  updated[index].achievements.push('');
                                  setWorkExperiences(updated);
                                }}
                                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                              >
                                + Add Achievement
                              </button>
                            </div>
                          </div>

                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Technologies/Tools Used</label>
                            <input 
                              type="text"
                              value={exp.technologies.join(', ')}
                              onChange={(e) => {
                                const updated = [...workExperiences];
                                updated[index].technologies = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                                setWorkExperiences(updated);
                              }}
                              placeholder="React, Node.js, AWS, Docker (separate with commas)"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'certifications' && (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Certifications</h2>
                  <button 
                    onClick={addCertification}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                  >
                    + Add Certification
                  </button>
                </div>

                {certifications.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500 mb-4">No certifications added yet</p>
                    <button 
                      onClick={addCertification}
                      className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                    >
                      Add Your First Certification
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {certifications.map((cert, index) => (
                      <div key={cert.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-lg text-gray-900">Certification #{index + 1}</h3>
                          <button 
                            onClick={() => setCertifications(certifications.filter(c => c.id !== cert.id))}
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <AutocompleteInput
                            label="Certification Name"
                            value={cert.name}
                            onChange={(val) => {
                              const updated = [...certifications];
                              updated[index].name = val;
                              setCertifications(updated);
                            }}
                            options={CERTIFICATIONS.map(c => ({ value: c.value, label: c.value, metadata: c.issuer }))}
                            placeholder="e.g., AWS Certified Solutions Architect"
                            required
                          />

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Issuing Organization *</label>
                            <input 
                              type="text"
                              value={cert.issuer}
                              onChange={(e) => {
                                const updated = [...certifications];
                                updated[index].issuer = e.target.value;
                                setCertifications(updated);
                              }}
                              placeholder="e.g., Amazon Web Services"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Certification ID</label>
                            <input 
                              type="text"
                              value={cert.certificationId}
                              onChange={(e) => {
                                const updated = [...certifications];
                                updated[index].certificationId = e.target.value;
                                setCertifications(updated);
                              }}
                              placeholder="Credential ID or Number"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Issue Date *</label>
                            <input 
                              type="month"
                              value={cert.issueDate}
                              onChange={(e) => {
                                const updated = [...certifications];
                                updated[index].issueDate = e.target.value;
                                setCertifications(updated);
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                            <input 
                              type="month"
                              value={cert.expiryDate}
                              onChange={(e) => {
                                const updated = [...certifications];
                                updated[index].expiryDate = e.target.value;
                                setCertifications(updated);
                              }}
                              disabled={cert.noExpiration}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
                            />
                            <label className="flex items-center mt-2">
                              <input
                                type="checkbox"
                                checked={cert.noExpiration}
                                onChange={(e) => {
                                  const updated = [...certifications];
                                  updated[index].noExpiration = e.target.checked;
                                  if (e.target.checked) updated[index].expiryDate = '';
                                  setCertifications(updated);
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">No Expiration</span>
                            </label>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select 
                              value={cert.status}
                              onChange={(e) => {
                                const updated = [...certifications];
                                updated[index].status = e.target.value;
                                setCertifications(updated);
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            >
                              <option value="Active">Active</option>
                              <option value="Expired">Expired</option>
                              <option value="Pending Renewal">Pending Renewal</option>
                            </select>
                          </div>

                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Verification URL</label>
                            <input 
                              type="url"
                              value={cert.verificationUrl}
                              onChange={(e) => {
                                const updated = [...certifications];
                                updated[index].verificationUrl = e.target.value;
                                setCertifications(updated);
                              }}
                              placeholder="https://www.credly.com/badges/..."
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Document</label>
                            <input 
                              type="file" 
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const validation = validateFile(file, ['application/pdf', 'image/*'], 5);
                                  if (validation.valid) {
                                    const uploadedFile = await fileToUploadedFile(file, 'certificate');
                                    saveUploadedFile(userId, 'certificate', uploadedFile);
                                    alert(`Certificate uploaded: ${file.name}`);
                                  } else {
                                    alert(validation.error);
                                  }
                                }
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG (max 5MB)</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'portfolio' && (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio Projects</h2>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Project Images (Persistent Storage)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-500 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePortfolioUpload}
                      id="portfolio-upload"
                      className="hidden"
                    />
                    <label htmlFor="portfolio-upload" className="cursor-pointer">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm font-medium text-gray-700">Click to upload portfolio images</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB each - Images persist across sessions</p>
                    </label>
                  </div>
                </div>

                {portfolioImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {portfolioImages.map((img) => (
                      <div key={img.id} className="relative group">
                        <img 
                          src={img.dataUrl} 
                          alt={img.name}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200" 
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                          <button
                            onClick={() => removePortfolioImage(img.id)}
                            className="opacity-0 group-hover:opacity-100 bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">{img.name}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(img.size)}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Video Upload Section */}
                <div className="mt-8">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Portfolio Videos</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-500 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="video/*"
                      onChange={handleVideoUpload}
                      id="video-upload"
                      className="hidden"
                    />
                    <label htmlFor="video-upload" className="cursor-pointer">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm font-medium text-gray-700">Click to upload portfolio videos</p>
                      <p className="text-xs text-gray-500 mt-1">MP4, MOV, AVI up to 100MB each - Videos persist across sessions</p>
                    </label>
                  </div>
                </div>

                {portfolioVideos.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    {portfolioVideos.map((vid) => (
                      <div key={vid.id} className="relative group bg-gray-100 rounded-lg border-2 border-gray-200 overflow-hidden">
                        <video 
                          src={vid.dataUrl} 
                          className="w-full h-40 object-cover"
                          controls
                        />
                        <div className="p-3">
                          <div className="absolute top-2 right-2">
                            <button
                              onClick={() => removePortfolioVideo(vid.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg"
                            >
                              Remove
                            </button>
                          </div>
                          <p className="text-xs text-gray-700 font-medium truncate">{vid.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(vid.size)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Other tabs remain similar but with autocomplete where applicable */}
            {activeTab === 'skills' && (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Skills</h2>
                <AutocompleteInput
                  label="Add Skills (type to search)"
                  value=""
                  onChange={(val) => {
                    if (val && !skills.includes(val)) {
                      setSkills([...skills, val]);
                    }
                  }}
                  options={SKILLS}
                  placeholder="Start typing skill name..."
                />
                <div className="flex flex-wrap gap-2 mt-4">
                  {skills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium flex items-center gap-2">
                      {skill}
                      <button
                        onClick={() => setSkills(skills.filter((_, i) => i !== idx))}
                        className="hover:text-amber-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'education' && (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Education</h2>
                <div className="space-y-4">
                  <AutocompleteInput
                    label="Institution"
                    value=""
                    onChange={() => {}}
                    options={UNIVERSITIES}
                    placeholder="University or College"
                    required
                  />
                  <AutocompleteInput
                    label="Degree"
                    value=""
                    onChange={() => {}}
                    options={DEGREES}
                    placeholder="Bachelor of Science, Master of..."
                    required
                  />
                </div>
              </div>
            )}

            {activeTab === 'awards' && (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Awards & Recognition</h2>
                <p className="text-gray-600">Add your professional awards and recognition here.</p>
              </div>
            )}

            {activeTab === 'references' && (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Professional References</h2>
                <p className="text-gray-600">Add references from previous employers or colleagues.</p>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Career Preferences</h2>
                <div className="space-y-6">
                  <AutocompleteInput
                    label="Preferred Job Titles"
                    value=""
                    onChange={() => {}}
                    options={JOB_TITLES}
                    placeholder="Roles you're interested in..."
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expected Salary (AUD)</label>
                    <input type="number" placeholder="150000" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-medium text-gray-900">Show email to recruiters</p>
                      <p className="text-sm text-gray-500">Allow businesses to see your email address</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-5 w-5" />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-medium text-gray-900">Show phone number</p>
                      <p className="text-sm text-gray-500">Display your contact number on your profile</p>
                    </div>
                    <input type="checkbox" className="h-5 w-5" />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-gray-900">Open to opportunities</p>
                      <p className="text-sm text-gray-500">Let recruiters know you're actively looking</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-5 w-5" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
