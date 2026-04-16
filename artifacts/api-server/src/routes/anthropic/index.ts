import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { SendAnthropicMessageBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import { Router } from "express";

const router = Router();

router.get("/anthropic/conversations", async (req, res) => {
  const convos = await db
    .select()
    .from(conversations)
    .orderBy(conversations.createdAt);
  res.json(convos);
});

router.post("/anthropic/conversations", async (req, res) => {
  const { title } = req.body as { title: string };
  const [conversation] = await db
    .insert(conversations)
    .values({ title })
    .returning();
  res.status(201).json(conversation);
});

router.get("/anthropic/conversations/:id", async (req, res) => {
  const id = parseInt(req.params["id"]!, 10);
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id));

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(messages.createdAt);

  res.json({ ...conversation, messages: msgs });
});

router.delete("/anthropic/conversations/:id", async (req, res) => {
  const id = parseInt(req.params["id"]!, 10);
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id));

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  await db.delete(messages).where(eq(messages.conversationId, id));
  await db.delete(conversations).where(eq(conversations.id, id));

  res.status(204).send();
});

router.get("/anthropic/conversations/:id/messages", async (req, res) => {
  const id = parseInt(req.params["id"]!, 10);
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(messages.createdAt);
  res.json(msgs);
});

router.post("/anthropic/conversations/:id/messages", async (req, res) => {
  const id = parseInt(req.params["id"]!, 10);
  const parsed = SendAnthropicMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { content } = parsed.data;

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id));

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  await db.insert(messages).values({
    conversationId: id,
    role: "user",
    content,
  });

  const allMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(messages.createdAt);

  const chatMessages = allMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: `You are an expert Catholic apologist with deep knowledge of Scripture, Church Fathers, Tradition, and Catholic theology. Your role in the Daily Defense app is to provide clear, charitable, and well-reasoned responses to common objections against the Catholic faith.

When responding:
- Be charitable and respectful toward those with objections
- Use Scripture, Tradition, Church Fathers, and reason
- Be concise but thorough (aim for 200-400 words)
- Acknowledge what is valid in the objection before answering
- Cite specific Scripture passages and theological sources when relevant
- Use language accessible to everyday Catholics who want to defend their faith
- Format your response clearly with logical flow`,
    messages: chatMessages,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      fullResponse += event.delta.text;
      res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
    }
  }

  await db.insert(messages).values({
    conversationId: id,
    role: "assistant",
    content: fullResponse,
  });

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export default router;
