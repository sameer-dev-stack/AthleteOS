-- Allow authenticated fans to read members-only content if they have an active subscription
CREATE POLICY "Fans read subscribed content"
  ON content_posts FOR SELECT TO authenticated
  USING (
    published = true
    AND (
      is_members_only = false
      OR EXISTS (
        SELECT 1 FROM fan_subscriptions fs
        WHERE fs.fan_user_id = auth.uid()
          AND fs.athlete_id = content_posts.athlete_id
          AND fs.status = 'active'
          AND (
            content_posts.tier_required::text = 'free'
            OR fs.tier_id::text = content_posts.tier_required::text
          )
      )
    )
  );

-- Allow athletes to insert subscription records via server actions
CREATE POLICY "Athletes insert own fan subscriptions"
  ON fan_subscriptions FOR INSERT TO authenticated
  WITH CHECK (athlete_id = auth.uid());
