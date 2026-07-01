const SYSTEM = `You are an expert SEO strategist with 10+ years of experience ranking content on Google.
You write concise, high-CTR copy that balances keyword inclusion with natural readability.
Always respond with ONLY the requested output — no explanations, no preamble, no markdown formatting.`;

const seoTitlePrompt = ({ keyword, tone = "professional", targetAudience = "general" }) => ({
  system: SYSTEM,
  user: `Generate 5 SEO-optimized title tags for the keyword: "${keyword}"

Rules:
- Each title must be 50-60 characters
- Include the primary keyword naturally
- Tone: ${tone}
- Target audience: ${targetAudience}
- Use power words (Best, Ultimate, Complete, Proven, etc.) where appropriate
- Each title on a new line, numbered 1-5
- No quotes around titles`,
});

const metaDescriptionPrompt = ({ keyword, title, tone = "professional" }) => ({
  system: SYSTEM,
  user: `Generate 3 meta descriptions for:
Keyword: "${keyword}"
${title ? `Page title: "${title}"` : ""}

Rules:
- Each description must be 150-160 characters
- Include the keyword naturally
- End with a soft CTA (Learn more, Discover, Get started, etc.)
- Tone: ${tone}
- Each description on a new line, numbered 1-3
- No quotes`,
});

module.exports = { seoTitlePrompt, metaDescriptionPrompt };
