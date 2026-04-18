import { anthropic } from "@workspace/integrations-anthropic-ai";
import { Router } from "express";

const router = Router();

async function streamResponse(
  res: import("express").Response,
  system: string,
  userContent: string,
  model: string
) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const chosenModel = model === "deepthink" ? "claude-opus-4-6" : "claude-sonnet-4-6";

  const stream = anthropic.messages.stream({
    model: chosenModel,
    max_tokens: 8192,
    system,
    messages: [{ role: "user", content: userContent }],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
    }
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
}

router.post("/ai/pray", async (req, res) => {
  const { situation, model = "standard" } = req.body as {
    situation: string;
    model?: string;
  };

  const system = `You are a devout Catholic spiritual director with deep knowledge of Catholic prayer traditions, the Saints, and Scripture. Write heartfelt, theologically sound Catholic prayers that are personal, specific to the user's situation, and rooted in Catholic spirituality.

Guidelines:
- Write a full prayer (4-8 sentences) in first person
- Reference Mary, Saints, or Scripture when appropriate
- Include specific elements from the user's situation
- Use traditional Catholic prayer style but accessible language
- End with "Through Christ our Lord, Amen" or similar
- Be genuinely moving and personal`;

  await streamResponse(res, system, `Please write a Catholic prayer for this situation: ${situation}`, model);
});

router.post("/ai/generate-topic", async (req, res) => {
  const { objection, model = "standard" } = req.body as {
    objection: string;
    model?: string;
  };

  const system = `You are an expert Catholic apologist creating comprehensive study pages for the Daily Defense app. When given an objection, create a full, well-structured apologetics resource.

Format your response as a JSON object with exactly this structure:
{
  "title": "Short title for the objection",
  "summary": "2-3 sentence overview of the Catholic response",
  "scripturePassages": [
    {"reference": "Book Chapter:Verse", "text": "The verse text", "explanation": "How this applies to the objection"}
  ],
  "mainArguments": [
    {"title": "Argument title", "content": "Full argument in 3-5 sentences"}
  ],
  "churchFathersQuotes": [
    {"father": "Church Father name", "work": "Title of work", "quote": "Direct quote"}
  ],
  "practicalTips": ["Tip 1", "Tip 2"],
  "commonMistakes": ["Mistake to avoid 1", "Mistake to avoid 2"]
}

Include 3 scripture passages, 4 main arguments, and 2 Church Fathers quotes. Be thorough and academically sound.`;

  await streamResponse(res, system, `Create a full apologetics study page for this objection: "${objection}"`, model);
});

router.post("/ai/review-session", async (req, res) => {
  const { transcript, opponentType, difficulty, model = "standard" } = req.body as {
    transcript: string;
    opponentType: string;
    difficulty: string;
    model?: string;
  };

  const system = `You are an expert Catholic apologetics coach reviewing a practice debate session. Analyze the student's performance and provide constructive, encouraging feedback.

Your review should include:
1. Overall assessment (1-2 sentences)
2. Strengths (2-3 specific things done well)
3. Areas for improvement (2-3 specific areas with suggestions)
4. Key arguments missed or not used effectively
5. Recommended next steps for study
6. Overall score out of 10 with brief justification

Be encouraging but honest. Reference specific moments from the transcript. The student was debating a ${opponentType} at ${difficulty} difficulty.`;

  await streamResponse(res, system, `Please review this apologetics practice session transcript:\n\n${transcript}`, model);
});

export default router;
