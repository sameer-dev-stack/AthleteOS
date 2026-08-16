import { buildShareLinks } from "@/lib/share-links";

describe("buildShareLinks", () => {
  const link = "https://athlete-os-vert.vercel.app/r/ABC123";
  const text = "Claim your free athlete card on NIL CARD";
  const enc = encodeURIComponent;

  it("builds twitter intent", () => {
    expect(buildShareLinks(link, text).twitter)
      .toBe(`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(link)}`);
  });
  it("builds whatsapp link", () => {
    expect(buildShareLinks(link, text).whatsapp)
      .toBe(`https://wa.me/?text=${enc(text + " " + link)}`);
  });
  it("builds mailto link", () => {
    const m = buildShareLinks(link, text).email;
    expect(m.startsWith("mailto:?")).toBe(true);
    expect(m).toContain(`subject=${enc("Join NIL CARD")}`);
    expect(m).toContain(`body=${enc(text + " " + link)}`);
  });
});
