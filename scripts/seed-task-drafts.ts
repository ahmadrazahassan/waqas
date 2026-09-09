import { createClient } from "@supabase/supabase-js";
import { taskCatalogue } from "../lib/task-catalogue.ts";

// Explicit draft-only operation. Never publishes work, changes existing briefs,
// invents an exchange rate or creates a member/payment/claim.
if (!process.argv.includes("--drafts")) throw new Error("Pass --drafts to add unpublished task drafts.");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase server configuration is required.");
const client = createClient(url, key, { auth: { persistSession: false } });
const { error: catError } = await client.from("task_categories").upsert({ name: "Practice assignments", slug: "practice-assignments", summary: "Original learning exercises using fictional scenarios, not assessed student coursework.", sort_order: 7, is_active: true }, { onConflict: "slug", ignoreDuplicates: true });
if (catError) throw new Error(catError.message);
const { data: categories, error } = await client.from("task_categories").select("id, name");
if (error) throw new Error(error.message);
const drafts = taskCatalogue.filter(t => t.brief.rewardUsdCents > 0).map(t => ({
  slug: t.slug, title: t.title, summary: t.summary, brief: JSON.stringify(t.brief),
  category_id: categories.find(c=>c.name===t.category)?.id,
  status: "draft", currency: "USD", payout_minor: t.brief.rewardUsdCents,
  min_rank_id: 1, due_hours: 24, max_claims: 1, compliance_flag: t.brief.kind === "practice" ? "tutoring" : "standard",
  deliverable_type: t.brief.proofRequired ? "document" : "text", word_count_target: t.brief.minWords,
}));
if (drafts.some(t=>!t.category_id)) throw new Error("A task category is missing.");
const { data, error: insertError } = await client.from("tasks").upsert(drafts, { onConflict: "slug", ignoreDuplicates: true }).select("slug,status,currency,payout_minor");
if (insertError) throw new Error(insertError.message);
console.log(JSON.stringify({ added: data?.length ?? 0, state: "draft", tasks: data, adTemplates: "3 local templates remain unpublished without videos/rewards" }, null, 2));
