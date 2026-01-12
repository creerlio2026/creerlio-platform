-- ============================================
-- Seed Demo Credentials
-- Creates sample credential issuers and credentials for testing
-- ============================================

-- Insert demo credential issuers
INSERT INTO public.credential_issuers (id, name, description, website_url, is_active, created_at) VALUES
  (gen_random_uuid(), 'Australian Institute of Management', 'Professional management and leadership certifications', 'https://www.aim.com.au', true, now()),
  (gen_random_uuid(), 'TAFE NSW', 'Technical and Further Education certificates', 'https://www.tafensw.edu.au', true, now()),
  (gen_random_uuid(), 'Certified Practising Accountants Australia', 'CPA certifications and professional accounting qualifications', 'https://www.cpaaustralia.com.au', true, now()),
  (gen_random_uuid(), 'Australian Computer Society', 'IT and computing professional certifications', 'https://www.acs.org.au', true, now()),
  (gen_random_uuid(), 'Engineers Australia', 'Engineering professional qualifications and certifications', 'https://www.engineersaustralia.org.au', true, now()),
  (gen_random_uuid(), 'Australian Health Practitioner Regulation Agency', 'AHPRA medical and healthcare registrations', 'https://www.ahpra.gov.au', true, now()),
  (gen_random_uuid(), 'Australian Skills Quality Authority', 'VET sector qualifications and RTO registrations', 'https://www.asqa.gov.au', true, now()),
  (gen_random_uuid(), 'WorkSafe Victoria', 'Workplace safety certifications and licences', 'https://www.worksafe.vic.gov.au', true, now()),
  (gen_random_uuid(), 'SafeWork NSW', 'Workplace safety certifications and licences', 'https://www.safework.nsw.gov.au', true, now()),
  (gen_random_uuid(), 'White Card Australia', 'Construction industry safety induction cards', 'https://whitecardaustralia.com.au', true, now())
ON CONFLICT DO NOTHING;

-- Note: Actual credential creation should be done via the API/UI
-- This seed file only creates the issuer records
-- Credentials will be created when users upload files through the system

-- Create a function to generate demo credentials (for testing)
CREATE OR REPLACE FUNCTION public.create_demo_credential(
  p_user_id UUID,
  p_issuer_name TEXT,
  p_title TEXT,
  p_description TEXT,
  p_credential_type TEXT,
  p_category TEXT,
  p_file_path TEXT,
  p_sha256_hash TEXT
)
RETURNS UUID AS $$
DECLARE
  v_issuer_id UUID;
  v_credential_id UUID;
  v_qr_token TEXT;
BEGIN
  -- Get issuer ID
  SELECT id INTO v_issuer_id
  FROM public.credential_issuers
  WHERE name = p_issuer_name
  AND is_active = true
  LIMIT 1;

  IF v_issuer_id IS NULL THEN
    RAISE EXCEPTION 'Issuer not found: %', p_issuer_name;
  END IF;

  -- Generate QR token
  v_qr_token := public.generate_qr_token();

  -- Create credential
  INSERT INTO public.credentials (
    credential_issuer_id,
    holder_user_id,
    title,
    description,
    credential_type,
    category,
    issued_date,
    expiry_date,
    status,
    trust_level,
    visibility,
    sha256_hash,
    qr_token,
    file_storage_path
  ) VALUES (
    v_issuer_id,
    p_user_id,
    p_title,
    p_description,
    p_credential_type,
    p_category,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '2 years',
    'active',
    'self_asserted',
    'link_only',
    p_sha256_hash,
    v_qr_token,
    p_file_path
  ) RETURNING id INTO v_credential_id;

  RETURN v_credential_id;
END;
$$ LANGUAGE plpgsql;
