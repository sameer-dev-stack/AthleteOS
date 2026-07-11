import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

type SetName = "waitlist" | "newsletter";

export type AddResult = {
  added: boolean;
  total: number;
  confirmationToken?: string;
};

export interface Storage {
  addEmail(set: SetName, email: string, source?: string, confirmationToken?: string): Promise<AddResult>;
  getCount(set: SetName): Promise<number>;
  isRateLimited(key: string, windowSec: number, max: number): Promise<boolean>;
  mode: "supabase" | "file";
}

const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

let _storage: Storage | null = null;

export async function getStorage(): Promise<Storage> {
  if (_storage) return _storage;
  _storage = hasSupabase ? createSupabaseStorage() : createFileStorage();
  return _storage;
}

function createSupabaseStorage(): Storage {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  return {
    mode: "supabase",
    async addEmail(set, email, source = "landing", confirmationToken) {
      const insertData: Record<string, unknown> = { email, source };
      if (confirmationToken && set === "waitlist") {
        insertData.confirmation_token = confirmationToken;
      }
      const { data, error } = await supabase
        .from(set)
        .insert(insertData)
        .select("id, confirmation_token")
        .single();

      if (error) {
        if (error.code === "23505") {
          const { count } = await supabase
            .from(set)
            .select("id", { count: "exact", head: true });
          return { added: false, total: count ?? 0 };
        }
        throw error;
      }

      const { count } = await supabase
        .from(set)
        .select("id", { count: "exact", head: true });

      return {
        added: true,
        total: count ?? 0,
        confirmationToken: data?.confirmation_token ?? undefined,
      };
    },
    async getCount(set) {
      const { count } = await supabase
        .from(set)
        .select("id", { count: "exact", head: true });
      return count ?? 0;
    },
    async isRateLimited(key, windowSec, max) {
      const windowStart = new Date(
        Date.now() - windowSec * 1000
      ).toISOString();

      // Atomic: increment count and check in one operation to avoid TOCTOU race
      const { data: existing, error: selectErr } = await supabase
        .from("rate_limits")
        .select("id, count")
        .eq("key", key)
        .gt("window_start", windowStart)
        .single();

      if (!existing) {
        const { error: insertErr } = await supabase
          .from("rate_limits")
          .insert({ key, count: 1, window_start: new Date().toISOString() });
        if (insertErr) {
          // Race: another request inserted first — try to increment theirs
          const { data: retry } = await supabase
            .from("rate_limits")
            .select("id, count")
            .eq("key", key)
            .gt("window_start", windowStart)
            .single();
          if (retry && retry.count < max) {
            await supabase
              .from("rate_limits")
              .update({ count: retry.count + 1 })
              .eq("id", retry.id);
            return false;
          }
          return true;
        }
        return false;
      }

      if (existing.count >= max) return true;

      const { error: updateErr } = await supabase
        .from("rate_limits")
        .update({ count: existing.count + 1 })
        .eq("id", existing.id);
      if (updateErr) {
        console.error("[storage] rate limit update failed", updateErr);
      }

      return false;
    },
  };
}

function createFileStorage(): Storage {
  const DATA_DIR = path.join(process.cwd(), "data");
  const fileFor = (s: SetName) =>
    s === "waitlist"
      ? process.env.WAITLIST_FILE || path.join(DATA_DIR, "waitlist.json")
      : process.env.NEWSLETTER_FILE || path.join(DATA_DIR, "newsletter.json");

  type Entry = { email: string; source?: string; joinedAt: string; confirmationToken?: string };

  async function ensureFile(file: string) {
    try {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.access(file);
    } catch {
      await fs.writeFile(
        file,
        JSON.stringify({ entries: [] }, null, 2),
        "utf-8"
      );
    }
  }

  async function readEntries(file: string): Promise<Entry[]> {
    await ensureFile(file);
    try {
      const raw = await fs.readFile(file, "utf-8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed?.entries) ? parsed.entries : [];
    } catch {
      return [];
    }
  }

  async function writeEntries(file: string, entries: Entry[]) {
    await ensureFile(file);
    await fs.writeFile(
      file,
      JSON.stringify({ entries }, null, 2),
      "utf-8"
    );
  }

  const rateCache = new Map<string, { count: number; resetAt: number }>();

  return {
    mode: "file",
    async addEmail(set, email, source = "landing", token) {
      const file = fileFor(set);
      const entries = await readEntries(file);
      if (entries.some((e) => e.email === email)) {
        return { added: false, total: entries.length };
      }
      const entry: Entry = { email, source, joinedAt: new Date().toISOString() };
      if (token && set === "waitlist") {
        entry.confirmationToken = token;
      }
      entries.push(entry);
      await writeEntries(file, entries);
      return { added: true, total: entries.length, confirmationToken: entry.confirmationToken };
    },
    async getCount(set) {
      const entries = await readEntries(fileFor(set));
      return entries.length;
    },
    async isRateLimited(key, windowSec, max) {
      const now = Date.now();
      const entry = rateCache.get(key);
      if (!entry || entry.resetAt < now) {
        rateCache.set(key, { count: 1, resetAt: now + windowSec * 1000 });
        return false;
      }
      entry.count += 1;
      if (entry.count >= max) return true;
      return false;
    },
  };
}
