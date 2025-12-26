## Creerlio — Testing with “real” Talent + Business accounts

This guide lets you simulate, end-to-end, using **two real Supabase Auth users**:

- **Talent user**: creates a Talent profile + portfolio, sends a connection request to a business.
- **Business user**: creates a Business profile + public Business Profile page, accepts/rejects requests, messages Talent, and requests print/export consent.

### Prereqs (Supabase)

- **Auth** is enabled in your Supabase project.
- You have **email confirmation** configured how you want:
  - For easiest testing: disable email confirmation in Supabase Auth settings, or use emails you can confirm quickly.

### Required migrations

Run these migrations in Supabase SQL editor (or via CLI) and refresh schema cache:

- `supabase/migrations/2025122201_messaging.sql`
- `supabase/migrations/2025122203_talent_connection_requests.sql`
- `supabase/migrations/2025122207_talent_export_consent.sql`
- (If you want Business to view Talent portfolio items) the Talent Bank RLS migration that creates/policies `talent_bank_items` and `has_active_talent_access` (if not already applied in your Supabase project).

### Create two accounts

Open **two separate browser sessions** (recommended):

- Browser A: Talent session
- Browser B (or Incognito): Business session

1) Go to ` /login ` (in each browser session)
2) Create accounts:
   - Talent: `talent.test+1@creerlio.local` (or any email) + password
   - Business: `business.test+1@creerlio.local` (or any email) + password

### Create profiles

#### Business account (Browser B)

1) Go to ` /dashboard/business/edit `
2) Fill the business name + details and **Save**
3) In the same page, create the **Public Business Profile Page**:
   - Set a **slug** (this becomes the public route)
   - Save
4) Click **View Public Profile** to confirm it loads:
   - ` /business/[business_slug] `

#### Talent account (Browser A)

1) Go to ` /dashboard/talent/edit `
2) Fill name, career stage, location, etc and **Save**
3) Go to ` /portfolio ` (edit) and add at least 1–2 items (so the Business has something to view)

### Connection request → accept/deny

#### Talent sends request (Browser A)

1) Open the business public page:
   - ` /business/[business_slug] `
2) Click **Connect**
3) You will be taken to:
   - ` /dashboard/talent/connect/[business_slug] `
4) Select sections → review → confirm (send request)

#### Business accepts/denies (Browser B)

1) Go to ` /dashboard/business `
2) In **Connection Requests**, click:
   - **Accept** → creates an active `talent_access_grants` row (messaging + viewing unlock)
   - **Reject** → request is closed (no access granted)

### Messaging (permission-gated)

#### Business → Talent

1) ` /dashboard/business ` → Talent Bank → **Message**
2) Or directly:
   - ` /dashboard/business/messages?talentId=... `

#### Talent → Business

1) ` /dashboard/talent ` → **Messages** tab

### Business viewing Talent (permission-gated)

After acceptance:

- ` /dashboard/business ` → Talent Bank → **View**
- This opens:
  - ` /dashboard/business/talent/[talentId] `

### Print / export consent flow (WhatsApp-style gating)

1) Business opens Talent view:
   - ` /dashboard/business/talent/[talentId] `
2) If Business attempts to print (button or Ctrl/Cmd+P) without consent:
   - It’s blocked in-app
   - A consent request modal opens
   - An audit event is recorded
3) Business requests consent → Talent receives it:
   - Talent Dashboard → **Connections** → “Print / export consent requests”
4) Talent **Approves** or **Denies**:
   - Decision is recorded (audit event)
   - A message is sent back to Business
5) If approved, Business can use **Print / Export** button (in-app), and the print action is logged.

### Important limitation (web browsers)

Browsers cannot truly prevent screenshots. Creerlio’s enforcement here is:

- **In-app export/print is gated** by Talent consent
- **Audit trail** is recorded
- Terms & conditions can be enforced contractually


