import type { z } from "zod";
import { withRetry } from "@/lib/server/retry";

// Structured chat completions through OpenRouter. The simulator
// (turn + debrief) uses the free Gemma 4 31B chat model; the 03
// check-a-message tools use the free Liquid LFM model via shield.ts.
// OpenRouter speaks the OpenAI chat-completions shape, so no new
// dependency is needed — plain fetch with response_format json_object,
// then Zod validation of the parsed object.

export const SIM_MODEL =
  process.env.SIM_MODEL || "google/gemma-4-31b-it:free";

function getKey() {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");
  return process.env.OPENROUTER_API_KEY;
}

function schemaHint(schema: z.ZodTypeAny): string {
  // Give the model a compact shape reminder; Zod remains the enforcer.
  try {
    const def = (schema as { _def?: unknown })._def as {
      typeName?: string;
      shape?: () => Record<string, z.ZodTypeAny>;
      options?: z.ZodTypeAny[];
      element?: z.ZodTypeAny;
    } | undefined;
    return JSON.stringify(describe(def)).slice(0, 2000);
  } catch {
    return "";
  }
}

function describe(def: unknown): unknown {
  if (!def || typeof def !== "object") return "value";
  const d = def as {
    typeName?: string;
    shape?: () => Record<string, unknown>;
    options?: unknown[];
    element?: unknown;
    values?: unknown[];
  };
  if (d.typeName === "ZodObject" && d.shape) {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(d.shape())) out[key] = describe((value as { _def?: unknown })._def);
    return out;
  }
  if (d.typeName === "ZodArray" && d.element) return [describe((d.element as { _def?: unknown })._def)];
  if (d.typeName === "ZodEnum" && d.values) return d.values;
  if (d.typeName === "ZodNullable" && d.options) return describe((d.options[0] as { _def?: unknown })?._def);
  if (d.typeName === "ZodOptional" && d.options) return describe((d.options[0] as { _def?: unknown })?._def);
  if (d.typeName === "ZodDefault") return "value";
  return "value";
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
    const hint = schemaHint(schema);
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getKey()}`,
        "Content-Type": "application/json",
        "X-Title": "ScamGym Simulator",
      },
      body: JSON.stringify({
        model: SIM_MODEL,
        messages: [
          {
            role: "system",
            content: `${instructions}\nReply with ONLY a JSON object matching this shape (key "${name}"): ${hint}`,
          },
          { role: "user", content: input },
        ],
        max_tokens: 900,
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
      signal,
    });
    if (response.status === 401 || response.status === 403) {
      throw new Error("The simulator key is not working (auth).");
    }
    if (response.status === 402 || response.status === 429) {
      const retry = new Error("The simulator model is busy or rate-limited; retry shortly.");
      (retry as Error & { retry?: boolean }).retry = true;
      throw retry;
    }
    if (!response.ok) throw new Error(`Simulator model error ${response.status}`);
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content?.trim() || "";
    if (!raw) throw new Error("Simulator model returned an empty reply");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Some models wrap JSON in fences or prose; salvage the object span.
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start < 0 || end <= start) throw new Error("Simulator model returned non-JSON");
      parsed = JSON.parse(raw.slice(start, end + 1));
    }
    return schema.parse(parsed);
  });
}
