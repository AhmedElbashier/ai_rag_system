-- Create a table containing subscriptions
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- or text, depending on our auth setup
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT, -- 'active', 'canceled', etc
  plan_tier TEXT DEFAULT 'free', -- 'free' or 'pro'
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Modify documents table slightly to associate uploaded docs to users
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id UUID;
