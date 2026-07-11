# Production Setup Guide

## Prerequisites

1. **Vercel Account** - For hosting
2. **Supabase Project** - For database & auth
3. **Stripe Account** - For payments
4. **Sentry Account** (optional) - For error monitoring
5. **Resend Account** (optional) - For emails
6. **Upstash Account** (optional) - For rate limiting

## Step 1: Database Setup

### Supabase Storage Bucket

Create a storage bucket named `content-media`:

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-media', 'content-media', true);

-- Allow authenticated users to upload
CREATE POLICY "Athletes can upload content"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'content-media');

-- Allow public read access
CREATE POLICY "Public can view content"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'content-media');
```

### Referral System Tables

```sql
-- Add referral code to athletes table
ALTER TABLE athletes ADD COLUMN referral_code TEXT UNIQUE;

-- Create referrals tracking table
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES athletes(id) NOT NULL,
  referee_id UUID REFERENCES athletes(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referee_id)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
```

## Step 2: Environment Variables

Copy `.env.example` to `.env.local` and fill in all values.

### Vercel Environment Variables

Add these to your Vercel project:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_SENTRY_DSN` (optional)
- `SENTRY_ORG` (optional)
- `SENTRY_PROJECT` (optional)
- `RESEND_API_KEY` (optional)
- `UPSTASH_REDIS_REST_URL` (optional)
- `UPSTASH_REDIS_REST_TOKEN` (optional)
- `ADMIN_EMAIL`

## Step 3: Stripe Configuration

1. **Enable Webhook**:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.deleted`
     - `customer.subscription.updated`
   - Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

2. **Test webhook locally**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

## Step 4: Sentry Setup (Optional)

1. Create project at sentry.io
2. Copy DSN to `NEXT_PUBLIC_SENTRY_DSN`
3. Set `SENTRY_ORG` and `SENTRY_PROJECT`

## Step 5: Resend Setup (Optional)

1. Create account at resend.com
2. Verify sender domain
3. Copy API key to `RESEND_API_KEY`
4. Update email addresses in `lib/email.ts`

## Step 6: Upstash Setup (Optional)

1. Create Redis database at upstash.com
2. Copy REST URL and token
3. Add to `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

## Step 7: Deploy

Push to main branch - Vercel will auto-deploy.

## Testing in Production

1. Create athlete account
2. Test profile customization
3. Test Stripe checkout flows
4. Test brand inquiry system
5. Monitor Sentry for errors
6. Check rate limiting works

## Monitoring

- **Vercel**: Deployments, logs, analytics
- **Sentry**: Error tracking, performance
- **Stripe**: Payment monitoring
- **Supabase**: Database, auth, storage

## Maintenance

- Monitor error rates in Sentry
- Review Stripe webhook delivery
- Check database performance in Supabase
- Update dependencies monthly
- Review rate limit thresholds
