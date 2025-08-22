-- Add missing foreign key constraints to invitations table
ALTER TABLE public.invitations 
ADD CONSTRAINT invitations_circle_id_fkey 
FOREIGN KEY (circle_id) REFERENCES public.circles(id) ON DELETE CASCADE;

-- Add foreign key for invited_by to reference profiles
ALTER TABLE public.invitations 
ADD CONSTRAINT invitations_invited_by_fkey 
FOREIGN KEY (invited_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;