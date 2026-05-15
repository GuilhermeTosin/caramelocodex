-- Business page enhancements: verified ownership, opening hours and click analytics.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS owner_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS opening_hours JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.business_click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('whatsapp', 'phone', 'email', 'website', 'internal_message', 'route')),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_click_events_business
  ON public.business_click_events(business_id, created_at DESC);

ALTER TABLE public.business_click_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert business click events"
  ON public.business_click_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view business click events"
  ON public.business_click_events FOR SELECT
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.approve_business_ownership_request(
  p_request_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_business_id UUID;
  v_requested_by UUID;
BEGIN
  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Apenas admins podem aprovar ownership.';
  END IF;

  SELECT business_id, requested_by
    INTO v_business_id, v_requested_by
  FROM public.owner_claim_requests
  WHERE id = p_request_id
    AND status = 'pending'
  FOR UPDATE;

  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Solicitação pendente não encontrada.';
  END IF;

  UPDATE public.businesses
    SET owner_id = v_requested_by,
        owner_verified = true
  WHERE id = v_business_id;

  INSERT INTO public.conversation_participants (conversation_id, user_id)
  SELECT id, v_requested_by
  FROM public.conversations
  WHERE business_id = v_business_id
  ON CONFLICT DO NOTHING;

  UPDATE public.owner_claim_requests
    SET status = 'approved',
        reviewed_by = v_admin_id,
        reviewed_at = NOW()
  WHERE id = p_request_id;

  UPDATE public.owner_claim_requests
    SET status = 'rejected',
        reviewed_by = v_admin_id,
        reviewed_at = NOW()
  WHERE business_id = v_business_id
    AND id <> p_request_id
    AND status = 'pending';

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.transfer_business_ownership_by_email(
  p_business_id UUID,
  p_new_owner_email TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_new_owner_id UUID;
BEGIN
  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Apenas admins podem transferir ownership.';
  END IF;

  SELECT id
    INTO v_new_owner_id
  FROM auth.users
  WHERE lower(email) = lower(trim(p_new_owner_email))
  LIMIT 1;

  IF v_new_owner_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuário encontrado com este email.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id = p_business_id) THEN
    RAISE EXCEPTION 'Negócio não encontrado.';
  END IF;

  UPDATE public.businesses
    SET owner_id = v_new_owner_id,
        owner_verified = true
  WHERE id = p_business_id;

  INSERT INTO public.conversation_participants (conversation_id, user_id)
  SELECT id, v_new_owner_id
  FROM public.conversations
  WHERE business_id = p_business_id
  ON CONFLICT DO NOTHING;

  UPDATE public.owner_claim_requests
    SET status = 'approved',
        reviewed_by = v_admin_id,
        reviewed_at = NOW()
  WHERE business_id = p_business_id
    AND requested_by = v_new_owner_id
    AND status = 'pending';

  UPDATE public.owner_claim_requests
    SET status = 'rejected',
        reviewed_by = v_admin_id,
        reviewed_at = NOW()
  WHERE business_id = p_business_id
    AND requested_by <> v_new_owner_id
    AND status = 'pending';

  RETURN TRUE;
END;
$$;
