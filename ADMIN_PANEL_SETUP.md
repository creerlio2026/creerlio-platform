# Administration Panel Setup Guide

## Overview

The Creerlio Administration Panel provides comprehensive management tools for viewing and managing Talent and Business registrations, user accounts, and platform statistics.

## Access Control

Admin access is controlled through environment variables and user metadata. There are three ways to grant admin access:

### 1. User Metadata (Recommended)
Set the `is_admin` or `admin` flag in the user's metadata in Supabase Auth:
```sql
-- In Supabase SQL Editor or via Admin API
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{is_admin}',
  'true'::jsonb
)
WHERE email = 'admin@example.com';
```

### 2. Environment Variables - Admin Emails
Add specific admin emails to your `.env` file:
```bash
# Backend (.env)
ADMIN_EMAILS=admin@creerlio.com,superadmin@creerlio.com
ADMIN_EMAIL_DOMAINS=creerlio.com,admin.com
```

```bash
# Frontend (.env.local)
NEXT_PUBLIC_ADMIN_EMAILS=admin@creerlio.com,superadmin@creerlio.com
```

### 3. Environment Variables - Admin Email Domains
Grant admin access to all users from specific email domains:
```bash
# Backend (.env)
ADMIN_EMAIL_DOMAINS=creerlio.com,admin.com
```

## Accessing the Admin Panel

1. Navigate to `/admin` in your browser
2. You must be logged in with an admin account
3. If you don't have admin access, you'll be redirected to the home page

## Features

### Dashboard Overview (`/admin`)
- Platform statistics (Total Talent, Business, Users)
- Recent registrations (last 7 days)
- Quick action links to management pages

### Talent Management (`/admin/talent`)
- View all talent registrations
- Search by name or email
- Activate/Deactivate talent profiles
- View registration details (name, email, title, location, status, created date)
- Pagination support

### Business Management (`/admin/business`)
- View all business registrations
- Search by name or email
- Activate/Deactivate business profiles
- View registration details (name, email, industry, location, status, created date)
- Pagination support

### User Management (`/admin/users`)
- View all users (aggregated from Talent and Business profiles)
- Search by name or email
- Delete user accounts (removes auth user and all associated data)
- View user type (Talent/Business)
- View account status

## Backend API Endpoints

All admin endpoints require admin authentication:

- `POST /api/admin/stats` - Get platform statistics
- `POST /api/admin/talent` - Get talent registrations (with pagination and search)
- `POST /api/admin/business` - Get business registrations (with pagination and search)
- `POST /api/admin/users` - Get all users
- `POST /api/admin/talent/{talent_id}/activate` - Activate/deactivate talent profile
- `POST /api/admin/business/{business_id}/activate` - Activate/deactivate business profile
- `DELETE /api/admin/user/{user_id}` - Delete user account (admin only)

## Security Notes

1. **Backend Verification**: The backend always verifies admin access using the `check_admin_access()` function, even if the frontend allows access.

2. **Service Role Key**: Admin operations use the Supabase Service Role Key to bypass Row Level Security (RLS) policies. Ensure this key is kept secure and only accessible to your backend server.

3. **User Deletion**: Deleting a user removes:
   - Auth user account
   - Talent profile (if exists)
   - Business profile (if exists)
   - All related data (talent_bank_items, messages, connections, etc.)

4. **Activation/Deactivation**: This only affects the `is_active` flag on profiles. Deactivated profiles won't appear in public searches but the user account remains active.

## Troubleshooting

### "Access denied. Admin privileges required."
- Verify your email is in `ADMIN_EMAILS` or your domain is in `ADMIN_EMAIL_DOMAINS`
- Check that `is_admin` flag is set in your user metadata
- Ensure environment variables are set correctly

### "Admin service not available"
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in your backend `.env` file
- Check that the Supabase client can be initialized

### Statistics not loading
- Ensure the backend server is running
- Check that `NEXT_PUBLIC_API_URL` is set correctly in frontend `.env.local`
- Verify admin access is working

## Future Enhancements

- System health monitoring
- Activity logs and audit trails
- Bulk operations (bulk activate/deactivate)
- Export functionality (CSV/JSON)
- Advanced filtering and sorting
- User impersonation (for support)
- Email notifications for admin actions

