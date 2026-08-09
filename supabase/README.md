# MeroKagaj Supabase Setup

## Quick Start

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose a name (e.g., `merokagaj`)
4. Set a strong database password
5. Choose a region close to your users
6. Click "Create new project"

### 2. Run Migrations
In the Supabase SQL Editor (Dashboard → SQL Editor):

1. **Create all tables** — paste and run `migrations/001_initial_schema.sql`
2. **Verify** — you should see tables listed under Database → Tables

### 3. Create First Super Administrator
Run this SQL in the SQL Editor (replace the email):

```sql
-- Step 1: Create the auth user via the Dashboard:
--   Authentication → Users → Add User
--   Enter email + password, disable email confirmation
--
-- Step 2: Then run:
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'your-admin@email.com';
```

### 4. Configure the Site
Create `js/config.local.js` (gitignored):

```js
window.MEROKAGAJ_CONFIG = {
  ADMIN_PATH: 'manage-portal-x7k9',
  SUPABASE_URL: 'https://YOUR-PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR-ANON-KEY',
};
```

Find your keys at: Dashboard → Settings → API

### 5. Import Existing Content
From the project root:

```bash
# Set the service-role key (from Supabase Dashboard → Settings → API → service_role)
export SUPABASE_URL=https://YOUR-PROJECT.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

node supabase/seed/import.mjs
```

This imports all existing JSON data into Supabase with `status='published'`.

### 6. Verify
- Visit your site — it should look identical (using local JSON)
- With config.local.js set, it should now use Supabase data
- Visit `#/manage-portal-x7k9` to access the CMS
- Log in with the super_admin credentials

## Database Schema

### Tables Overview

| Table | Purpose |
|-------|---------|
| profiles | Admin user accounts + roles |
| services | Government services (122+) |
| departments | Government departments (8) |
| offices | Government offices (85) |
| dao_offices | District Administration Offices (77) |
| forms | Official form links |
| fees | Fee schedules per service |
| processing_times | Processing time data |
| faqs | Frequently asked questions |
| glossary | Government term definitions |
| emergency_numbers | Emergency contact numbers |
| news | News articles |
| life_events | Life event mappings |
| translations | UI translation strings |
| settings | Site configuration |
| audit_logs | Admin action history |

### Roles

| Role | Permissions |
|------|-------------|
| super_admin | Full access, manage admins, view audit, settings |
| admin | CRUD content, publish, delete, view audit |
| editor | CRUD content, save drafts (cannot publish/delete) |

## RLS Policies

- **Anonymous users** can only read published content
- **Editors** can create/edit content, save as draft
- **Admins** can also publish and delete content
- **Super admins** can also manage administrators and audit logs

## Security

- Row Level Security enforced on ALL tables
- Service role key NEVER exposed to frontend
- Admin access requires both secret URL + authenticated account
- All mutations logged in audit_logs

## Offline / PWA

The public site maintains full PWA support:
- Static assets are cached by the service worker
- When Supabase is not configured, the site reads from JSON files (fully offline)
- When configured, data is fetched from Supabase; JSON files serve as fallback
- Database content is cached in-memory for fast page loads

## Migration Strategy

Content flows: JSON files → Supabase DB → Public website

The import script (`seed/import.mjs`) reads all existing JSON files and upserts them into Supabase. Existing IDs/slugs are preserved to maintain URL compatibility.
