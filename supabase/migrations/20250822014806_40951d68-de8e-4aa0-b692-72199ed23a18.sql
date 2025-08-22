-- Drop the problematic RLS policy
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON public.invitations;

-- Create a security definer function to get current user email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT AS $$
  SELECT auth.email()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create new RLS policy using the security definer function
CREATE POLICY "Users can view invitations sent to their email" 
ON public.invitations 
FOR SELECT 
USING (email = public.get_current_user_email());

-- Also allow users to update invitations sent to their email (for accepting/declining)
CREATE POLICY "Users can update invitations sent to their email" 
ON public.invitations 
FOR UPDATE 
USING (email = public.get_current_user_email());