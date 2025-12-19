'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

interface PortfolioData {
  name: string
  title: string
  bio: string
  skills: string[]
  experience: Array<{
    company: string
    title: string
    startDate: string
    endDate: string
    description: string
  }>
  education: Array<{
    institution: string
    degree: string
    field: string
    year: string
  }>
  projects: Array<{
    name: string
    description: string
    url: string
  }>
}

interface TalentBankItem {
  id: number
  item_type: string
  title: string
  metadata?: any
}

export default function PortfolioEditor() {
  const [portfolio, setPortfolio] = useState<PortfolioData>({
    name: '',
    title: '',
    bio: '',
    skills: [],
    experience: [],
    education: [],
    projects: []
  })

  const [newSkill, setNewSkill] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [bankItems, setBankItems] = useState<TalentBankItem[]>([])

  const defaultEmail = 'talent@creerlio.local'

  useEffect(() => {
    // Prefill portfolio from Talent Bank where possible
    loadFromTalentBank()
  }, [])

  const loadFromTalentBank = async () => {
    try {
      setIsImporting(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

      // Fetch experience and education items from the Talent Bank
      const [experienceRes, educationRes] = await Promise.all([
        axios.get(`${apiUrl}/api/talent-bank/items`, {
          params: { email: defaultEmail, item_type: 'experience' }
        }),
        axios.get(`${apiUrl}/api/talent-bank/items`, {
          params: { email: defaultEmail, item_type: 'education' }
        })
      ])

      const experienceItems: TalentBankItem[] = experienceRes.data?.items ?? []
      const educationItems: TalentBankItem[] = educationRes.data?.items ?? []

      const mappedExperience = experienceItems.map((item) => ({
        company: item.metadata?.company || item.title,
        title: item.metadata?.title || '',
        startDate: item.metadata?.startDate || '',
        endDate: item.metadata?.endDate || '',
        description: item.metadata?.description || item.metadata?.summary || ''
      }))

      const mappedEducation = educationItems.map((item) => ({
        institution: item.metadata?.institution || item.title,
        degree: item.metadata?.degree || '',
        field: item.metadata?.field || '',
        year:
          item.metadata?.year ||
          item.metadata?.endDate ||
          item.metadata?.completionYear ||
          ''
      }))

      setPortfolio((prev) => ({
        ...prev,
        experience: mappedExperience.length ? mappedExperience : prev.experience,
        education: mappedEducation.length ? mappedEducation : prev.education
      }))

      setBankItems([...experienceItems, ...educationItems])
    } catch (error) {
      console.error('Error loading from Talent Bank:', error)
    } finally {
      setIsImporting(false)
    }
  }

  const addSkill = () => {
    if (newSkill.trim()) {
      setPortfolio({
        ...portfolio,
        skills: [...portfolio.skills, newSkill.trim()]
      })
      setNewSkill('')
    }
  }

  const removeSkill = (index: number) => {
    setPortfolio({
      ...portfolio,
      skills: portfolio.skills.filter((_, i) => i !== index)
    })
  }

  const addExperience = () => {
    setPortfolio({
      ...portfolio,
      experience: [
        ...portfolio.experience,
        { company: '', title: '', startDate: '', endDate: '', description: '' }
      ]
    })
  }

  const updateExperience = (index: number, field: string, value: string) => {
    const updated = [...portfolio.experience]
    updated[index] = { ...updated[index], [field]: value }
    setPortfolio({ ...portfolio, experience: updated })
  }

  const savePortfolio = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

      // Persist structured portfolio data into the user's Talent Profile,
      // but all underlying assets and records are expected to live in the Talent Bank.
      const response = await fetch(`${apiUrl}/api/talent/me?email=${encodeURIComponent(defaultEmail)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: portfolio.name,
          title: portfolio.title,
          bio: portfolio.bio,
          skills: portfolio.skills,
          portfolio_data: portfolio
        })
      })

      if (response.ok) {
        alert('Portfolio saved successfully (linked to Talent Bank data)!')
      } else {
        alert('Error saving portfolio')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error saving portfolio')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Portfolio Editor</h1>
      
      <div className="space-y-6">
        {/* Basic Information */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={portfolio.name}
              onChange={(e) => setPortfolio({ ...portfolio, name: e.target.value })}
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              placeholder="Professional Title"
              value={portfolio.title}
              onChange={(e) => setPortfolio({ ...portfolio, title: e.target.value })}
              className="w-full p-2 border rounded"
            />
            <textarea
              placeholder="Bio / Summary"
              value={portfolio.bio}
              onChange={(e) => setPortfolio({ ...portfolio, bio: e.target.value })}
              className="w-full p-2 border rounded"
              rows={4}
            />
          </div>
        </section>

        {/* Skills */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Skills</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Add skill"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={addSkill}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {portfolio.skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-200 rounded-full flex items-center gap-2"
              >
                {skill}
                <button
                  onClick={() => removeSkill(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* Experience */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Work Experience</h2>
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={addExperience}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Add Experience
            </button>
            <button
              type="button"
              onClick={loadFromTalentBank}
              disabled={isImporting}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-60"
            >
              {isImporting ? 'Importing from Talent Bank...' : 'Import from Talent Bank'}
            </button>
          </div>
          {portfolio.experience.map((exp, index) => (
            <div key={index} className="mb-4 p-4 border rounded">
              <input
                type="text"
                placeholder="Company"
                value={exp.company}
                onChange={(e) => updateExperience(index, 'company', e.target.value)}
                className="w-full mb-2 p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Job Title"
                value={exp.title}
                onChange={(e) => updateExperience(index, 'title', e.target.value)}
                className="w-full mb-2 p-2 border rounded"
              />
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Start Date"
                  value={exp.startDate}
                  onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                  className="p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="End Date"
                  value={exp.endDate}
                  onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                  className="p-2 border rounded"
                />
              </div>
              <textarea
                placeholder="Description"
                value={exp.description}
                onChange={(e) => updateExperience(index, 'description', e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>
          ))}
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={savePortfolio}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Save Portfolio
          </button>
        </div>
      </div>
    </div>
  )
}



