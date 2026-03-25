import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn(
    "GEMINI_API_KEY is not set. AI summaries will not work until it is configured."
  );
}

let client;

function getClient() {
  if (!client) {
    client = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return client;
}

export async function generateMeetingSummary(transcriptText) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
You are an AI meeting assistant.

Summarize the following meeting transcript.

Return JSON with this exact structure:
{
  "key_points": [ "point 1", "point 2", ... ],
  "decisions": [ "decision 1", "decision 2", ... ],
  "action_items": [ "item 1", "item 2", ... ],
  "next_steps": [ "step 1", "step 2", ... ]
}

MEETING TRANSCRIPT:
${transcriptText}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed;
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (err) {
    // Fallback: wrap plain text as a single key_point
    parsed = {
      key_points: [text],
      decisions: [],
      action_items: [],
      next_steps: [],
    };
  }

  return parsed;
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
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
You are an AI meeting assistant.

Extract action items from this meeting transcript.

For each action item, identify:
- Task: what needs to be done (short, clear)
- Assigned Person: who is responsible (name or "Unassigned" if not mentioned)
- Deadline: when it is due (date or description, or "Not specified" if not mentioned)

Return JSON with this exact structure:
{
  "action_items": [
    { "task": "...", "assigned_to": "...", "deadline": "..." },
    ...
  ]
}

If no action items are found, return: { "action_items": [] }

MEETING TRANSCRIPT:
${transcriptText}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (err) {
    parsed = { action_items: [] };
  }

  const items = Array.isArray(parsed.action_items) ? parsed.action_items : [];
  return items.map((item) => ({
    task: String(item.task || '').trim() || 'Task',
    assigned_to: String(item.assigned_to || '').trim() || 'Unassigned',
    deadline: String(item.deadline || '').trim() || 'Not specified',
  }));
}

