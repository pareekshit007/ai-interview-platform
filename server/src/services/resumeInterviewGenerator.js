const model = require("../config/gemini");
const { FALLBACK_POOL } = require("./questionGenerator");

// Fisher-Yates shuffle (local copy — keeps this module independent)
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Builds a text block describing the candidate from their structured
 * profile fields (always available, reliable) plus best-effort extracted
 * text from their uploaded resume file if it's a PDF (may fail silently —
 * profile fields alone are already enough context to work with).
 */
const buildResumeContext = async (user) => {
  const parts = [];
  if (user.summary?.trim())            parts.push(`Summary: ${user.summary.trim()}`);
  if (user.skills?.length)             parts.push(`Skills: ${user.skills.join(", ")}`);
  if (user.experience?.trim())         parts.push(`Experience: ${user.experience.trim()}`);
  if (user.projectsText?.trim())       parts.push(`Projects: ${user.projectsText.trim()}`);
  if (user.certificationsText?.trim()) parts.push(`Certifications: ${user.certificationsText.trim()}`);

  // Best-effort: also try to read the actual uploaded PDF text for extra keywords.
  // Cached on the user doc so we don't re-download/re-parse on every interview.
  if (user.resumeUrl && user.resumeUrl.toLowerCase().endsWith(".pdf")) {
    if (user.resumeTextSourceUrl === user.resumeUrl && user.resumeText) {
      parts.push(`Resume file contents: ${user.resumeText.slice(0, 2500)}`);
    } else {
      try {
        const pdfParse = require("pdf-parse");
        const res = await fetch(user.resumeUrl);
        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          const parsed = await pdfParse(buffer);
          const text = (parsed.text || "").replace(/\s+/g, " ").trim();
          if (text.length > 50) {
            user.resumeText = text.slice(0, 6000);
            user.resumeTextSourceUrl = user.resumeUrl;
            await user.save();
            parts.push(`Resume file contents: ${text.slice(0, 2500)}`);
          }
        }
      } catch (err) {
        console.warn("⚠️  Resume PDF parsing failed, continuing with profile fields only:", err.message);
      }
    }
  }

  return parts.join("\n\n");
};

/**
 * Generates a strict, resume-tailored interview: technicalCount technical
 * questions drawn from the candidate's actual skills/projects, followed by
 * hrCount behavioral/HR questions. Falls back to generic pools on failure.
 */
const generateResumeInterview = async (resumeContext, { technicalCount = 6, hrCount = 4 } = {}) => {
  try {
    if (!resumeContext || resumeContext.trim().length < 20) {
      throw new Error("Resume context is empty — cannot tailor questions");
    }

    const seed = Math.random().toString(36).slice(2, 8);

    const prompt = `You are a strict, senior technical interviewer conducting a resume-based interview. Carefully read the candidate's ENTIRE background below — projects, certifications, skills, and experience — and build a natural, varied interview that proves you read all of it, not just one part.

Candidate Background:
${resumeContext.slice(0, 6000)}

Session ID: ${seed}-${Date.now()}

First, mentally identify every DISTINCT project, certification, skill area, and experience phase mentioned above. Then generate exactly ${technicalCount} TECHNICAL questions, spreading them across as many of those distinct items as possible — do not ask more than ONE question about the same specific project, certification, or narrow topic unless the background genuinely contains nothing else to draw from. The interview should feel like it's jumping naturally across different parts of their background, the way a real interviewer skims a resume and picks varied points, not like it's drilling into a single section.

Guidelines for the ${technicalCount} technical questions:
- If multiple projects are listed, question DIFFERENT projects, not the same one twice
- If multiple certifications or skills are listed, spread questions across different ones
- Include at least one question about their experience/career progression if that context exists
- Vary question style: some about specific decisions, some about trade-offs, some "what would you do if X failed", some conceptual depth checks — avoid a repetitive pattern
- Every question must clearly connect to something the candidate actually wrote — never invent details they didn't mention
- If the background only has one project/topic to draw from, it's fine to ask more than one question about it — but still vary the angle each time

Then generate exactly ${hrCount} HR/behavioral questions appropriate for this candidate's apparent experience level and career stage, naturally referencing different moments in their journey (not all about the same thing either).

Output format — ONLY this structure, nothing else:
TECHNICAL:
1. <question>
2. <question>
...
HR:
1. <question>
2. <question>
...`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    const hrSplit = raw.split(/HR:/i);
    if (hrSplit.length < 2) throw new Error("Response missing HR section");

    const parseLines = (block) =>
      block.split("\n")
        .map((l) => l.replace(/^\d+[\.\)]\s*/, "").trim())
        .filter((l) => l.length > 10 && !/^technical:?$/i.test(l) && !l.startsWith("#"));

    const technical = parseLines(hrSplit[0].replace(/TECHNICAL:/i, ""));
    const hr = parseLines(hrSplit[1]);

    if (technical.length < technicalCount || hr.length < hrCount) {
      throw new Error(`Incomplete: got ${technical.length} technical, ${hr.length} HR`);
    }

    console.log(`✅ Gemini generated resume-based interview: ${technical.length} technical + ${hr.length} HR questions`);
    return {
      technical: shuffle(technical).slice(0, technicalCount),
      hr: shuffle(hr).slice(0, hrCount),
      source: "ai",
    };
  } catch (error) {
    console.error("⚠️  Resume interview generation failed, using shuffled fallback:", error.message);
    const technical = shuffle(FALLBACK_POOL.fullstack).slice(0, technicalCount);
    const hr = shuffle(FALLBACK_POOL.hr).slice(0, hrCount);
    return { technical, hr, source: "fallback" };
  }
};

module.exports = { buildResumeContext, generateResumeInterview };