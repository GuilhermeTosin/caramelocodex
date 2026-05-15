-- Regional featured placements for paid/editorial highlights.

CREATE TABLE IF NOT EXISTS public.featured_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('city', 'state', 'country', 'global')),
  country_code TEXT DEFAULT '',
  state_code TEXT DEFAULT '',
  city TEXT DEFAULT '',
  category TEXT DEFAULT '',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired')),
  notes TEXT NOT NULL DEFAULT '',
  price_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_featured_placements_active
  ON public.featured_placements(status, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_featured_placements_scope
  ON public.featured_placements(scope_type, country_code, state_code, city);

CREATE INDEX IF NOT EXISTS idx_featured_placements_business
  ON public.featured_placements(business_id);

ALTER TABLE public.featured_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active featured placements"
  ON public.featured_placements FOR SELECT
  USING (
    status = 'active'
    AND starts_at <= NOW()
    AND ends_at >= NOW()
  );

CREATE POLICY "Admins can view all featured placements"
  ON public.featured_placements FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can create featured placements"
  ON public.featured_placements FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update featured placements"
  ON public.featured_placements FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete featured placements"
  ON public.featured_placements FOR DELETE
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.touch_featured_placements_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS featured_placements_touch_updated_at
  ON public.featured_placements;

CREATE TRIGGER featured_placements_touch_updated_at
  BEFORE UPDATE ON public.featured_placements
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_featured_placements_updated_at();
