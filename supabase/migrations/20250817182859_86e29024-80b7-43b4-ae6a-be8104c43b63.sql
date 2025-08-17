-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create circles table for savings groups
CREATE TABLE public.circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  contribution_amount INTEGER NOT NULL, -- Amount in kobo/cents
  frequency TEXT NOT NULL DEFAULT 'monthly', -- weekly, monthly, etc
  max_members INTEGER NOT NULL DEFAULT 10,
  start_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, paused
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create circle_members table for membership tracking
CREATE TABLE public.circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  position INTEGER, -- Position in payout order
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active', -- active, left, removed
  UNIQUE(circle_id, user_id),
  UNIQUE(circle_id, position)
);

-- Create contributions table for tracking payments
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL, -- Amount in kobo/cents
  contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'bank_transfer',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, failed
  reference TEXT, -- Payment reference
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payouts table for tracking money distribution
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL, -- Amount in kobo/cents
  payout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Circles policies
CREATE POLICY "Users can view circles they're members of" ON public.circles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.circle_members 
    WHERE circle_id = circles.id AND user_id = auth.uid()
  ) OR created_by = auth.uid()
);
CREATE POLICY "Users can create circles" ON public.circles FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Circle creators can update their circles" ON public.circles FOR UPDATE USING (auth.uid() = created_by);

-- Circle members policies
CREATE POLICY "Users can view members of circles they belong to" ON public.circle_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.circle_members cm 
    WHERE cm.circle_id = circle_members.circle_id AND cm.user_id = auth.uid()
  )
);
CREATE POLICY "Circle creators can manage members" ON public.circle_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.circles 
    WHERE id = circle_members.circle_id AND created_by = auth.uid()
  )
);
CREATE POLICY "Users can join circles" ON public.circle_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Contributions policies
CREATE POLICY "Users can view contributions in their circles" ON public.contributions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.circle_members 
    WHERE circle_id = contributions.circle_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Users can create their own contributions" ON public.contributions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payouts policies
CREATE POLICY "Users can view payouts in their circles" ON public.payouts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.circle_members 
    WHERE circle_id = payouts.circle_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Circle creators can create payouts" ON public.payouts FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.circles 
    WHERE id = payouts.circle_id AND created_by = auth.uid()
  )
);

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.email));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_circles_updated_at BEFORE UPDATE ON public.circles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();