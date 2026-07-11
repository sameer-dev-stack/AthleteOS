const MODEL_NAME = process.env.MIMO_MODEL || "mimo-v2.5-pro";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AIMemoryContext = {
  preferred_tone: string;
  preferred_output_length: string;
  tools_used_count: Record<string, number>;
  outputs_saved_count: number;
  outputs_regenerated_count: number;
  outputs_ignored_count: number;
  last_used_tool: string | null;
  // Optional: enriched from athlete_knowledge table
  athleteKnowledge?: {
    content_themes?: string[];
    best_performing_content?: { type: string; label: string; score: number }[];
    growth_trends?: { direction: string }[];
    recommended_actions?: string[];
    brand_voice?: string | null;
  } | null;
};

type GenerateBioOptions = {
  sport: string;
  school: string;
  position: string;
  tone: "confident" | "humble" | "energetic" | "storyteller";
  existingBio?: string | null;
  memoryContext?: AIMemoryContext;
};

type GeneratePitchOptions = {
  brandName: string;
  sport: string;
  school: string;
  position: string;
  audienceSize: string;
  engagementRate: string;
  athleteBio: string;
  goal: string;
  memoryContext?: AIMemoryContext;
};

type GenerateCaptionsOptions = {
  context: "win" | "sponsorship" | "training" | "milestone" | "personal";
  sport: string;
  school: string;
  tone: "confident" | "humble" | "energetic" | "storyteller";
  athleteBio: string;
  memoryContext?: AIMemoryContext;
};

type OptimizeProfileOptions = {
  fullName: string;
  sport: string;
  school: string;
  position: string;
  bio: string;
  stats: { label: string; value: string }[];
  links: { label: string; url: string }[];
  highlights: { title: string; url: string }[];
  memoryContext?: AIMemoryContext;
};

type GenerateRateOptions = {
  sport: string;
  school: string;
  position: string;
  audienceSize: string;
  engagementRate: string;
  niche: string;
  pastDeals: string;
  memoryContext?: AIMemoryContext;
};

// ── Memory block builder ──────────────────────────────────────────────────────

function buildMemoryBlock(ctx: AIMemoryContext): string {
  const topTools = Object.entries(ctx.tools_used_count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tool, count]) => `${tool} (${count} uses)`)
    .join(", ");

  const totalOutputs = ctx.outputs_saved_count + ctx.outputs_regenerated_count + ctx.outputs_ignored_count;
  const saveRate = totalOutputs > 0
    ? Math.round((ctx.outputs_saved_count / totalOutputs) * 100)
    : null;

  let knowledgeBlock = "";
  const ak = ctx.athleteKnowledge;
  if (ak) {
    const themes = ak.content_themes?.slice(0, 3).join(", ");
    const topContent = ak.best_performing_content?.[0]?.label;
    const trendDirection = ak.growth_trends?.[0]?.direction;
    const focusItems = ak.recommended_actions?.slice(0, 2).join("; ");
    const voiceHint = ak.brand_voice;

    knowledgeBlock = `

## Athlete Knowledge Profile (learned from platform activity):
${themes ? `- Content themes: ${themes}` : ""}
${topContent ? `- Best performing output type: ${topContent}` : ""}
${trendDirection ? `- Growth trend: ${trendDirection}` : ""}
${focusItems ? `- Current focus areas: ${focusItems}` : ""}
${voiceHint ? `- Brand voice: ${voiceHint}` : ""}
Use this context to personalize outputs — reference their strengths and growth areas naturally.`;
  }

  return `
## AI Memory (learned from your history):
- Preferred tone: ${ctx.preferred_tone.charAt(0).toUpperCase() + ctx.preferred_tone.slice(1)}
- Preferred output length: ${ctx.preferred_output_length}
- Most used tools: ${topTools || "None yet"}
- Outputs saved: ${ctx.outputs_saved_count}${saveRate !== null ? ` (${saveRate}% save rate)` : ""}
- Regenerated without saving: ${ctx.outputs_regenerated_count}
- Last active tool: ${ctx.last_used_tool || "N/A"}
Apply these preferences in your output — prioritize the preferred tone and length.${knowledgeBlock}
`.trim();
}

// ── Tone definitions ──────────────────────────────────────────────────────────

const TONE_INSTRUCTIONS: Record<string, string> = {
  confident:
    "Write with bold confidence. Be direct, self-assured, and impactful. Show dominance on and off the field.",
  humble:
    "Write with quiet confidence. Be grounded, authentic, and relatable. Show character and work ethic.",
  energetic:
    "Write with high energy and enthusiasm. Be dynamic, exciting, and engaging. Capture the thrill of competition.",
  storyteller:
    "Write as a narrative. Tell a brief story about the athlete's journey, challenges overcome, and goals ahead.",
};

const SYSTEM_PROMPT =
  "You are a professional sports copywriter who writes compelling athlete content for NIL marketing. You write in a modern, authentic voice that resonates with Gen Z athletes and brand partners.";

// ── Core API caller ───────────────────────────────────────────────────────────

export async function callGemini(
  prompt: string,
  systemPrompt: string,
  maxTokens: number,
  retries = 3,
  delay = 3000
): Promise<string> {
  const apiKey = process.env.MIMO_API_KEY;
  if (!apiKey) {
    throw new Error("MIMO_API_KEY environment variable is not set");
  }
  const modelName = process.env.MIMO_MODEL || "mimo-v2.5-pro";

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);
      try {
        const response = await fetch("https://api.xiaomimimo.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt },
            ],
            temperature: 0.8,
            max_tokens: maxTokens,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`MiMo API returned ${response.status}`);
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error("Invalid response format from MiMo API");
        }
        return content.trim();
      } finally {
        clearTimeout(timeout);
      }
    } catch (err: unknown) {
      console.error(`Attempt ${attempt + 1} failed:`, err);
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, delay * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }

  throw new Error("MiMo API unavailable after retries");
}

// ── Bio Variations ────────────────────────────────────────────────────────────

export async function generateBioVariations(
  options: GenerateBioOptions
): Promise<string[]> {
  const { sport, school, position, tone, existingBio, memoryContext } = options;

  const memoryBlock = memoryContext ? `\n\n${buildMemoryBlock(memoryContext)}` : "";

  const prompt = `Generate 3 distinct NIL (Name, Image, Likeness) bio variations for a student-athlete.

Athlete details:
- Sport: ${sport}
- School: ${school}
- Position: ${position}
- Tone: ${TONE_INSTRUCTIONS[tone]}${existingBio ? `\n\nExisting bio to improve upon: "${existingBio}"` : ""}${memoryBlock}

Requirements:
- Each bio must be under 280 characters
- Make each variation noticeably different in style and content
- Include specific details about their sport and school
- Sound like a real athlete, not a corporate brochure
- Optimized for NIL brand partnerships and fan engagement

Return exactly 3 bios, each on a separate line, prefixed with "BIO 1:", "BIO 2:", "BIO 3:". Do not include any other text.`;

  const content = await callGemini(prompt, SYSTEM_PROMPT, 500);

  const bios = content
    .split("\n")
    .filter((line) => line.match(/^BIO \d:/))
    .map((line) => line.replace(/^BIO \d:\s*/, "").trim())
    .filter((bio) => bio.length > 0 && bio.length <= 280);

  if (bios.length < 3) {
    throw new Error("AI returned fewer than 3 valid bios. Please try again.");
  }

  return bios.slice(0, 3);
}

// ── Sponsor Pitch ─────────────────────────────────────────────────────────────

export async function generateSponsorPitch(
  options: GeneratePitchOptions
): Promise<string[]> {
  const { brandName, sport, school, position, audienceSize, engagementRate, athleteBio, goal, memoryContext } =
    options;

  const memoryBlock = memoryContext ? `\n\n${buildMemoryBlock(memoryContext)}` : "";

  const prompt = `Write 3 different sponsor outreach pitch variations for a student-athlete reaching out to ${brandName}.

Athlete details:
- Sport: ${sport}
- School: ${school}
- Position: ${position}
- Audience size: ${audienceSize}
- Engagement rate: ${engagementRate}
- Bio: ${athleteBio || "N/A"}
- Goal: ${goal}${memoryBlock}

Requirements:
- Each pitch should have a subject line and a 3-paragraph body
- Sound professional but authentic — not spammy or desperate
- Reference the brand specifically and explain the value alignment
- Include concrete numbers (audience size, engagement)
- Each variation should take a different angle (partnership, content creation, event appearance, etc.)

Return exactly 3 pitches. Each pitch should be prefixed with "PITCH 1:", "PITCH 2:", "PITCH 3:". Separate the subject line with "SUBJECT:" and paragraphs with blank lines. Do not include any other text.`;

  const content = await callGemini(
    prompt,
    "You are a sports marketing specialist who writes compelling NIL sponsor outreach pitches. You understand brand partnerships, content deals, and athlete marketing.",
    1500
  );

  const pitches = content
    .split(/PITCH \d:/)
    .slice(1)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (pitches.length < 3) {
    throw new Error("AI returned fewer than 3 valid pitches. Please try again.");
  }

  return pitches.slice(0, 3);
}

// ── Captions ──────────────────────────────────────────────────────────────────

export async function generateCaptions(
  options: GenerateCaptionsOptions
): Promise<string[]> {
  const { context, sport, school, tone, athleteBio, memoryContext } = options;

  const contextDescriptions: Record<string, string> = {
    win: "A recent game win or competitive victory",
    sponsorship: "A new brand partnership or sponsorship announcement",
    training: "Training, practice, or off-season preparation",
    milestone: "A personal or career milestone (records, awards, rankings)",
    personal: "A personal story, journey, or behind-the-scenes moment",
  };

  const memoryBlock = memoryContext ? `\n\n${buildMemoryBlock(memoryContext)}` : "";

  const prompt = `Write 3 social media caption variations for a student-athlete's ${context} post.

Context: ${contextDescriptions[context]}
Sport: ${sport}
School: ${school}
Tone: ${TONE_INSTRUCTIONS[tone]}
Bio: ${athleteBio || "N/A"}${memoryBlock}

Requirements:
- Each caption should be 1-3 sentences, punchy and scroll-stopping
- Include 3-5 relevant hashtags at the end of each caption
- Sound like a real athlete posting, not a brand manager
- Optimized for engagement (likes, comments, shares)
- Each variation should feel noticeably different

Return exactly 3 captions, each on a separate line, prefixed with "CAPTION 1:", "CAPTION 2:", "CAPTION 3:". Do not include any other text.`;

  const content = await callGemini(
    prompt,
    "You are a social media strategist who writes viral captions for student-athletes. You understand platform algorithms, Gen Z voice, and NIL marketing.",
    800
  );

  const captions = content
    .split(/CAPTION \d:/)
    .slice(1)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  if (captions.length < 3) {
    throw new Error("AI returned fewer than 3 valid captions. Please try again.");
  }

  return captions.slice(0, 3);
}

// ── Profile Optimizer ─────────────────────────────────────────────────────────

export async function optimizeProfile(
  options: OptimizeProfileOptions
): Promise<{ critique: string; optimizedBio: string; suggestions: string[] }> {
  const { fullName, sport, school, position, bio, stats, links, highlights, memoryContext } =
    options;

  const memoryBlock = memoryContext ? `\n\n${buildMemoryBlock(memoryContext)}` : "";

  const prompt = `Analyze and optimize this student-athlete's NIL profile.

Name: ${fullName || "N/A"}
Sport: ${sport || "N/A"}
School: ${school || "N/A"}
Position: ${position || "N/A"}
Current bio: ${bio || "No bio yet"}
Stats: ${stats.length > 0 ? stats.map((s) => `${s.label}: ${s.value}`).join(", ") : "None"}
Links: ${links.length > 0 ? links.map((l) => l.label).join(", ") : "None"}
Highlights: ${highlights.length > 0 ? highlights.map((h) => h.title).join(", ") : "None"}${memoryBlock}

Provide:
1. A brief critique of the current profile (2-3 sentences on what's strong and what's weak)
2. An optimized bio (under 280 characters) that improves on the current one
3. 3-5 specific, actionable suggestions to make the profile more brand-ready

Return in this exact format:
CRITIQUE: [your critique]
OPTIMIZED BIO: [optimized bio under 280 chars]
SUGGESTIONS:
- [suggestion 1]
- [suggestion 2]
- [suggestion 3]`;

  const content = await callGemini(
    prompt,
    "You are a NIL profile optimization expert. You analyze athlete profiles and provide actionable advice to make them more attractive to brand sponsors. Be specific and direct.",
    1000
  );

  const critiqueMatch = content.match(/CRITIQUE:\s*(.+?)(?=\nOPTIMIZED|$)/s);
  const bioMatch = content.match(/OPTIMIZED BIO:\s*(.+?)(?=\nSUGGESTIONS|$)/s);
  const suggestionsMatch = content.match(/SUGGESTIONS:\s*([\s\S]+)$/);

  const suggestions =
    suggestionsMatch?.[1]
      ?.split("\n")
      .filter((s) => s.trim().startsWith("-"))
      .map((s) => s.replace(/^-\s*/, "").trim()) || [];

  return {
    critique: critiqueMatch?.[1]?.trim() || "No critique generated.",
    optimizedBio: bioMatch?.[1]?.trim()?.slice(0, 280) || bio || "",
    suggestions: suggestions.slice(0, 5),
  };
}

// ── Rate Guidance ─────────────────────────────────────────────────────────────

export async function generateRateGuidance(
  options: GenerateRateOptions
): Promise<string> {
  const { sport, school, position, audienceSize, engagementRate, niche, pastDeals, memoryContext } =
    options;

  const memoryBlock = memoryContext ? `\n\n${buildMemoryBlock(memoryContext)}` : "";

  const prompt = `Provide NIL pricing guidance for a student-athlete.

Athlete details:
- Sport: ${sport}
- School: ${school}
- Position: ${position}
- Audience size: ${audienceSize}
- Engagement rate: ${engagementRate}
- Niche/focus area: ${niche || "General sports"}
- Past deals: ${pastDeals || "None yet"}${memoryBlock}

Provide structured pricing guidance covering:
1. Estimated post rate range (single social media post)
2. Estimated story/reel rate range
3. Estimated appearance/event rate range
4. Estimated long-term partnership monthly rate range
5. 3-5 factors that could increase their rate
6. 3 actionable steps to increase their rates

Be specific with dollar ranges based on their audience size and engagement. Include a disclaimer that these are estimates and actual rates vary.

Return in this exact format:
PRICING GUIDANCE:
[Your pricing analysis with specific dollar ranges]

DISCLAIMER: [Brief disclaimer about estimates]`;

  const content = await callGemini(
    prompt,
    "You are a NIL valuation expert who helps student-athletes understand their market value. You provide realistic, data-informed pricing guidance based on audience size, engagement, sport, and market trends. Be direct and helpful.",
    1200
  );

  return content.trim();
}

// ── Streaming variants ────────────────────────────────────────────────────────

async function callGeminiStream(
  prompt: string,
  systemPrompt: string,
  maxTokens: number
): Promise<ReadableStream<string>> {
  const apiKey = process.env.MIMO_API_KEY;
  if (!apiKey) {
    throw new Error("MIMO_API_KEY environment variable is not set");
  }
  const modelName = process.env.MIMO_MODEL || "mimo-v2.5-pro";

  const response = await fetch("https://api.xiaomimimo.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`MiMo API returned ${response.status}: ${errText}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) controller.enqueue(delta);
          } catch { /* skip malformed lines */ }
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

export async function streamBioVariations(options: GenerateBioOptions): Promise<ReadableStream<string>> {
  const { sport, school, position, tone, existingBio, memoryContext } = options;
  const memoryBlock = memoryContext ? `\n\n${buildMemoryBlock(memoryContext)}` : "";
  const prompt = `Generate 3 distinct NIL (Name, Image, Likeness) bio variations for a student-athlete.

Athlete details:
- Sport: ${sport}
- School: ${school}
- Position: ${position}
- Tone: ${TONE_INSTRUCTIONS[tone]}${existingBio ? `\n\nExisting bio to improve upon: "${existingBio}"` : ""}${memoryBlock}

Requirements:
- Each bio must be under 280 characters
- Make each variation noticeably different in style and content
- Include specific details about their sport and school
- Sound like a real athlete, not a corporate brochure

Write each bio on a separate line, prefixed with "BIO 1:", "BIO 2:", "BIO 3:".`;
  return callGeminiStream(prompt, SYSTEM_PROMPT, 500);
}

export async function streamSponsorPitch(options: GeneratePitchOptions): Promise<ReadableStream<string>> {
  const { brandName, sport, school, position, audienceSize, engagementRate, athleteBio, goal, memoryContext } = options;
  const memoryBlock = memoryContext ? `\n\n${buildMemoryBlock(memoryContext)}` : "";
  const prompt = `Write 3 different sponsor outreach pitch variations for a student-athlete reaching out to ${brandName}.

Athlete details:
- Sport: ${sport}
- School: ${school}
- Position: ${position}
- Audience size: ${audienceSize}
- Engagement rate: ${engagementRate}
- Bio: ${athleteBio || "N/A"}
- Goal: ${goal}${memoryBlock}

Requirements:
- Each pitch should have a subject line and a 3-paragraph body
- Sound professional but authentic
- Reference the brand specifically
- Each prefixed with "PITCH 1:", "PITCH 2:", "PITCH 3:". Subject line with "SUBJECT:".`;
  return callGeminiStream(prompt, "You are a sports marketing specialist who writes compelling NIL sponsor outreach pitches.", 1500);
}

export async function streamCaptions(options: GenerateCaptionsOptions): Promise<ReadableStream<string>> {
  const { context, sport, school, tone, athleteBio, memoryContext } = options;
  const contextDescriptions: Record<string, string> = {
    win: "A recent game win or competitive victory",
    sponsorship: "A new brand partnership or sponsorship announcement",
    training: "Training, practice, or off-season preparation",
    milestone: "A personal or career milestone",
    personal: "A personal story, journey, or behind-the-scenes moment",
  };
  const memoryBlock = memoryContext ? `\n\n${buildMemoryBlock(memoryContext)}` : "";
  const prompt = `Write 3 social media caption variations for a student-athlete's ${context} post.

Context: ${contextDescriptions[context]}
Sport: ${sport}
School: ${school}
Tone: ${TONE_INSTRUCTIONS[tone]}
Bio: ${athleteBio || "N/A"}${memoryBlock}

Requirements:
- 1-3 sentences, punchy and scroll-stopping
- Include 3-5 relevant hashtags at the end
- Each prefixed with "CAPTION 1:", "CAPTION 2:", "CAPTION 3:".`;
  return callGeminiStream(prompt, "You are a social media strategist who writes viral captions for student-athletes.", 800);
}
