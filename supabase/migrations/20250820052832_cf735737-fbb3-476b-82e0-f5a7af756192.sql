-- Drop the problematic policy for circles
DROP POLICY IF EXISTS "Users can view circles they're members of" ON circles;

-- Create a security definer function to check membership without recursion
CREATE OR REPLACE FUNCTION public.user_can_view_circle(_circle_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM circles WHERE id = _circle_id AND created_by = _user_id
  ) OR EXISTS (
    SELECT 1 FROM circle_members WHERE circle_id = _circle_id AND user_id = _user_id
  )
$$;

-- Create new policy using the security definer function
CREATE POLICY "Users can view accessible circles"
ON circles
FOR SELECT
USING (public.user_can_view_circle(id, auth.uid()));