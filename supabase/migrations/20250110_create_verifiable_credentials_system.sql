-- ============================================
-- Verifiable Credentials System Schema
-- Blockchain-anchored credential verification with QR codes
-- ============================================

-- Credential Issuers Table
CREATE TABLE IF NOT EXISTS public.credential_issuers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  contact_email TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Credentials Table
CREATE TABLE IF NOT EXISTS public.credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_issuer_id UUID REFERENCES public.credential_issuers(id) ON DELETE RESTRICT,
  holder_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Credential details
  title TEXT NOT NULL,
  description TEXT,
  credential_type TEXT, -- e.g., 'license', 'certification', 'degree', 'badge'
  category TEXT,
  
  -- Dates
  issued_date DATE NOT NULL,
  expiry_date DATE,
  
  -- Status and trust
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'suspended')),
  trust_level TEXT NOT NULL DEFAULT 'self_asserted' CHECK (trust_level IN ('self_asserted', 'ai_checked', 'reviewed', 'issuer_signed')),
  
  -- Privacy
  visibility TEXT NOT NULL DEFAULT 'link_only' CHECK (visibility IN ('public', 'link_only', 'private')),
  mask_holder_name BOOLEAN DEFAULT false,
  
  -- Verification
  sha256_hash TEXT NOT NULL UNIQUE, -- Hash of the credential file
  qr_token TEXT NOT NULL UNIQUE, -- Unique token for QR code verification
  
  -- File reference
  file_storage_path TEXT NOT NULL, -- Path in Supabase Storage
  
  -- Metadata
  metadata JSONB,
  notes TEXT, -- Admin notes
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_reason TEXT
);

-- Credential Files Table (for multiple file attachments)
CREATE TABLE IF NOT EXISTS public.credential_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL REFERENCES public.credentials(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_storage_path TEXT NOT NULL,
  sha256_hash TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false, -- Primary file for verification
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Blockchain Anchors Table
CREATE TABLE IF NOT EXISTS public.blockchain_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL REFERENCES public.credentials(id) ON DELETE CASCADE,
  
  -- Blockchain details
  chain_name TEXT NOT NULL DEFAULT 'polygon' CHECK (chain_name IN ('polygon', 'base', 'ethereum')),
  network TEXT NOT NULL DEFAULT 'mainnet' CHECK (network IN ('mainnet', 'testnet', 'mumbai', 'sepolia')),
  contract_address TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  block_timestamp TIMESTAMPTZ,
  
  -- On-chain data (hash only, no PII)
  credential_id_on_chain TEXT NOT NULL, -- UUID as string
  sha256_hash TEXT NOT NULL, -- Hash anchored on-chain
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  confirmation_count INTEGER DEFAULT 0,
  
  -- Metadata
  gas_used BIGINT,
  gas_price TEXT,
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

-- Verification Logs Table
CREATE TABLE IF NOT EXISTS public.verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL REFERENCES public.credentials(id) ON DELETE CASCADE,
  qr_token TEXT NOT NULL,
  
  -- Verification details
  verification_result TEXT NOT NULL CHECK (verification_result IN ('valid', 'expired', 'revoked', 'mismatch', 'not_found')),
  hash_match BOOLEAN DEFAULT false,
  blockchain_verified BOOLEAN DEFAULT false,
  
  -- Request details
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Timestamps
  verified_at TIMESTAMPTZ DEFAULT now()
);

-- Credential Events Table (audit trail)
CREATE TABLE IF NOT EXISTS public.credential_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL REFERENCES public.credentials(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN ('issued', 'revoked', 'suspended', 'restored', 'updated', 'viewed', 'verified', 'blockchain_anchored')),
  event_data JSONB, -- Additional event-specific data
  
  -- Actor
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_by_type TEXT CHECK (performed_by_type IN ('issuer', 'holder', 'admin', 'system')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- QR Tokens Table (separate for easier lookup and management)
CREATE TABLE IF NOT EXISTS public.credential_qr_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL REFERENCES public.credentials(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE, -- Unique token for QR code
  expires_at TIMESTAMPTZ, -- Optional token expiration
  is_active BOOLEAN DEFAULT true,
  scan_count INTEGER DEFAULT 0,
  last_scan_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_credentials_holder_user_id ON public.credentials(holder_user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_issuer_id ON public.credentials(credential_issuer_id);
CREATE INDEX IF NOT EXISTS idx_credentials_status ON public.credentials(status);
CREATE INDEX IF NOT EXISTS idx_credentials_trust_level ON public.credentials(trust_level);
CREATE INDEX IF NOT EXISTS idx_credentials_qr_token ON public.credentials(qr_token);
CREATE INDEX IF NOT EXISTS idx_credentials_sha256_hash ON public.credentials(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_credentials_issued_date ON public.credentials(issued_date);
CREATE INDEX IF NOT EXISTS idx_credentials_expiry_date ON public.credentials(expiry_date);
CREATE INDEX IF NOT EXISTS idx_credentials_visibility ON public.credentials(visibility);

CREATE INDEX IF NOT EXISTS idx_credential_files_credential_id ON public.credential_files(credential_id);
CREATE INDEX IF NOT EXISTS idx_credential_files_is_primary ON public.credential_files(is_primary) WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_blockchain_anchors_credential_id ON public.blockchain_anchors(credential_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_anchors_tx_hash ON public.blockchain_anchors(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_anchors_status ON public.blockchain_anchors(status);
CREATE INDEX IF NOT EXISTS idx_blockchain_anchors_chain_network ON public.blockchain_anchors(chain_name, network);

CREATE INDEX IF NOT EXISTS idx_verification_logs_credential_id ON public.verification_logs(credential_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_qr_token ON public.verification_logs(qr_token);
CREATE INDEX IF NOT EXISTS idx_verification_logs_verified_at ON public.verification_logs(verified_at DESC);

CREATE INDEX IF NOT EXISTS idx_credential_events_credential_id ON public.credential_events(credential_id);
CREATE INDEX IF NOT EXISTS idx_credential_events_event_type ON public.credential_events(event_type);
CREATE INDEX IF NOT EXISTS idx_credential_events_created_at ON public.credential_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_qr_tokens_token ON public.credential_qr_tokens(token);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_credential_id ON public.credential_qr_tokens(credential_id);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_is_active ON public.credential_qr_tokens(is_active) WHERE is_active = true;

-- Full-text search index for credential titles
CREATE INDEX IF NOT EXISTS idx_credentials_title_search ON public.credentials USING gin(to_tsvector('english', title));

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.credential_issuers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_qr_tokens ENABLE ROW LEVEL SECURITY;

-- Credential Issuers Policies
CREATE POLICY "Users can view active credential issuers"
  ON public.credential_issuers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can create credential issuers"
  ON public.credential_issuers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own credential issuers"
  ON public.credential_issuers FOR UPDATE
  USING (created_by = auth.uid());

-- Credentials Policies
CREATE POLICY "Users can view their own credentials"
  ON public.credentials FOR SELECT
  USING (holder_user_id = auth.uid());

CREATE POLICY "Users can view public credentials"
  ON public.credentials FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Anyone can view credentials via QR token (for verification)"
  ON public.credentials FOR SELECT
  USING (true); -- QR token validation happens in application logic

CREATE POLICY "Users can create their own credentials"
  ON public.credentials FOR INSERT
  WITH CHECK (holder_user_id = auth.uid());

CREATE POLICY "Users can update their own credentials"
  ON public.credentials FOR UPDATE
  USING (holder_user_id = auth.uid());

CREATE POLICY "Users can delete their own credentials"
  ON public.credentials FOR DELETE
  USING (holder_user_id = auth.uid());

-- Credential Files Policies
CREATE POLICY "Users can view files for credentials they own"
  ON public.credential_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.credentials
      WHERE credentials.id = credential_files.credential_id
      AND credentials.holder_user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view files for public credentials"
  ON public.credential_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.credentials
      WHERE credentials.id = credential_files.credential_id
      AND credentials.visibility = 'public'
    )
  );

CREATE POLICY "Users can insert files for their own credentials"
  ON public.credential_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.credentials
      WHERE credentials.id = credential_files.credential_id
      AND credentials.holder_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files for their own credentials"
  ON public.credential_files FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.credentials
      WHERE credentials.id = credential_files.credential_id
      AND credentials.holder_user_id = auth.uid()
    )
  );

-- Blockchain Anchors Policies
CREATE POLICY "Users can view anchors for their own credentials"
  ON public.blockchain_anchors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.credentials
      WHERE credentials.id = blockchain_anchors.credential_id
      AND credentials.holder_user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view anchors for public credentials"
  ON public.blockchain_anchors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.credentials
      WHERE credentials.id = blockchain_anchors.credential_id
      AND credentials.visibility = 'public'
    )
  );

CREATE POLICY "System can insert blockchain anchors"
  ON public.blockchain_anchors FOR INSERT
  WITH CHECK (true); -- Controlled via API with service role

-- Verification Logs Policies
CREATE POLICY "Users can view logs for their own credentials"
  ON public.verification_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.credentials
      WHERE credentials.id = verification_logs.credential_id
      AND credentials.holder_user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert verification logs"
  ON public.verification_logs FOR INSERT
  WITH CHECK (true); -- Controlled via API

-- Credential Events Policies
CREATE POLICY "Users can view events for their own credentials"
  ON public.credential_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.credentials
      WHERE credentials.id = credential_events.credential_id
      AND credentials.holder_user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert credential events"
  ON public.credential_events FOR INSERT
  WITH CHECK (true); -- Controlled via API

-- QR Tokens Policies
CREATE POLICY "Anyone can view QR tokens (for verification)"
  ON public.credential_qr_tokens FOR SELECT
  USING (is_active = true);

CREATE POLICY "System can insert QR tokens"
  ON public.credential_qr_tokens FOR INSERT
  WITH CHECK (true); -- Controlled via API

CREATE POLICY "System can update QR token scan counts"
  ON public.credential_qr_tokens FOR UPDATE
  USING (true); -- Controlled via API

-- ============================================
-- Functions and Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for credentials updated_at
CREATE TRIGGER update_credentials_updated_at
  BEFORE UPDATE ON public.credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for credential_issuers updated_at
CREATE TRIGGER update_credential_issuers_updated_at
  BEFORE UPDATE ON public.credential_issuers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique QR token
CREATE OR REPLACE FUNCTION public.generate_qr_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate a random token: 32 character alphanumeric
    token := encode(gen_random_bytes(16), 'base64url');
    token := regexp_replace(token, '[^a-zA-Z0-9]', '', 'g');
    token := substring(token FROM 1 FOR 32);
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM public.credentials WHERE qr_token = token)
    INTO exists_check;
    
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create QR token record when credential is created
CREATE OR REPLACE FUNCTION public.create_qr_token_on_credential_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.credential_qr_tokens (credential_id, token, is_active)
  VALUES (NEW.id, NEW.qr_token, true);
  
  -- Create initial event
  INSERT INTO public.credential_events (credential_id, event_type, performed_by, performed_by_type)
  VALUES (NEW.id, 'issued', NEW.holder_user_id, 'holder');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create QR token on credential insert
CREATE TRIGGER create_qr_token_on_credential_insert
  AFTER INSERT ON public.credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.create_qr_token_on_credential_insert();

-- Function to update credential status based on expiry_date
CREATE OR REPLACE FUNCTION public.check_credential_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-update status to expired if expiry_date has passed
  IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date < CURRENT_DATE AND NEW.status = 'active' THEN
    NEW.status := 'expired';
    
    -- Create expiry event
    INSERT INTO public.credential_events (credential_id, event_type, performed_by_type)
    VALUES (NEW.id, 'updated', 'system');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check expiry on update
CREATE TRIGGER check_credential_expiry
  BEFORE UPDATE ON public.credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.check_credential_expiry();

-- Function to log revocation event
CREATE OR REPLACE FUNCTION public.log_credential_revocation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'revoked' AND OLD.status != 'revoked' THEN
    NEW.revoked_at := now();
    
    -- Create revocation event
    INSERT INTO public.credential_events (credential_id, event_type, performed_by, performed_by_type, event_data)
    VALUES (
      NEW.id,
      'revoked',
      NEW.revoked_by,
      COALESCE(
        CASE WHEN NEW.revoked_by = NEW.holder_user_id THEN 'holder' END,
        'admin'
      ),
      jsonb_build_object('reason', NEW.revoked_reason)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log revocation
CREATE TRIGGER log_credential_revocation
  BEFORE UPDATE ON public.credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.log_credential_revocation();

-- ============================================
-- Storage Bucket Setup (via policy, bucket created separately)
-- ============================================

-- Note: The storage bucket 'credential-files' must be created manually in Supabase Dashboard
-- These policies control access to files in that bucket

-- Storage policy: Users can upload their own credential files
CREATE POLICY "Users can upload their own credential files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'credential-files' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policy: Users can view their own credential files
CREATE POLICY "Users can view their own credential files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'credential-files' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      -- Allow public access via signed URLs (handled in API)
      EXISTS (
        SELECT 1 FROM public.credentials c
        WHERE c.file_storage_path = name
        AND c.visibility = 'public'
      )
    )
  );

-- Storage policy: Users can delete their own credential files
CREATE POLICY "Users can delete their own credential files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'credential-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- Views for easier querying
-- ============================================

-- View for credential verification details
CREATE OR REPLACE VIEW public.credential_verification_details AS
SELECT
  c.id,
  c.title,
  c.description,
  c.credential_type,
  c.issued_date,
  c.expiry_date,
  c.status,
  c.trust_level,
  c.visibility,
  c.sha256_hash,
  c.qr_token,
  c.mask_holder_name,
  ci.name AS issuer_name,
  ci.logo_url AS issuer_logo_url,
  ba.transaction_hash AS blockchain_tx_hash,
  ba.block_number,
  ba.chain_name,
  ba.network,
  ba.status AS blockchain_status,
  CASE
    WHEN c.status = 'revoked' THEN 'revoked'
    WHEN c.expiry_date IS NOT NULL AND c.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN c.status = 'suspended' THEN 'suspended'
    ELSE 'active'
  END AS verification_status,
  COUNT(vl.id) AS verification_count,
  MAX(vl.verified_at) AS last_verified_at
FROM public.credentials c
LEFT JOIN public.credential_issuers ci ON c.credential_issuer_id = ci.id
LEFT JOIN public.blockchain_anchors ba ON c.id = ba.credential_id AND ba.status = 'confirmed'
LEFT JOIN public.verification_logs vl ON c.id = vl.credential_id
GROUP BY c.id, ci.id, ba.id;

-- View for admin credential management
CREATE OR REPLACE VIEW public.admin_credential_overview AS
SELECT
  c.id,
  c.title,
  c.credential_type,
  c.status,
  c.trust_level,
  c.issued_date,
  c.expiry_date,
  ci.name AS issuer_name,
  ba.transaction_hash IS NOT NULL AS is_blockchain_anchored,
  COUNT(DISTINCT vl.id) AS total_verifications,
  COUNT(DISTINCT qrt.id) AS qr_scans,
  MAX(ce.created_at) AS last_event_at
FROM public.credentials c
LEFT JOIN public.credential_issuers ci ON c.credential_issuer_id = ci.id
LEFT JOIN public.blockchain_anchors ba ON c.id = ba.credential_id AND ba.status = 'confirmed'
LEFT JOIN public.verification_logs vl ON c.id = vl.credential_id
LEFT JOIN public.credential_qr_tokens qrt ON c.id = qrt.credential_id
LEFT JOIN public.credential_events ce ON c.id = ce.credential_id
GROUP BY c.id, ci.id, ba.transaction_hash;
