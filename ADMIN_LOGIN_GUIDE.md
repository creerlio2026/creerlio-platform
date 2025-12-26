# Step-by-Step Guide: How to Login to Admin Panel

## Step 1: Ensure You Have Admin Access

Before logging in, you need to grant yourself admin privileges. Choose ONE of these methods:

### Option A: Set Admin Flag in User Metadata (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Find your user account (by email)
4. Click on the user to edit
5. In the **User Metadata** section, add:
   ```json
   {
     "is_admin": true
   }
   ```
6. Save the changes

### Option B: Set Environment Variables
1. Open your backend `.env` file
2. Add your email to the admin list:
   ```bash
   ADMIN_EMAILS=your-email@example.com
   ```
3. Restart your backend server

## Step 2: Start Your Application

1. **Start the Backend Server:**
   ```bash
   cd backend
   .\venv\Scripts\activate  # On Windows
   python main.py
   ```
   The backend should be running on `http://localhost:8000`

2. **Start the Frontend Server:**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend should be running on `http://localhost:3000`

## Step 3: Login to Your Account

1. Open your browser and go to: **http://localhost:3000**
2. Click **"Sign In"** in the header
3. Choose either:
   - **"Sign In Talent"** (if you registered as Talent)
   - **"Sign In Business"** (if you registered as Business)
4. Enter your email and password
5. Click **"Sign In"**

## Step 4: Access the Admin Panel

1. After logging in, you'll be redirected to your dashboard
2. In your browser's address bar, navigate to:
   ```
   http://localhost:3000/admin
   ```
   OR manually type `/admin` after the base URL

3. The admin panel should load if you have admin privileges

## Step 5: Verify Admin Access

If you see:
- ✅ **Dashboard Overview** with statistics → You have admin access!
- ✅ **Navigation tabs** (Overview, Talent, Business, Users) → Success!

If you see:
- ❌ **"Access denied"** alert → You don't have admin privileges yet
- ❌ **Redirected to home page** → Go back to Step 1 and set admin access

## Quick Access URLs

- **Admin Dashboard:** http://localhost:3000/admin
- **Talent Management:** http://localhost:3000/admin/talent
- **Business Management:** http://localhost:3000/admin/business
- **User Management:** http://localhost:3000/admin/users

## Troubleshooting

### "Access denied" Error
- Verify you completed Step 1 (admin access setup)
- Check that your email matches exactly in `ADMIN_EMAILS`
- Ensure the backend `.env` file has `ADMIN_EMAILS` set
- Restart the backend server after changing `.env`

### Can't See Admin Panel
- Make sure you're logged in first (Step 3)
- Check browser console for errors
- Verify backend is running on port 8000
- Verify frontend is running on port 3000

### Backend Not Responding
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set in backend `.env`
- Verify backend server started without errors
- Check terminal for error messages

## First Time Setup Checklist

- [ ] Set admin flag in Supabase user metadata OR set `ADMIN_EMAILS` in backend `.env`
- [ ] Start backend server (`python main.py`)
- [ ] Start frontend server (`npm run dev`)
- [ ] Login to your account at http://localhost:3000
- [ ] Navigate to http://localhost:3000/admin
- [ ] Verify you can see the admin dashboard

## Need Help?

If you're still having issues:
1. Check the browser console (F12) for errors
2. Check the backend terminal for error messages
3. Verify all environment variables are set correctly
4. Ensure both servers are running

