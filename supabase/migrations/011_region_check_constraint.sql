-- =============================================================================
-- Region Validation Constraint
-- Validates that region in auth.users metadata is one of the allowed values.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.validate_user_region()
RETURNS TRIGGER AS $$
DECLARE
  region_val TEXT;
BEGIN
  region_val := NEW.raw_user_meta_data->>'region';
  IF region_val IS NOT NULL AND region_val NOT IN ('Luzon', 'Visayas', 'Mindanao', 'Other') THEN
    RAISE EXCEPTION 'Invalid region: %. Must be Luzon, Visayas, Mindanao, or Other.', region_val;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'validate_region_on_signup'
  ) THEN
    CREATE TRIGGER validate_region_on_signup
      BEFORE INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.validate_user_region();
  END IF;
END;
$$;
