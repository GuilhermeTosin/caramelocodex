-- Migração definitiva para categorias por ID
-- 1) Adiciona category_id
-- 2) Preenche com base na categoria textual antiga
-- 3) Torna obrigatório
-- 4) Remove coluna legada category

ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS category_id TEXT;

UPDATE public.businesses
SET category_id = CASE
  WHEN lower(coalesce(category, '')) LIKE 'alimenta%' THEN 'food'
  WHEN lower(coalesce(category, '')) LIKE 'servi%automot%' THEN 'auto'
  WHEN lower(coalesce(category, '')) LIKE 'saude%' OR lower(coalesce(category, '')) LIKE 'saúde%' THEN 'health_beauty'
  WHEN lower(coalesce(category, '')) LIKE 'constru%' THEN 'construction'
  WHEN lower(coalesce(category, '')) LIKE 'advocacia%' THEN 'legal_consulting'
  WHEN lower(coalesce(category, '')) LIKE 'contabilidade%' THEN 'accounting_finance'
  WHEN lower(coalesce(category, '')) LIKE 'educa%' THEN 'education'
  WHEN lower(coalesce(category, '')) LIKE 'comercio%' OR lower(coalesce(category, '')) LIKE 'comércio%' THEN 'retail'
  WHEN lower(coalesce(category, '')) LIKE 'transporte%' THEN 'transport_moving'
  WHEN lower(coalesce(category, '')) LIKE 'servi%pets%' THEN 'pets'
  WHEN lower(coalesce(category, '')) LIKE 'cuidados infantis e de idosos%' THEN 'child_elder_care'
  WHEN lower(coalesce(category, '')) LIKE 'diaristas%' THEN 'cleaning'
  WHEN lower(coalesce(category, '')) LIKE 'imobiliaria%' OR lower(coalesce(category, '')) LIKE 'imobiliária%' THEN 'real_estate'
  WHEN lower(coalesce(category, '')) LIKE 'turismo%' THEN 'tourism'
  WHEN lower(coalesce(category, '')) LIKE 'artistas%' THEN 'artists'
  ELSE 'other'
END
WHERE category_id IS NULL;

ALTER TABLE public.businesses
ALTER COLUMN category_id SET DEFAULT 'other',
ALTER COLUMN category_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'businesses_category_id_check'
  ) THEN
    ALTER TABLE public.businesses
    ADD CONSTRAINT businesses_category_id_check
    CHECK (
      category_id IN (
        'food',
        'auto',
        'health_beauty',
        'construction',
        'legal_consulting',
        'accounting_finance',
        'education',
        'retail',
        'transport_moving',
        'pets',
        'child_elder_care',
        'cleaning',
        'real_estate',
        'tourism',
        'artists',
        'other'
      )
    );
  END IF;
END $$;

DROP INDEX IF EXISTS public.idx_businesses_category;
CREATE INDEX IF NOT EXISTS idx_businesses_category_id ON public.businesses(category_id);

ALTER TABLE public.businesses
DROP COLUMN IF EXISTS category;
