-- Ownership handoff flow:
-- admins can transfer businesses directly or approve owner claim requests.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
      AND role = 'admin'
  );
$$;

CREATE TABLE IF NOT EXISTS public.owner_claim_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_email TEXT NOT NULL DEFAULT '',
  requester_name TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'canceled')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_owner_claim_requests_business
  ON public.owner_claim_requests(business_id);

CREATE INDEX IF NOT EXISTS idx_owner_claim_requests_requested_by
  ON public.owner_claim_requests(requested_by);

CREATE INDEX IF NOT EXISTS idx_owner_claim_requests_status
  ON public.owner_claim_requests(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_owner_claim_requests_one_pending
  ON public.owner_claim_requests(business_id, requested_by)
  WHERE status = 'pending';

ALTER TABLE public.owner_claim_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own owner claims and admins can view all"
  ON public.owner_claim_requests FOR SELECT
  USING (requested_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can create own owner claims"
  ON public.owner_claim_requests FOR INSERT
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Admins can update owner claims"
  ON public.owner_claim_requests FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.touch_owner_claim_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS owner_claim_requests_touch_updated_at
  ON public.owner_claim_requests;

CREATE TRIGGER owner_claim_requests_touch_updated_at
  BEFORE UPDATE ON public.owner_claim_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_owner_claim_requests_updated_at();

CREATE OR REPLACE FUNCTION public.request_business_ownership(
  p_business_id UUID,
  p_message TEXT DEFAULT ''
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_owner_id UUID;
  v_request_id UUID;
  v_email TEXT;
  v_name TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Você precisa estar logado para reivindicar um negócio.';
  END IF;

  SELECT owner_id
    INTO v_owner_id
  FROM public.businesses
  WHERE id = p_business_id;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Negócio não encontrado.';
  END IF;

  IF v_owner_id = v_user_id THEN
    RAISE EXCEPTION 'Este negócio já pertence à sua conta.';
  END IF;

  SELECT id
    INTO v_request_id
  FROM public.owner_claim_requests
  WHERE business_id = p_business_id
    AND requested_by = v_user_id
    AND status = 'pending'
  LIMIT 1;

  IF v_request_id IS NOT NULL THEN
    RETURN v_request_id;
  END IF;

  SELECT email
    INTO v_email
  FROM auth.users
  WHERE id = v_user_id;

  SELECT name
    INTO v_name
  FROM public.profiles
  WHERE id = v_user_id;

  INSERT INTO public.owner_claim_requests (
    business_id,
    requested_by,
    requester_email,
    requester_name,
    message
  )
  VALUES (
    p_business_id,
    v_user_id,
    COALESCE(v_email, ''),
    COALESCE(v_name, ''),
    COALESCE(p_message, '')
  )
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$;

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
    SET owner_id = v_requested_by
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

CREATE OR REPLACE FUNCTION public.reject_business_ownership_request(
  p_request_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Apenas admins podem recusar ownership.';
  END IF;

  UPDATE public.owner_claim_requests
    SET status = 'rejected',
        reviewed_by = v_admin_id,
        reviewed_at = NOW()
  WHERE id = p_request_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação pendente não encontrada.';
  END IF;

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
    SET owner_id = v_new_owner_id
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

GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_business_ownership(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_business_ownership_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_business_ownership_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_business_ownership_by_email(UUID, TEXT) TO authenticated;
