'use client'

import React, { useState, useEffect } from 'react'
import { useCountries, useStates, useCities } from '@/hooks/useLocations'

interface LocationDropdownsStringProps {
  country: string
  state: string
  city: string
  onCountryChange: (country: string) => void
  onStateChange: (state: string) => void
  onCityChange: (city: string) => void
  className?: string
  required?: boolean
  disabled?: boolean
}

export default function LocationDropdownsString({
  country,
  state,
  city,
  onCountryChange,
  onStateChange,
  onCityChange,
  className = '',
  required = false,
  disabled = false,
}: LocationDropdownsStringProps) {
  const { countries, loading: countriesLoading } = useCountries()
  
  // Find country ID from country name
  const selectedCountry = countries.find(c => c.name === country || c.code === country)
  const countryId = selectedCountry?.id || null
  
  const { states, loading: statesLoading } = useStates(countryId)
  
  // Find state ID from state name
  const selectedState = states.find(s => s.name === state || s.code === state)
  const stateId = selectedState?.id || null
  
  const { cities, loading: citiesLoading } = useCities(countryId, stateId)

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCountry = countries.find(c => c.id === parseInt(e.target.value, 10))
    onCountryChange(selectedCountry?.name || '')
    // Reset state and city when country changes
    onStateChange('')
    onCityChange('')
  }

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedState = states.find(s => s.id === parseInt(e.target.value, 10))
    onStateChange(selectedState?.name || '')
    // Reset city when state changes
    onCityChange('')
  }

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCity = cities.find(c => c.id === parseInt(e.target.value, 10))
    onCityChange(selectedCity?.name || '')
  }

  // Find current selections
  const selectedCountryId = selectedCountry?.id || ''
  const selectedStateId = states.find(s => s.name === state)?.id || ''
  const selectedCityId = cities.find(c => c.name === city)?.id || ''

  // Show error if countries failed to load
  if (countries.length === 0 && !countriesLoading) {
    return (
      <div className={`grid md:grid-cols-3 gap-4 ${className}`}>
        <div className="col-span-3 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
          <p className="text-sm text-yellow-400">
            Location dropdowns are not available. Please ensure the database migration <code className="bg-black/20 px-1 rounded">2025122502_location_tables.sql</code> has been run.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`grid md:grid-cols-3 gap-4 ${className}`}>
      {/* Country */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Country {required && <span className="text-red-400">*</span>}
        </label>
        <select
          value={selectedCountryId}
          onChange={handleCountryChange}
          disabled={disabled || countriesLoading}
          required={required}
          className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select Country</option>
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>
        {countriesLoading && <p className="text-xs text-gray-400 mt-1">Loading countries...</p>}
      </div>

      {/* State/Province */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          State/Province {required && <span className="text-red-400">*</span>}
        </label>
        <select
          value={selectedStateId}
          onChange={handleStateChange}
          disabled={disabled || statesLoading || !countryId}
          required={required}
          className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select State/Province</option>
          {states.map((state) => (
            <option key={state.id} value={state.id}>
              {state.name}
            </option>
          ))}
        </select>
        {statesLoading && <p className="text-xs text-gray-400 mt-1">Loading states...</p>}
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          City {required && <span className="text-red-400">*</span>}
        </label>
        <select
          value={selectedCityId}
          onChange={handleCityChange}
          disabled={disabled || citiesLoading || !countryId}
          required={required}
          className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select City</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        {citiesLoading && <p className="text-xs text-gray-400 mt-1">Loading cities...</p>}
      </div>
    </div>
  )
}
