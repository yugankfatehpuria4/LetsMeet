import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash";

if (!GEMINI_API_KEY) {
  console.warn(
    "GEMINI_API_KEY is not set. AI summaries will not work until it is configured."
  );
}

let client;

function getClient() {
  if (!client) {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    client = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return client;
}

export async function generateMeetingSummary(transcriptText) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const prompt = `
You are an expert executive meeting assistant.

Summarize the following meeting transcript clearly into key bullet points and decisions.

Return JSON ONLY with this exact structure (do not include markdown code block formatting if possible):
{
  "key_points": [ "Key point 1", "Key point 2" ],
  "decisions": [ "Decision 1" ],
  "action_items": [ "Action item description" ],
  "next_steps": [ "Next step 1" ]
}

MEETING TRANSCRIPT:
${transcriptText}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsed;
    try {
      const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
    } catch (err) {
      parsed = {
        key_points: [text.trim()],
        decisions: [],
        action_items: [],
        next_steps: [],
      };
    }

    return parsed;
  } catch (err) {
    console.error("Gemini API generateMeetingSummary error:", err);
    throw err;
  }
}

/**
 * Extract structured action items from meeting transcript.
 * Returns array of { task, assigned_to, deadline }.
 */
export async function extractActionItems(transcriptText) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const prompt = `
You are an AI meeting assistant.

Extract action items from this meeting transcript.

For each action item, identify:
- Task: what needs to be done (short, clear, actionable)
- Assigned Person: who is responsible (name or "Unassigned" if not mentioned)
- Deadline: when it is due (date or description, or "Not specified" if not mentioned)

Return JSON with this exact structure:
{
  "action_items": [
    { "task": "...", "assigned_to": "...", "deadline": "..." }
  ]
}

If no action items are found, return: { "action_items": [] }

MEETING TRANSCRIPT:
${transcriptText}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsed;
    try {
      const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
    } catch (err) {
      parsed = { action_items: [] };
    }

    const items = Array.isArray(parsed.action_items) ? parsed.action_items : [];
    return items.map((item) => ({
      task: String(item.task || '').trim() || 'Task',
      assigned_to: String(item.assigned_to || '').trim() || 'Unassigned',
      deadline: String(item.deadline || '').trim() || 'Not specified',
    }));
  } catch (err) {
    console.error("Gemini API extractActionItems error:", err);
    return [];
  }
}
