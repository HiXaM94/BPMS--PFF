-- Keep users.bio in sync with employees.bio via trigger
CREATE OR REPLACE FUNCTION sync_user_bio_from_employee()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    UPDATE users
      SET bio = NEW.bio
      WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_user_bio ON employees;
CREATE TRIGGER trg_sync_user_bio
AFTER INSERT OR UPDATE OF bio ON employees
FOR EACH ROW
EXECUTE FUNCTION sync_user_bio_from_employee();
