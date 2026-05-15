-- Migration: 00002_create_reviews_table.sql
-- Create a dedicated table for business reviews

-- 1. Create the new reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Anyone can view reviews
DO $$ BEGIN
  CREATE POLICY "Anyone can view reviews"
    ON public.reviews FOR SELECT
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Authenticated users can create reviews
DO $$ BEGIN
  CREATE POLICY "Authenticated users can create reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Users can update own reviews
DO $$ BEGIN
  CREATE POLICY "Users can update own reviews"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Users can delete own reviews
DO $$ BEGIN
  CREATE POLICY "Users can delete own reviews"
    ON public.reviews FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 4. Create an index for faster lookups by business
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON public.reviews(business_id);

-- 5. Create a function to update average_rating in businesses table automatically
CREATE OR REPLACE FUNCTION public.update_business_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.businesses
  SET average_rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM public.reviews
    WHERE business_id = NEW.business_id OR business_id = OLD.business_id
  )
  WHERE id = NEW.business_id OR id = OLD.business_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create triggers for Insert, Update and Delete
DROP TRIGGER IF EXISTS tr_update_business_rating_ins_upd ON public.reviews;
CREATE TRIGGER tr_update_business_rating_ins_upd
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_business_rating();

DROP TRIGGER IF EXISTS tr_update_business_rating_del ON public.reviews;
CREATE TRIGGER tr_update_business_rating_del
  AFTER DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_business_rating();
