const SYSTEM = `You are a professional content writer and SEO specialist.
You write engaging, well-structured long-form content that ranks on Google and converts readers.
Use proper HTML heading hierarchy (H2, H3). Write in a clear, authoritative style.
Respond with ONLY the blog content — no meta-commentary.`;

const blogOutlinePrompt = ({ topic, tone = "professional", targetAudience = "general", wordCount = 1500 }) => ({
  system: SYSTEM,
  user: `Create a detailed blog post outline for: "${topic}"

Requirements:
- Target word count: ${wordCount} words
- Tone: ${tone}
- Target audience: ${targetAudience}
- Include: Introduction, 5-7 H2 sections with H3 subsections, Conclusion, FAQ (3 questions)
- Each section with a brief description of what to cover`,
});

const blogPostPrompt = ({ topic, outline, tone = "professional", targetAudience = "general", wordCount = 1500 }) => ({
  system: SYSTEM,
  user: `Write a complete, SEO-optimized blog post about: "${topic}"

${outline ? `Follow this outline:\n${outline}\n` : ""}
Requirements:
- Approximately ${wordCount} words
- Tone: ${tone}
- Target audience: ${targetAudience}
- Use H2 and H3 tags for headings
- Include an engaging introduction with a hook
- Add a strong conclusion with a CTA
- Naturally incorporate the topic keyword throughout`,
});

module.exports = { blogOutlinePrompt, blogPostPrompt };
