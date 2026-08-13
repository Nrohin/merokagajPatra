# MeroKagaj — Supabase Project Overview

MeroKagaj uses **Supabase** as its database managing government-service information.

## Project Structure

The Supabase database contains the following main tables:

| Table               | Purpose                             |
| ------------------- | ----------------------------------- |
| `services`          | Government services                 |
| `departments`       | Government departments              |
| `offices`           | Government offices                  |
| `dao_offices`       | District Administration Offices     |
| `forms`             | Official forms and form links       |
| `fees`              | Service fee information             |
| `processing_times`  | Service processing-time information |
| `faqs`              | Frequently asked questions          |
| `glossary`          | Government terminology              |
| `emergency_numbers` | Emergency contacts                  |
| `news`              | News content                        |
| `life_events`       | Life-event/service mappings         |
| `translations`      | Interface translations              |
| `settings`          | Site configuration                  |
| `profiles`          | Admin accounts and roles            |
| `audit_logs`        | Administrative activity logs        |

## Content Relationship

The main content flow is:

**JSON data → Supabase database → Public website**

Existing service IDs and slugs are preserved when content is imported so existing URLs continue to work.

## Service Data

The `services` table contains the core government-service information.

Service-related supporting information is maintained through separate tables:

* `fees` — fee schedules
* `processing_times` — processing times
* `forms` — required/official forms
* `faqs` — frequently asked questions
* `departments` — responsible departments
* `offices` — relevant government offices
* `dao_offices` — District Administration Offices

When modifying the Service Editor, check the existing database schema and these related tables before adding new fields to `services`. Avoid creating duplicate fields when the required information already exists in a related table.

## Frontend / Offline Support

The public website supports PWA functionality.

When Supabase is unavailable or not configured, the website can use local JSON data as a fallback.

When Supabase is configured, the website retrieves content from the database.

## Development Notes

Before modifying the database:

1. Check the current database schema.
2. Check existing migrations.
3. Check the corresponding admin-panel code.
4. Check related tables before adding new columns.
5. Use non-destructive migrations for existing databases.
6. Never recreate or reset production tables simply to fix a missing field.

For Service Editor issues, inspect both the frontend save/update logic and the actual Supabase table structure before deciding whether a new database column is required.
