const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function inspectSchema() {
  console.log('\n=== INSPECTING BUSINESS_PROFILES TABLE ===\n')

  // Get all business profiles to see actual column names
  const { data: profiles, error: profilesError } = await supabase
    .from('business_profiles')
    .select('*')
    .limit(1)

  if (profilesError) {
    console.error('Error fetching business_profiles:', profilesError)
  } else if (profiles && profiles.length > 0) {
    console.log('Available columns in business_profiles:')
    console.log(Object.keys(profiles[0]))
  }

  console.log('\n=== SEARCHING FOR PEOPLESELECT ===\n')

  // Try to find PeopleSelect by business_name
  const { data: peopleselect, error: psError } = await supabase
    .from('business_profiles')
    .select('*')
    .ilike('business_name', '%peopleselect%')

  if (psError) {
    console.error('Error searching for PeopleSelect:', psError)
  } else {
    const count = peopleselect ? peopleselect.length : 0
    console.log('Found ' + count + ' businesses matching "peopleselect"')
    if (peopleselect && peopleselect.length > 0) {
      console.log('\nPeopleSelect record:')
      console.log(JSON.stringify(peopleselect[0], null, 2))
    }
  }

  console.log('\n=== INSPECTING BUSINESS_PROFILE_PAGES TABLE ===\n')

  const { data: pages, error: pagesError } = await supabase
    .from('business_profile_pages')
    .select('*')
    .limit(1)

  if (pagesError) {
    console.error('Error fetching business_profile_pages:', pagesError)
  } else if (pages && pages.length > 0) {
    console.log('Available columns in business_profile_pages:')
    console.log(Object.keys(pages[0]))
  } else {
    console.log('No records in business_profile_pages table')
  }
}

inspectSchema().then(() => process.exit(0))
