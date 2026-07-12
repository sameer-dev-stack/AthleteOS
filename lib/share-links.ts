export type ShareLinks = { twitter: string; whatsapp: string; email: string };

// Builds social share deep-links. Pure + encoded so the component stays presentational.
export function buildShareLinks(link: string, text: string): ShareLinks {
  const t = encodeURIComponent(text);
  const u = encodeURIComponent(link);
  return {
    twitter: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + link)}`,
    email: `mailto:?subject=${encodeURIComponent("Join AthleteOS")}&body=${encodeURIComponent(text + " " + link)}`,
  };
}
