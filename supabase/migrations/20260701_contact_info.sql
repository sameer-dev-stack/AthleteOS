-- Migration: Add contact info fields to profiles
-- Athletes can set a public contact phone and contact email
-- (contact_email can differ from their auth email)

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_email TEXT;
