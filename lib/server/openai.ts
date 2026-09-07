import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod";
import { withRetry } from "@/lib/server/retry";

let client: OpenAI | undefined;

function getClient() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export async function structuredResponse<T extends z.ZodTypeAny>({
  name,
  schema,
  instructions,
  input,
}: {
  name: string;
  schema: T;
  instructions: string;
  input: string;
}): Promise<z.infer<T>> {
  return withRetry(async (signal) => {
    const response = await getClient().responses.parse(
      {
        model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
        instructions,
        input,
        reasoning: { effort: "low" },
        text: { format: zodTextFormat(schema, name) },
        store: false,
      },
      { signal },
    );
    if (!response.output_parsed) throw new Error("OpenAI returned no structured output");
    return schema.parse(response.output_parsed);
  });
}
