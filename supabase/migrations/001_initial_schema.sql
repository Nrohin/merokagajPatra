-- MeroKagaj CMS — Initial Database Schema
-- Run this in the Supabase SQL Editor to create all tables.
--
-- Wrapped in a transaction: if any statement fails, everything rolls back.

BEGIN;

-- ══════════════════════════════════════════════════════════════
-- MeroKagaj CMS — Initial Database Schema (run once, in order)
-- Wrapped in a transaction: if any statement fails, everything rolls back.
-- ══════════════════════════════════════════════════════════════

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";




-- ── profiles ────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text NOT NULL UNIQUE,
  full_name  text NOT NULL DEFAULT '',
  role       text NOT NULL DEFAULT 'editor'
             CHECK (role IN ('super_admin', 'admin', 'editor')),
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── services ────────────────────────────────────────────────
CREATE TABLE public.services (
  id                      text PRIMARY KEY,
  name_en                 text NOT NULL,
  name_ne                 text NOT NULL DEFAULT '',
  description_en          text NOT NULL DEFAULT '',
  description_ne          text NOT NULL DEFAULT '',
  category                text NOT NULL DEFAULT 'other',
  sub_category            text,
  icon                    text NOT NULL DEFAULT 'description',
  popular                 boolean NOT NULL DEFAULT false,
  online_available        boolean NOT NULL DEFAULT false,
  keywords                text[] NOT NULL DEFAULT '{}',
  department_id           text,
  offices                 text[] NOT NULL DEFAULT '{}',
  steps                   jsonb NOT NULL DEFAULT '[]',
  documents               jsonb NOT NULL DEFAULT '[]',
  common_mistakes         jsonb NOT NULL DEFAULT '[]',
  tips                    jsonb NOT NULL DEFAULT '[]',
  related_services        text[] NOT NULL DEFAULT '{}',
  official_sources        jsonb NOT NULL DEFAULT '[]',
  fees_summary_en         text,
  fees_summary_ne         text,
  processing_standard_days int,
  processing_express_days  int,
  processing_max_days      int,
  processing_note_en       text,
  processing_note_ne       text,
  last_updated             date,
  status                  text NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft', 'published')),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  published_at            timestamptz,
  created_by              uuid REFERENCES public.profiles(id),
  updated_by              uuid REFERENCES public.profiles(id)
);

CREATE INDEX idx_services_category ON public.services(category);
CREATE INDEX idx_services_status ON public.services(status);
CREATE INDEX idx_services_name_en ON public.services(name_en);

-- ── departments ─────────────────────────────────────────────
CREATE TABLE public.departments (
  id            text PRIMARY KEY,
  name_en       text NOT NULL,
  name_ne       text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  description_ne text NOT NULL DEFAULT '',
  website       text,
  phone         text,
  email         text,
  services      text[] NOT NULL DEFAULT '{}',
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'published')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz,
  created_by    uuid REFERENCES public.profiles(id),
  updated_by    uuid REFERENCES public.profiles(id)
);

CREATE INDEX idx_departments_status ON public.departments(status);

-- ── offices ─────────────────────────────────────────────────
CREATE TABLE public.offices (
  id           text PRIMARY KEY,
  name_en      text NOT NULL,
  name_ne      text NOT NULL DEFAULT '',
  address      jsonb NOT NULL DEFAULT '{"en":"","ne":""}',
  phone        text,
  email        text,
  hours        jsonb NOT NULL DEFAULT '{"en":"","ne":""}',
  best_time    jsonb NOT NULL DEFAULT '{"en":"","ne":""}',
  province     text NOT NULL DEFAULT 'Bagmati',
  map_url      text,
  services     text[] NOT NULL DEFAULT '{}',
  status       text NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft', 'published')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  created_by   uuid REFERENCES public.profiles(id),
  updated_by   uuid REFERENCES public.profiles(id)
);

CREATE INDEX idx_offices_province ON public.offices(province);
CREATE INDEX idx_offices_status ON public.offices(status);

-- ── dao_offices ─────────────────────────────────────────────
CREATE TABLE public.dao_offices (
  id            text PRIMARY KEY,
  name_en       text NOT NULL,
  name_ne       text NOT NULL DEFAULT '',
  district      text,
  headquarters  text,
  province      text NOT NULL DEFAULT 'Bagmati',
  website       text,
  phone         text,
  hours         jsonb NOT NULL DEFAULT '{"en":"","ne":""}',
  best_time     jsonb NOT NULL DEFAULT '{"en":"","ne":""}',
  services      text[] NOT NULL DEFAULT '{}',
  map_url       text,
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'published')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz,
  created_by    uuid REFERENCES public.profiles(id),
  updated_by    uuid REFERENCES public.profiles(id)
);

CREATE INDEX idx_dao_offices_status ON public.dao_offices(status);
CREATE INDEX idx_dao_offices_province ON public.dao_offices(province);

-- ── forms ───────────────────────────────────────────────────
CREATE TABLE public.forms (
  id           text PRIMARY KEY,
  service_id   text NOT NULL,
  name_en      text NOT NULL DEFAULT '',
  name_ne      text NOT NULL DEFAULT '',
  format       text,
  url          text,
  status       text NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft', 'published')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  created_by   uuid REFERENCES public.profiles(id),
  updated_by   uuid REFERENCES public.profiles(id)
);

CREATE INDEX idx_forms_service_id ON public.forms(service_id);
CREATE INDEX idx_forms_status ON public.forms(status);

-- ── fees ────────────────────────────────────────────────────
CREATE TABLE public.fees (
  id           text PRIMARY KEY,
  service_id   text NOT NULL,
  type_en      text NOT NULL DEFAULT '',
  type_ne      text NOT NULL DEFAULT '',
  amount       numeric,
  note_en      text,
  note_ne      text,
  sort_order   int NOT NULL DEFAULT 0,
  status       text NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft', 'published')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  created_by   uuid REFERENCES public.profiles(id),
  updated_by   uuid REFERENCES public.profiles(id)
);

CREATE INDEX idx_fees_service_id ON public.fees(service_id);
CREATE INDEX idx_fees_status ON public.fees(status);

-- ── processing_times ────────────────────────────────────────
CREATE TABLE public.processing_times (
  id               text PRIMARY KEY,
  service_id       text NOT NULL,
  standard_days    int,
  express_days     int,
  max_days         int,
  note_en          text,
  note_ne          text,
  status           text NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'published')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  published_at     timestamptz,
  created_by       uuid REFERENCES public.profiles(id),
  updated_by       uuid REFERENCES public.profiles(id)
);

CREATE INDEX idx_processing_service_id ON public.processing_times(service_id);

-- ── faqs ────────────────────────────────────────────────────
CREATE TABLE public.faqs (
  id           int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  category     text NOT NULL DEFAULT 'general',
  question_en  text NOT NULL DEFAULT '',
  question_ne  text NOT NULL DEFAULT '',
  answer_en    text NOT NULL DEFAULT '',
  answer_ne    text NOT NULL DEFAULT '',
  keywords     text[] NOT NULL DEFAULT '{}',
  sort_order   int NOT NULL DEFAULT 0,
  status       text NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft', 'published')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  created_by   uuid REFERENCES public.profiles(id),
  updated_by   uuid REFERENCES public.profiles(id)
);

CREATE INDEX idx_faqs_status ON public.faqs(status);
CREATE INDEX idx_faqs_category ON public.faqs(category);

-- ── glossary ────────────────────────────────────────────────
CREATE TABLE public.glossary (
  id            text PRIMARY KEY,
  term_en       text NOT NULL DEFAULT '',
  term_ne       text NOT NULL DEFAULT '',
  definition_en text NOT NULL DEFAULT '',
  definition_ne text NOT NULL DEFAULT '',
  sort_order    int NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'published')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz,
  created_by    uuid REFERENCES public.profiles(id),
  updated_by    uuid REFERENCES public.profiles(id)
);

CREATE INDEX idx_glossary_status ON public.glossary(status);

-- ── emergency_numbers ───────────────────────────────────────
CREATE TABLE public.emergency_numbers (
  id            text PRIMARY KEY,
  name_en       text NOT NULL DEFAULT '',
  name_ne       text NOT NULL DEFAULT '',
  number        text NOT NULL,
  icon          text,
  description_en text,
  description_ne text,
  category      text,
  is_active     boolean NOT NULL DEFAULT true,
  sort_order    int NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'published')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz,
  created_by    uuid REFERENCES public.profiles(id),
  updated_by    uuid REFERENCES public.profiles(id)
);

CREATE INDEX idx_emergency_status ON public.emergency_numbers(status);

-- ── news ────────────────────────────────────────────────────
CREATE TABLE public.news (
  id           int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  title_en     text NOT NULL DEFAULT '',
  title_ne     text NOT NULL DEFAULT '',
  summary_en   text NOT NULL DEFAULT '',
  summary_ne   text NOT NULL DEFAULT '',
  body_en      text NOT NULL DEFAULT '',
  body_ne      text NOT NULL DEFAULT '',
  date         date,
  category     text,
  source       text,
  status       text NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft', 'published')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  created_by   uuid REFERENCES public.profiles(id),
  updated_by   uuid REFERENCES public.profiles(id)
);

CREATE INDEX idx_news_status ON public.news(status);
CREATE INDEX idx_news_date ON public.news(date DESC);

-- ── life_events ─────────────────────────────────────────────
CREATE TABLE public.life_events (
  id            text PRIMARY KEY,
  name_en       text NOT NULL DEFAULT '',
  name_ne       text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  description_ne text NOT NULL DEFAULT '',
  icon          text,
  services      text[] NOT NULL DEFAULT '{}',
  tips          jsonb NOT NULL DEFAULT '[]',
  keywords      text[] NOT NULL DEFAULT '{}',
  sort_order    int NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'published')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz,
  created_by    uuid REFERENCES public.profiles(id),
  updated_by    uuid REFERENCES public.profiles(id)
);

CREATE INDEX idx_life_events_status ON public.life_events(status);

-- ── translations ────────────────────────────────────────────
CREATE TABLE public.translations (
  key        text PRIMARY KEY,
  en         text NOT NULL DEFAULT '',
  ne         text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── settings ────────────────────────────────────────────────
CREATE TABLE public.settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── audit_logs ──────────────────────────────────────────────
CREATE TABLE public.audit_logs (
  id          bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  admin_id    uuid REFERENCES public.profiles(id),
  admin_email text NOT NULL,
  action      text NOT NULL,
  entity_type text NOT NULL,
  entity_id   text,
  details     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- ══════════════════════════════════════════════════════════════
-- Helper functions (created AFTER all tables so LANGUAGE sql bodies validate)
-- ══════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════
-- Helper functions (created AFTER all tables so LANGUAGE sql bodies validate)
-- ══════════════════════════════════════════════════════════════
-- ── Helper function: current admin role ─────────────────────
-- SECURITY DEFINER avoids RLS recursion when policies query profiles.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_active = true
  );
$$;

-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY POLICIES
-- ══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glossary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ── profiles policies ───────────────────────────────────────
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "Super admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (public.get_my_role() = 'super_admin');

CREATE POLICY "Super admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.get_my_role() = 'super_admin');

-- ── Content table policies (template) ───────────────────────
-- For tables with status column: anon reads published, staff reads all, staff writes

-- SERVICES
CREATE POLICY "Public can read published services"
  ON public.services FOR SELECT
  USING (status = 'published');

CREATE POLICY "Staff can read all services"
  ON public.services FOR SELECT
  USING (public.is_staff());

CREATE POLICY "Staff can insert services"
  ON public.services FOR INSERT
  WITH CHECK (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Staff can update services"
  ON public.services FOR UPDATE
  USING (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Admins can delete services"
  ON public.services FOR DELETE
  USING (public.get_my_role() IN ('super_admin', 'admin'));

-- DEPARTMENTS
CREATE POLICY "Public can read published departments"
  ON public.departments FOR SELECT
  USING (status = 'published');

CREATE POLICY "Staff can read all departments"
  ON public.departments FOR SELECT
  USING (public.is_staff());

CREATE POLICY "Staff can insert departments"
  ON public.departments FOR INSERT
  WITH CHECK (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Staff can update departments"
  ON public.departments FOR UPDATE
  USING (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Admins can delete departments"
  ON public.departments FOR DELETE
  USING (public.get_my_role() IN ('super_admin', 'admin'));

-- OFFICES
CREATE POLICY "Public can read published offices"
  ON public.offices FOR SELECT
  USING (status = 'published');

CREATE POLICY "Staff can read all offices"
  ON public.offices FOR SELECT
  USING (public.is_staff());

CREATE POLICY "Staff can insert offices"
  ON public.offices FOR INSERT
  WITH CHECK (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Staff can update offices"
  ON public.offices FOR UPDATE
  USING (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Admins can delete offices"
  ON public.offices FOR DELETE
  USING (public.get_my_role() IN ('super_admin', 'admin'));

-- DAO_OFFICES
CREATE POLICY "Public can read published dao_offices"
  ON public.dao_offices FOR SELECT
  USING (status = 'published');

CREATE POLICY "Staff can read all dao_offices"
  ON public.dao_offices FOR SELECT
  USING (public.is_staff());

CREATE POLICY "Staff can insert dao_offices"
  ON public.dao_offices FOR INSERT
  WITH CHECK (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Staff can update dao_offices"
  ON public.dao_offices FOR UPDATE
  USING (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Admins can delete dao_offices"
  ON public.dao_offices FOR DELETE
  USING (public.get_my_role() IN ('super_admin', 'admin'));

-- FORMS
CREATE POLICY "Public can read published forms"
  ON public.forms FOR SELECT
  USING (status = 'published');

CREATE POLICY "Staff can read all forms"
  ON public.forms FOR SELECT
  USING (public.is_staff());

CREATE POLICY "Staff can insert forms"
  ON public.forms FOR INSERT
  WITH CHECK (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Staff can update forms"
  ON public.forms FOR UPDATE
  USING (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Admins can delete forms"
  ON public.forms FOR DELETE
  USING (public.get_my_role() IN ('super_admin', 'admin'));

-- FEES
CREATE POLICY "Public can read published fees"
  ON public.fees FOR SELECT
  USING (status = 'published');

CREATE POLICY "Staff can read all fees"
  ON public.fees FOR SELECT
  USING (public.is_staff());

CREATE POLICY "Staff can insert fees"
  ON public.fees FOR INSERT
  WITH CHECK (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Staff can update fees"
  ON public.fees FOR UPDATE
  USING (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Admins can delete fees"
  ON public.fees FOR DELETE
  USING (public.get_my_role() IN ('super_admin', 'admin'));

-- PROCESSING_TIMES
CREATE POLICY "Public can read published processing"
  ON public.processing_times FOR SELECT
  USING (status = 'published');

CREATE POLICY "Staff can read all processing"
  ON public.processing_times FOR SELECT
  USING (public.is_staff());

CREATE POLICY "Staff can insert processing"
  ON public.processing_times FOR INSERT
  WITH CHECK (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Staff can update processing"
  ON public.processing_times FOR UPDATE
  USING (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Admins can delete processing"
  ON public.processing_times FOR DELETE
  USING (public.get_my_role() IN ('super_admin', 'admin'));

-- FAQS
CREATE POLICY "Public can read published faqs"
  ON public.faqs FOR SELECT
  USING (status = 'published');

CREATE POLICY "Staff can read all faqs"
  ON public.faqs FOR SELECT
  USING (public.is_staff());

CREATE POLICY "Staff can insert faqs"
  ON public.faqs FOR INSERT
  WITH CHECK (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Staff can update faqs"
  ON public.faqs FOR UPDATE
  USING (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Admins can delete faqs"
  ON public.faqs FOR DELETE
  USING (public.get_my_role() IN ('super_admin', 'admin'));

-- GLOSSARY
CREATE POLICY "Public can read published glossary"
  ON public.glossary FOR SELECT
  USING (status = 'published');

CREATE POLICY "Staff can read all glossary"
  ON public.glossary FOR SELECT
  USING (public.is_staff());

CREATE POLICY "Staff can insert glossary"
  ON public.glossary FOR INSERT
  WITH CHECK (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Staff can update glossary"
  ON public.glossary FOR UPDATE
  USING (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Admins can delete glossary"
  ON public.glossary FOR DELETE
  USING (public.get_my_role() IN ('super_admin', 'admin'));

-- EMERGENCY NUMBERS
CREATE POLICY "Public can read published emergency"
  ON public.emergency_numbers FOR SELECT
  USING (status = 'published');

CREATE POLICY "Staff can read all emergency"
  ON public.emergency_numbers FOR SELECT
  USING (public.is_staff());

CREATE POLICY "Staff can insert emergency"
  ON public.emergency_numbers FOR INSERT
  WITH CHECK (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Staff can update emergency"
  ON public.emergency_numbers FOR UPDATE
  USING (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Admins can delete emergency"
  ON public.emergency_numbers FOR DELETE
  USING (public.get_my_role() IN ('super_admin', 'admin'));

-- NEWS
CREATE POLICY "Public can read published news"
  ON public.news FOR SELECT
  USING (status = 'published');

CREATE POLICY "Staff can read all news"
  ON public.news FOR SELECT
  USING (public.is_staff());

CREATE POLICY "Staff can insert news"
  ON public.news FOR INSERT
  WITH CHECK (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Staff can update news"
  ON public.news FOR UPDATE
  USING (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Admins can delete news"
  ON public.news FOR DELETE
  USING (public.get_my_role() IN ('super_admin', 'admin'));

-- LIFE EVENTS
CREATE POLICY "Public can read published life_events"
  ON public.life_events FOR SELECT
  USING (status = 'published');

CREATE POLICY "Staff can read all life_events"
  ON public.life_events FOR SELECT
  USING (public.is_staff());

CREATE POLICY "Staff can insert life_events"
  ON public.life_events FOR INSERT
  WITH CHECK (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Staff can update life_events"
  ON public.life_events FOR UPDATE
  USING (public.is_staff() AND (status = 'draft' OR public.get_my_role() IN ('super_admin', 'admin')));

CREATE POLICY "Admins can delete life_events"
  ON public.life_events FOR DELETE
  USING (public.get_my_role() IN ('super_admin', 'admin'));

-- TRANSLATIONS
CREATE POLICY "Public can read translations"
  ON public.translations FOR SELECT
  USING (true);

CREATE POLICY "Staff can update translations"
  ON public.translations FOR UPDATE
  USING (public.is_staff());

CREATE POLICY "Staff can insert translations"
  ON public.translations FOR INSERT
  WITH CHECK (public.is_staff());

-- SETTINGS
CREATE POLICY "Super admins can read settings"
  ON public.settings FOR SELECT
  USING (public.get_my_role() = 'super_admin');

CREATE POLICY "Super admins can update settings"
  ON public.settings FOR UPDATE
  USING (public.get_my_role() = 'super_admin');

CREATE POLICY "Super admins can insert settings"
  ON public.settings FOR INSERT
  WITH CHECK (public.get_my_role() = 'super_admin');

-- AUDIT LOGS
CREATE POLICY "Admins can read audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "Staff can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (public.is_staff());

-- ── updated_at trigger ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at trigger to all content tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'services', 'departments', 'offices', 'dao_offices',
    'forms', 'fees', 'processing_times', 'faqs', 'glossary',
    'emergency_numbers', 'news', 'life_events', 'profiles'
  ]) LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()',
      tbl
    );
  END LOOP;
END;
$$;

-- ── Default settings ────────────────────────────────────────
INSERT INTO public.settings (key, value) VALUES
  ('site_name_en', '"MeroKagajPatra"'),
  ('site_name_ne', '"मेरोकागजपत्र"'),
  ('admin_path', '"manage-portal-x7k9"'),
  ('footer_email', '"info@merokagaj.com"'),
  ('footer_phone', '"977-1-4221903"')
ON CONFLICT (key) DO NOTHING;

COMMIT;
