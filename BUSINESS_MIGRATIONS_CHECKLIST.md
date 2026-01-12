# Business Profile Migrations Checklist

## Required Migrations (In Order)

### 1. Base Business Profiles Table
**File:** `supabase/migrations/2025122503_ensure_business_profiles_columns.sql`
- Creates `business_profiles` table if it doesn't exist
- Adds required columns: `business_name`, `name`, `description`, `industry`, `website`, `city`, `state`, `country`, `user_id`, `is_active`
- Sets up RLS policies

**Status:** ⚠️ Check if already run

### 2. Business Bank Items Table
**File:** `RUN_BUSINESS_BANK_MIGRATIONS.sql` (consolidated)
- Creates `business_bank_items` table
- Adds indexes and RLS policies
- Adds `selected_template_id` and `template_config` to `business_profiles`

**Status:** ⚠️ Check if already run

## Optional/Old Migrations (May Conflict)

These migrations may have been superseded or are not needed for the new Business Bank system:

- `2025122505_business_profile_page_builder.sql` - **OLD SYSTEM** (page builder, not needed)
- `2025122205_business_bank.sql` - **OLD** (may conflict)
- `2025122204_business_profile_media.sql` - **OLD** (may conflict)
- `2025122202_business_profile_pages.sql` - **OLD** (may conflict)

## How to Verify

1. Run `DIAGNOSTIC_BUSINESS_BANK.sql` in Supabase SQL Editor
2. Check the output for any ✗ (missing) items
3. If anything is missing, run the appropriate migration

## Storage Bucket

**Manual Step Required:**
- Go to Supabase Dashboard → Storage
- Create bucket named `business-bank`
- Set to public (or configure RLS as needed)
