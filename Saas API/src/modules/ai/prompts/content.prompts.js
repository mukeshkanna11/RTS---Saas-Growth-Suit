const EMAIL_SYSTEM = `You are a conversion-focused email marketing expert.
You write subject lines and email copy that get opens, clicks, and conversions.
Respond with ONLY the requested content — no explanations.`;

const SOCIAL_SYSTEM = `You are a social media strategist with expertise across LinkedIn, Twitter/X, Instagram, and Facebook.
You write platform-native content that drives engagement, follows platform best practices, and uses appropriate tone per platform.
Respond with ONLY the requested content — no explanations.`;

const ADS_SYSTEM = `You are a performance marketing specialist who writes high-converting ad copy.
You know AIDA (Attention, Interest, Desire, Action) and direct response copywriting.
Respond with ONLY the requested content — no explanations.`;

const emailSubjectPrompt = ({ topic, tone = "professional", targetAudience = "subscribers" }) => ({
  system: EMAIL_SYSTEM,
  user: `Generate 5 email subject lines for: "${topic}"

Rules:
- Keep each under 50 characters for mobile preview
- Mix approaches: question, curiosity gap, number, urgency, benefit
- Tone: ${tone}
- Audience: ${targetAudience}
- Number each line 1-5`,
});

const emailBodyPrompt = ({ topic, goal, tone = "professional", targetAudience = "subscribers" }) => ({
  system: EMAIL_SYSTEM,
  user: `Write a complete marketing email for: "${topic}"

Goal: ${goal || "Drive engagement"}
Tone: ${tone}
Audience: ${targetAudience}

Structure:
- Opening hook (1-2 sentences)
- Main body (3-4 short paragraphs)
- CTA (clear, single action)
- PS line (optional but effective)`,
});

const socialPostPrompt = ({ topic, platform, tone = "professional", includeHashtags = true }) => ({
  system: SOCIAL_SYSTEM,
  user: `Write 3 ${platform} posts about: "${topic}"

Platform requirements:
- LinkedIn: Professional, value-driven, 150-300 words, storytelling hook
- Twitter/X: Punchy, under 280 chars, conversational
- Instagram: Visual hook first, emotional, 100-150 words
- Facebook: Community-focused, question or story format

Tone: ${tone}
${includeHashtags ? "Include 3-5 relevant hashtags for each post." : "No hashtags."}

Number each post 1-3, separated by a blank line.`,
});

const adCopyPrompt = ({ product, platform, goal, tone = "persuasive", targetAudience }) => ({
  system: ADS_SYSTEM,
  user: `Write ad copy for: "${product}"

Platform: ${platform || "Google Ads"}
Goal: ${goal || "Drive conversions"}
Audience: ${targetAudience || "potential customers"}
Tone: ${tone}

Deliver:
1. Headline (30 chars max for Google, 40 for Meta)
2. Primary text / description (90 chars for Google, 125 for Meta)
3. CTA button text (2-4 words)

Write 3 variations, numbered 1-3.`,
});

module.exports = { emailSubjectPrompt, emailBodyPrompt, socialPostPrompt, adCopyPrompt };
