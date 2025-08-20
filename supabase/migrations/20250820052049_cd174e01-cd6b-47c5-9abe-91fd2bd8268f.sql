-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view members of circles they belong to" ON circle_members;

-- Create a security definer function to check if user is member of a circle
CREATE OR REPLACE FUNCTION public.is_circle_member(_circle_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.circle_members
    WHERE circle_id = _circle_id
      AND user_id = _user_id
  )
$$;

-- Create new policy using the security definer function
CREATE POLICY "Users can view members of circles they belong to"
ON circle_members
FOR SELECT
USING (public.is_circle_member(circle_id, auth.uid()));