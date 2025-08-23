-- Create wallets table for user balance tracking
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0, -- Amount in kobo (smallest unit)
  currency TEXT NOT NULL DEFAULT 'NGN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create transactions table for payment history
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'contribution', 'payout')),
  amount INTEGER NOT NULL, -- Amount in kobo
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference TEXT UNIQUE, -- Paystack reference or internal reference
  description TEXT,
  circle_id UUID REFERENCES public.circles(id) ON DELETE SET NULL,
  paystack_reference TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Wallet policies
CREATE POLICY "Users can view their own wallet" 
ON public.wallets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" 
ON public.wallets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallets" 
ON public.wallets 
FOR INSERT 
WITH CHECK (true);

-- Transaction policies
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update transactions" 
ON public.transactions 
FOR UPDATE 
USING (true);

-- Add updated_at trigger for wallets
CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for transactions
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get or create wallet
CREATE OR REPLACE FUNCTION public.get_or_create_wallet(_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wallet_id UUID;
BEGIN
  -- Try to get existing wallet
  SELECT id INTO wallet_id
  FROM wallets
  WHERE user_id = _user_id;
  
  -- If no wallet exists, create one
  IF wallet_id IS NULL THEN
    INSERT INTO wallets (user_id, balance)
    VALUES (_user_id, 0)
    RETURNING id INTO wallet_id;
  END IF;
  
  RETURN wallet_id;
END;
$$;

-- Create function to update wallet balance
CREATE OR REPLACE FUNCTION public.update_wallet_balance(_user_id UUID, _amount INTEGER, _transaction_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
  wallet_id UUID;
BEGIN
  -- Get or create wallet
  wallet_id := get_or_create_wallet(_user_id);
  
  -- Get current balance
  SELECT balance INTO current_balance
  FROM wallets
  WHERE id = wallet_id;
  
  -- Check if withdrawal is valid
  IF _transaction_type IN ('withdrawal', 'contribution') AND current_balance < ABS(_amount) THEN
    RETURN FALSE;
  END IF;
  
  -- Update balance
  UPDATE wallets
  SET balance = current_balance + _amount,
      updated_at = now()
  WHERE id = wallet_id;
  
  RETURN TRUE;
END;
$$;