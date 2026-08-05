import type { Profile } from "@/lib/actions/profile";

export type CardFieldKey =
  | "avatar_url"
  | "full_name"
  | "sport"
  | "position"
  | "school"
  | "class_year"
  | "bio"
  | "stats"
  | "links"
  | "highlights"
  | "social"
  | "contact";

export const CARD_FIELDS: { key: CardFieldKey; label: string }[] = [
  { key: "avatar_url", label: "a profile photo" },
  { key: "full_name", label: "your full name" },
  { key: "sport", label: "your sport" },
  { key: "position", label: "your position" },
  { key: "school", label: "your school" },
  { key: "class_year", label: "your class year" },
  { key: "bio", label: "a bio (at least 15 characters)" },
  { key: "stats", label: "at least one stat" },
  { key: "links", label: "at least one link" },
  { key: "highlights", label: "at least one highlight" },
  { key: "social", label: "at least one social handle" },
  { key: "contact", label: "a contact email or phone number" },
] as const;

export type CardProfile = {
  avatar_url?: string | null;
  full_name?: string | null;
  sport?: string | null;
  position?: string | null;
  school?: string | null;
  class_year?: string | null;
  bio?: string | null;
  stats?: { label: string; value: string }[];
  links?: { label: string; url: string }[];
  highlights?: { title: string; url: string }[];
  social?: { twitter?: string; instagram?: string; tiktok?: string; youtube?: string };
  contact_email?: string | null;
  contact_phone?: string | null;
};

type HttpLinked<T extends { label?: string; url?: string }> = T;

function hasValidHttp<T extends { label?: string; url?: string }>(items: HttpLinked<T>[] | undefined | null): boolean {
  return !!items?.some((i) => i.label?.trim() && i.url?.trim() && /^https?:\/\/.+/.test(i.url.trim()));
}

export function getMissingCardFields(profile: CardProfile): CardFieldKey[] {
  const missing: CardFieldKey[] = [];
  if (!profile.avatar_url?.trim()) missing.push("avatar_url");
  if (!profile.full_name?.trim()) missing.push("full_name");
  if (!profile.sport?.trim()) missing.push("sport");
  if (!profile.position?.trim()) missing.push("position");
  if (!profile.school?.trim()) missing.push("school");
  if (!profile.class_year?.trim()) missing.push("class_year");
  if (!profile.bio?.trim() || profile.bio.trim().length < 15) missing.push("bio");
  if (!profile.stats?.length) missing.push("stats");
  if (!hasValidHttp(profile.links)) missing.push("links");
  if (!hasValidHttp(profile.highlights)) missing.push("highlights");
  if (!profile.social || !(profile.social.instagram || profile.social.twitter || profile.social.tiktok || profile.social.youtube)) {
    missing.push("social");
  }
  if (!profile.contact_email?.trim() && !profile.contact_phone?.trim()) missing.push("contact");
  return missing;
}

export function getMissingCardFieldLabels(profile: CardProfile): string[] {
  const missingKeys = getMissingCardFields(profile);
  return missingKeys.map((key) => CARD_FIELDS.find((f) => f.key === key)?.label || key);
}

export function isCardComplete(profile: CardProfile): boolean {
  return getMissingCardFields(profile).length === 0;
}

export function isPublishableProfile(profile: Pick<Profile, "avatar_url" | "full_name" | "sport" | "position" | "school" | "class_year" | "bio" | "stats" | "links" | "highlights" | "social" | "contact_email" | "contact_phone">): boolean {
  return isCardComplete(profile);
}