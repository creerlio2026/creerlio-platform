'use client'

import React from 'react'
import { useCountries, useStates, useCities, type Country, type State, type City } from '@/hooks/useLocations'

interface LocationDropdownsProps {
  countryId: number | null
  stateId: number | null
  cityId: number | null
  onCountryChange: (countryId: number | null) => void
  onStateChange: (stateId: number | null) => void
  onCityChange: (cityId: number | null) => void
  countryValue?: string | null // For backward compatibility with string values
  stateValue?: string | null
  cityValue?: string | null
  className?: string
  required?: boolean
  disabled?: boolean
}

export default function LocationDropdowns({
  countryId,
  stateId,
  cityId,
  onCountryChange,
  onStateChange,
  onCityChange,
  countryValue,
  stateValue,
  cityValue,
  className = '',
  required = false,
  disabled = false,
}: LocationDropdownsProps) {
  const { countries, loading: countriesLoading } = useCountries()
  const { states, loading: statesLoading } = useStates(countryId)
  const { cities, loading: citiesLoading } = useCities(countryId, stateId)

  // Resolve IDs from string values if provided (for backward compatibility)
  const resolvedCountryId = countryId || (countryValue ? countries.find(c => c.name === countryValue || c.code === countryValue)?.id || null : null)
  const resolvedStateId = stateId || (stateValue ? states.find(s => s.name === stateValue || s.code === stateValue)?.id || null : null)
  const resolvedCityId = cityId || (cityValue ? cities.find(c => c.name === cityValue)?.id || null : null)

  // Update parent when IDs are resolved from string values
  React.useEffect(() => {
    if (countryValue && !countryId && resolvedCountryId) {
      onCountryChange(resolvedCountryId)
    }
  }, [countryValue, countryId, resolvedCountryId, onCountryChange])

  React.useEffect(() => {
    if (stateValue && !stateId && resolvedStateId) {
      onStateChange(resolvedStateId)
    }
  }, [stateValue, stateId, resolvedStateId, onStateChange])

  React.useEffect(() => {
    if (cityValue && !cityId && resolvedCityId) {
      onCityChange(resolvedCityId)
    }
  }, [cityValue, cityId, resolvedCityId, onCityChange])

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const id = value ? parseInt(value, 10) : null
    onCountryChange(id)
    // Reset state and city when country changes
    onStateChange(null)
    onCityChange(null)
  }

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const id = value ? parseInt(value, 10) : null
    onStateChange(id)
    // Reset city when state changes
    onCityChange(null)
  }

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const id = value ? parseInt(value, 10) : null
    onCityChange(id)
  }

  return (
    <div className={`grid md:grid-cols-3 gap-4 ${className}`}>
      {/* Country */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Country {required && <span className="text-red-400">*</span>}
        </label>
        <select
          value={resolvedCountryId || ''}
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
      </div>

      {/* State/Province */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          State/Province {required && <span className="text-red-400">*</span>}
        </label>
        <select
          value={resolvedStateId || ''}
          onChange={handleStateChange}
          disabled={disabled || statesLoading || !resolvedCountryId}
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
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          City {required && <span className="text-red-400">*</span>}
        </label>
        <select
          value={resolvedCityId || ''}
          onChange={handleCityChange}
          disabled={disabled || citiesLoading || !resolvedCountryId}
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
      </div>
    </div>
  )
}
