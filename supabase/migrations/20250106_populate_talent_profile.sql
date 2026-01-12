-- Populate your talent profile with the data from your dashboard
-- Replace the user_id with your actual UUID from the JSON above

-- First, let's see what data you have
-- Your user_id is: 6adadbc1-f5a5-4054-b053-bda2044f3322

-- Update your profile with your data
-- YOU NEED TO UPDATE THIS with your actual data from the dashboard
UPDATE public.talent_profiles
SET
    name = 'Simon Rorke',
    title = 'Manager',
    bio = 'Public health professionals play a vital role in shaping healthier, more resilient communities. As global health priorities evolve, advanced expertise is key to driving lasting change.',
    skills = ARRAY['Leadership', 'Public Health', 'Community Development', 'Strategic Planning']::TEXT[],
    -- Add your actual image URLs from Supabase Storage here:
    -- avatar_url = 'https://empehaulljtwfyzjmvmn.supabase.co/storage/v1/object/public/talent-avatars/YOUR_AVATAR_FILE',
    -- banner_url = 'https://empehaulljtwfyzjmvmn.supabase.co/storage/v1/object/public/talent-banners/YOUR_BANNER_FILE',
    selected_template_id = 2,  -- Set to template 2 (Minimal) or whichever you prefer
    visible_sections = ARRAY['intro', 'skills', 'experience', 'education', 'projects', 'social']::TEXT[]
WHERE user_id = '6adadbc1-f5a5-4054-b053-bda2044f3322';

-- Verify the update
SELECT id, user_id, name, title, bio, skills, selected_template_id
FROM public.talent_profiles
WHERE user_id = '6adadbc1-f5a5-4054-b053-bda2044f3322';
