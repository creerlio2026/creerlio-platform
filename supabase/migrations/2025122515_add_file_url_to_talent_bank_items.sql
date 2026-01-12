-- Add file_url column to talent_bank_items if it doesn't exist
-- This column is used for linked videos (YouTube, Vimeo, etc.)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'talent_bank_items' 
    AND column_name = 'file_url'
  ) THEN
    ALTER TABLE talent_bank_items ADD COLUMN file_url TEXT;
    RAISE NOTICE 'Added file_url column to talent_bank_items';
  ELSE
    RAISE NOTICE 'file_url column already exists in talent_bank_items';
  END IF;
END $$;

-- Verify the column exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'talent_bank_items'
AND column_name = 'file_url';
