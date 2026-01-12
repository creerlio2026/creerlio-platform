-- ============================================
-- Business Profile Template Configuration
-- Stores which Business Bank items are assigned to template slots
-- ============================================

-- Add template configuration columns to business_profiles
ALTER TABLE business_profiles
ADD COLUMN IF NOT EXISTS selected_template_id TEXT,
ADD COLUMN IF NOT EXISTS template_config JSONB DEFAULT '{}'::jsonb;

-- template_config structure:
-- {
--   "hero": {
--     "background_image_id": 123,
--     "logo_id": 456
--   },
--   "about": {
--     "text_id": 789,
--     "image_id": 101
--   },
--   "culture": {
--     "image_ids": [111, 112, 113],
--     "video_id": 114
--   },
--   "links": {
--     "website": "https://example.com",
--     "linkedin": "https://linkedin.com/company/example",
--     "twitter": "https://twitter.com/example",
--     "facebook": "https://facebook.com/example"
--   },
--   "careers": {
--     "text_id": 115
--   }
-- }

-- Index for template queries
CREATE INDEX IF NOT EXISTS idx_business_profiles_template_id ON business_profiles(selected_template_id) WHERE selected_template_id IS NOT NULL;
