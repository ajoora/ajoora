-- Drop the problematic function and policy
DROP POLICY IF EXISTS "Users can view members of circles they belong to" ON circle_members;
DROP FUNCTION IF EXISTS public.is_circle_member(uuid, uuid);

-- Create a simpler approach: allow viewing members if user is circle creator OR if there's a direct membership record
CREATE POLICY "Circle creators and members can view member list"
ON circle_members
FOR SELECT
USING (
  -- User is the circle creator
  EXISTS (
    SELECT 1 
    FROM circles 
    WHERE circles.id = circle_members.circle_id 
    AND circles.created_by = auth.uid()
  )
  OR
  -- User is viewing their own membership record
  user_id = auth.uid()
);