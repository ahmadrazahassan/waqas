import { z } from "zod";

export const taskBriefSchema = z.object({
  version: z.literal(1),
  kind: z.enum(["practice", "writing", "ad-feedback"]),
  sourceMaterial: z.string().min(20),
  steps: z.array(z.object({ title: z.string(), body: z.string() })).min(3),
  requirements: z.array(z.string()).min(2),
  minWords: z.number().int().min(20),
  maxWords: z.number().int().max(5000),
  proofRequired: z.boolean(),
  sourceCount: z.number().int().min(0).max(5),
  aiPolicy: z.string(),
  rewardUsdCents: z.number().int().nonnegative(),
  videoUrl: z.url().refine(v => v.startsWith("https://")).nullable(),
});
export type TaskBrief = z.infer<typeof taskBriefSchema>;

export function parseTaskBrief(brief: string): TaskBrief | null {
  try { const parsed = taskBriefSchema.safeParse(JSON.parse(brief)); return parsed.success ? parsed.data : null; }
  catch { return null; }
}
export function wordCount(text: string) { return text.trim().split(/\s+/u).filter(Boolean).length; }
export function validateTaskWork(brief: TaskBrief | null, body: string, proofCount: number, sources: string[]) {
  if (!brief) return null;
  const words = wordCount(body);
  if (words < brief.minWords || words > brief.maxWords) return `Write between ${brief.minWords} and ${brief.maxWords} words. You have ${words}.`;
  if (brief.proofRequired && proofCount < 1) return "Attach the proof requested in this task’s submission requirements.";
  if (sources.length < brief.sourceCount) return `Add at least ${brief.sourceCount} source links.`;
  return null;
}
