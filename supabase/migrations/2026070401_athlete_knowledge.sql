-- athlete_knowledge: persistent content intelligence per athlete
-- Separate from athlete_ai_memory (behavioral prefs) — this stores content patterns

create table if not exists athlete_knowledge (
  profile_id            uuid primary key references profiles(id) on delete cascade,

  -- Content intelligence
  brand_voice           text,                    -- top 3 adjectives, e.g. "bold, authentic, driven"
  content_themes        text[]    default '{}',  -- recurring topics they create
  best_performing_content jsonb   default '[]',  -- [{type, label, score}] top 5
  deal_preferences      jsonb     default '{}',  -- {accepted: [], declined: [], avg_response_hours: n}
  growth_trends         jsonb     default '[]',  -- [{week, direction, delta_followers, delta_views}]
  recommended_actions   text[]    default '{}',  -- 3-5 personalized action items

  -- Metadata
  last_learned_at       timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- RLS
alter table athlete_knowledge enable row level security;

-- Athletes can read their own row
create policy "athlete_knowledge_select_own"
  on athlete_knowledge for select
  using (profile_id = auth.uid());

-- Athletes can update their own row (for client-side patches)
create policy "athlete_knowledge_update_own"
  on athlete_knowledge for update
  using (profile_id = auth.uid());

-- Service role bypass (upserts from server actions use service role client)
-- No insert policy for anon/authenticated — inserts go through service role only
