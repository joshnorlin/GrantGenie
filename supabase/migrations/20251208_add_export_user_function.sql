-- Create a function to get user names for export (accessible to authenticated users)
-- This bypasses RLS by using SECURITY DEFINER

CREATE OR REPLACE FUNCTION "public"."get_user_names_for_export"(user_ids uuid[])
RETURNS TABLE(uid uuid, name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT uid, name
  FROM users
  WHERE uid = ANY(user_ids);
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION "public"."get_user_names_for_export"(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."get_user_names_for_export"(uuid[]) TO service_role;
