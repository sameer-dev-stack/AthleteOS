import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createAdminUser(email: string, password: string, fullName?: string) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName || email.split("@")[0],
    },
  });

  if (error) {
    console.error("Failed to create auth user:", error.message);
    process.exit(1);
  }

  const userId = data.user.id;
  console.log(`Created auth user: ${userId}`);

  const { error: profileError } = await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        email,
        full_name: fullName || email.split("@")[0],
        role: "admin",
        email_confirmed: true,
        plan: "pro",
      },
      { onConflict: "id" }
    );

  if (profileError) {
    console.error("Failed to create profile:", profileError.message);
    process.exit(1);
  }

  console.log(`Admin profile created for: ${email}`);
}

const email = process.argv[2];
const password = process.argv[3];
const fullName = process.argv[4];

if (!email || !password) {
  console.error("Usage: npx tsx scripts/create-admin-user.ts <email> <password> [fullName]");
  process.exit(1);
}

createAdminUser(email, password, fullName);
