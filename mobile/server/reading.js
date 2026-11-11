import { experiences } from "../src/content.js";
import { lensInstructions, moderationText, parseReading, schema } from "./lens.js";

export async function generateReading({ client, input, mode, model }) {
  const options = { signal: AbortSignal.timeout(19500) };
  const inputCheck = await client.moderations.create({ model: "omni-moderation-latest", input }, options);
  if (inputCheck.results[0].flagged) return { status: 422, error: "This question is outside the app’s reflection scope. If anyone is in immediate danger, contact local emergency services." };

  const completion = await client.chat.completions.create({
    model,
    max_completion_tokens: 1050,
    messages: [
      { role: "system", content: lensInstructions },
      { role: "user", content: JSON.stringify({ experience: experiences[mode].name, account: input }) },
    ],
    response_format: { type: "json_schema", json_schema: { name: "eidomancer_reading", strict: true, schema } },
  }, options);

  const usage = completion.usage;
  const reading = parseReading(completion.choices?.[0]?.message?.content, input);
  if (!reading) return { status: 502, usage, error: "The reading service couldn’t ground this reading in your account. Try rephrasing." };

  const outputCheck = await client.moderations.create({
    model: "omni-moderation-latest", input: moderationText(reading),
  }, options);
  if (outputCheck.results[0].flagged) return { status: 422, usage, error: "We couldn’t provide a reading for this question. Try rephrasing it." };

  return { reading, usage };
}
