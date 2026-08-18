CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tool TEXT NOT NULL,
  used_count INT DEFAULT 0,
  period_start DATE DEFAULT CURRENT_DATE,
  UNIQUE(user_id, tool, period_start)
);

CREATE INDEX idx_ai_usage_user ON ai_usage(user_id);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage"
  ON ai_usage FOR SELECT
  TO anon
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own usage"
  ON ai_usage FOR INSERT
  TO anon
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON ai_usage FOR UPDATE
  TO anon
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON ai_usage FOR ALL
  TO service_role
  USING (true);
