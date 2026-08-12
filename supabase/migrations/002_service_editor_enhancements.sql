-- MeroKagaj CMS — Service Editor Enhancements
-- Adds missing fields for the comprehensive Service Editor
-- Run this AFTER 001_initial_schema.sql

BEGIN;

-- ═══════════════════════════════════════════════════════════════
-- Services table: Add new columns for Service Summary, Where to Apply,
-- Important Information, Disclaimer, and better fee/processing integration
-- ═══════════════════════════════════════════════════════════════

-- Service Summary (Fee, Processing Time, Department - already has department_id)
-- Fee summary already exists as fees_summary_en/ne - keep those

-- Add application location type and related fields for "Where to Apply"
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS application_type text DEFAULT 'dao_office'
CHECK (application_type IN ('dao_office', 'ward_office', 'municipality', 'department', 'government_office', 'multiple_offices', 'online', 'custom'));

-- Reference to DAO office (for dao_office type)
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS dao_office_id text REFERENCES public.dao_offices(id);

-- Reference to specific office (for government_office type)
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS office_id text REFERENCES public.offices(id);

-- Reference to department (for department type)
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS application_department_id text REFERENCES public.departments(id);

-- Custom location details (for custom type)
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS custom_location_name jsonb DEFAULT '{"en":"","ne":""}';

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS custom_location_address jsonb DEFAULT '{"en":"","ne":""}';

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS custom_location_phone text;

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS custom_location_email text;

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS custom_location_website text;

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS custom_location_hours jsonb DEFAULT '{"en":"","ne":""}';

-- Application scope: all DAOs, specific DAO, province, district
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS application_scope text DEFAULT 'all_daos'
CHECK (application_scope IN ('all_daos', 'specific_dao', 'province', 'district'));

-- Province for province scope
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS application_province text;

-- District for district scope
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS application_district text;

-- Important Information
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS important_info_en text;

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS important_info_ne text;

-- Disclaimer
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS disclaimer_en text DEFAULT 'This information is provided for reference purposes only. Fees, processing times, and requirements may change. Always verify with the relevant government office before applying.';

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS disclaimer_ne text DEFAULT 'यो जानकारी केवल सन्दर्भ प्रयोजनका लागि प्रदान गरिएको हो। शुल्क, प्रक्रिया समय, र आवश्यकताहरू परिवर्तन हुन सक्छ। आवेदन गर्नुअघि सम्बन्धित सरकारी कार्यालयसँग पुष्टि गर्नुहोस्।';

-- Add indexes for new foreign keys
CREATE INDEX IF NOT EXISTS idx_services_dao_office_id ON public.services(dao_office_id);
CREATE INDEX IF NOT EXISTS idx_services_office_id ON public.services(office_id);
CREATE INDEX IF NOT EXISTS idx_services_application_department_id ON public.services(application_department_id);
CREATE INDEX IF NOT EXISTS idx_services_application_type ON public.services(application_type);

-- ═══════════════════════════════════════════════════════════════
-- Fees table: Already has all needed columns (type_en, type_ne, amount, note_en, note_ne, sort_order)
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- Processing times table: Already has all needed columns (standard_days, express_days, max_days, note_en, note_ne)
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- Update RLS policies for new columns (they inherit from table policies)
-- ═══════════════════════════════════════════════════════════════

-- No new policies needed - existing services table policies cover all columns

COMMIT;