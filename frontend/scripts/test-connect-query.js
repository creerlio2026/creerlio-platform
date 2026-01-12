const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testConnectQuery() {
  const slug = 'peopleselect'

  console.log('\n=== TESTING CONNECT FLOW QUERY ===\n')
  console.log('Slug:', slug)

  // This is the EXACT query from the fixed connect page
  const { data: businessData, error: businessError } = await supabase
    .from('business_profiles')
    .select('id, business_name, description')
    .eq('slug', slug)
    .maybeSingle()

  console.log('\nQuery:', 'business_profiles.select(id, business_name, description).eq(slug, ' + slug + ')')

  if (businessError) {
    console.error('\n❌ ERROR:', businessError)
    process.exit(1)
  }

  if (!businessData) {
    console.error('\n❌ NO DATA RETURNED')
    process.exit(1)
  }

  console.log('\n✅ SUCCESS')
  console.log('\nReturned data:')
  console.log(JSON.stringify(businessData, null, 2))

  const row = {
    business_id: businessData.id,
    business_name: businessData.business_name
  }

  console.log('\nFinal row object:')
  console.log(JSON.stringify(row, null, 2))

  console.log('\n=== VERIFICATION ===')
  console.log('✅ business_id:', row.business_id)
  console.log('✅ business_name:', row.business_name)
  console.log('\n✅ Connect flow will succeed')
}

testConnectQuery().then(() => process.exit(0))
