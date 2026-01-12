-- ============================================
-- Fix Missing file_url Column in business_bank_items
-- ============================================

-- Ensure file_url column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'business_bank_items'
    AND column_name = 'file_url'
  ) THEN
    ALTER TABLE business_bank_items ADD COLUMN file_url TEXT;
    RAISE NOTICE 'Added file_url column to business_bank_items';
  ELSE
    RAISE NOTICE 'file_url column already exists';
  END IF;
END $$;

-- Verify all required columns exist
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'business_bank_items'
ORDER BY ordinal_position;
