import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Country {
  id: number
  code: string
  name: string
  iso3?: string
  phone_code?: string
}

export interface State {
  id: number
  country_id: number
  code?: string
  name: string
}

export interface City {
  id: number
  state_id?: number
  country_id: number
  name: string
}

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCountries() {
      try {
        setLoading(true)
        const { data, error: fetchError } = await supabase
          .from('countries')
          .select('*')
          .order('name', { ascending: true })

        if (fetchError) throw fetchError
        setCountries(data || [])
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to load countries')
        setCountries([])
      } finally {
        setLoading(false)
      }
    }

    fetchCountries()
  }, [])

  return { countries, loading, error }
}

export function useStates(countryId: number | null) {
  const [states, setStates] = useState<State[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!countryId) {
      setStates([])
      return
    }

    async function fetchStates() {
      try {
        setLoading(true)
        const { data, fetchError } = await supabase
          .from('states')
          .select('*')
          .eq('country_id', countryId)
          .order('name', { ascending: true })

        if (fetchError) throw fetchError
        setStates(data || [])
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to load states')
        setStates([])
      } finally {
        setLoading(false)
      }
    }

    fetchStates()
  }, [countryId])

  return { states, loading, error }
}

export function useCities(countryId: number | null, stateId: number | null) {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!countryId) {
      setCities([])
      return
    }

    async function fetchCities() {
      try {
        setLoading(true)
        let query = supabase
          .from('cities')
          .select('*')
          .eq('country_id', countryId)

        if (stateId) {
          query = query.eq('state_id', stateId)
        }

        const { data, fetchError } = await query.order('name', { ascending: true })

        if (fetchError) throw fetchError
        setCities(data || [])
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to load cities')
        setCities([])
      } finally {
        setLoading(false)
      }
    }

    fetchCities()
  }, [countryId, stateId])

  return { cities, loading, error }
}
