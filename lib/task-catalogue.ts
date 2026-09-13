import type { TaskBrief } from "./task-brief.ts";

const practice = [
  ["budget-analysis", "Build a student society budget", "A fictional society has PKR 45,000. Venue costs 12,000, printing 3,500, equipment 4,000 and refreshments 450 per guest. Compare events for 40 and 60 guests. Show total cost, surplus or shortfall and two realistic changes. Explain your assumptions.", "A calculation table, your workings and a short recommendation."],
  ["survey-methods", "Design a campus transport survey", "A fictional campus wants to understand commuting delays. Design six neutral survey questions, describe who you would sample, identify two sources of bias and explain how consent and anonymous responses would work. Do not collect real personal data.", "Six survey questions, sampling notes and a privacy paragraph."],
  ["sales-statistics", "Explain a small sales dataset", "A fictional shop sold 12, 18, 18, 22, 25, 15 and 30 units over seven days. Calculate mean, median, mode and range. Explain whether the mean alone describes this week well and describe one limitation of the sample.", "Your calculation steps and a plain English interpretation."],
  ["project-plan", "Plan a community book exchange", "Plan a fictional book exchange with a PKR 20,000 budget and four volunteers. It opens in two weeks. Define scope, a dated milestone list, responsibilities and three risks with practical responses. Do not contact real suppliers or make purchases.", "A milestone table, budget allocation and a risk register."],
  ["business-comparison", "Compare two delivery proposals", "A fictional seller ships 80 parcels each month. Proposal A charges PKR 180 per parcel. Proposal B charges PKR 5,000 per month plus PKR 110 per parcel. Compare monthly cost, calculate the break-even volume and explain one non-price factor to investigate.", "Cost calculations, break-even workings and your recommendation."],
  ["research-literacy", "Evaluate the strength of a claim", "A fictional advert says: 9 out of 10 users became more productive. Its survey included 20 volunteers from the seller’s own newsletter, with no control group. Explain sampling bias, what the statement does not establish and how a better study could be designed.", "A reasoned critique and a revised study outline, not invented research results."],
  ["database-design", "Design a small library database", "A fictional library needs to track books, members and loans. Propose tables and keys, explain how repeat loans would work and give three example queries in plain English or SQL. Use invented records only and never include real student information.", "A table diagram or schema and explanations of three queries."],
  ["environment-plan", "Compare practical waste reduction ideas", "A fictional office discards 60 disposable cups each workday and operates 22 days per month. Compare reusable mugs and a bring-your-own-cup policy. Calculate monthly disposable use, describe costs that need checking and suggest a four-week measurement plan.", "A baseline calculation, balanced comparison and measurement plan."],
] as const;

const writing = [
  ["desk-organiser", "Write a product description for a desk organiser", "Fictional product: a bamboo desktop organiser, 24 × 12 × 10 cm, three compartments, supplied assembled, wipe-clean surface, indoor use. Write a useful description without inventing certifications, warranties, stock levels or customer reviews."],
  ["welcome-email", "Write a clear welcome email", "Write an onboarding email for a fictional learning platform called Study Corner. Members can choose a topic, save a lesson and update email preferences. There is no certificate, job guarantee or paid upgrade in this brief. Include a subject line and one clear next step."],
  ["help-article", "Explain how to submit a payment receipt", "Write a help article for Assignwork. The member chooses a plan, uses the Easypaisa Bank QR, submits the transaction ID and a PNG/JPG/WebP receipt up to 5 MB. Review aims to take six hours. Only admin approval activates access. Explain what to do if review is overdue, without telling people to pay twice."],
  ["task-checklist", "Write a practical task submission checklist", "Write an Assignwork guide covering reading the brief, checking the deadline, answering all questions, verifying facts, saving proof and submitting once. Explain the difference between submitted and approved. Do not promise guaranteed earnings."],
  ["plain-language", "Rewrite a complicated service notice", "Rewrite this fictional notice in clear language: Owing to scheduled maintenance of our internal systems, account preference alterations will be temporarily unavailable between 02:00 and 03:00 PKT on Sunday. Existing saved preferences remain unaffected. Include a headline, short explanation and helpful FAQ. Do not invent contact details."],
  ["content-calendar", "Create a short content calendar", "Prepare a five-post calendar for a fictional independent stationery shop. Its audience is remote workers. Products are notebooks, pens and desk organisers. Include topic, format, a sample caption and the reader benefit for each post. No invented discounts or testimonials."],
  ["faq-draft", "Write FAQs for a fictional book club", "A fictional online book club meets on the first Saturday each month for 60 minutes. Members select next month’s book by a poll. Cameras are optional, meetings are not recorded and members obtain books themselves. Write six FAQs from these facts. Flag unknown information instead of making it up."],
  ["editorial-check", "Improve a short business announcement", "Rewrite this fictional draft and explain the edits: Our new notebook is literally the best notebook in the whole world and everybody loves it. It has 160 ruled pages, a recycled-paper cover and A5 dimensions. Remove unsupported claims, preserve the stated facts and provide a product paragraph plus a concise editorial note."],
] as const;

export type CatalogueTask = { slug: string; title: string; summary: string; category: string; brief: TaskBrief };
export const taskCatalogue: CatalogueTask[] = [
  ...practice.map(([slug, title, material, output]) => ({
    slug: `practice-${slug}`, title, category: "Practice assignments",
    summary: "An original university-level practice exercise. Show your reasoning and submit your own work.",
    brief: {
      version: 1 as const, kind: "practice" as const, sourceMaterial: material,
      steps: [
        { title: "Read the exercise", body: "Use only the fictional scenario below. This is an Assignwork practice exercise, not assessed coursework for a university student." },
        { title: "Work through the problem", body: "Write down assumptions and show your reasoning. For calculations, include units and intermediate steps." },
        { title: "Prepare your answer", body: output },
        { title: "Check and submit", body: "Check your numbers and attach a screenshot or document showing your workings. Paste your explanation into the submission form." },
      ],
      requirements: [output, "An image or document showing your original workings.", "No real student details, copied submissions or work intended for academic credit."],
      minWords: 150, maxWords: 700, proofRequired: true, sourceCount: 0,
      aiPolicy: "You may use AI to understand a concept. Do your own reasoning and disclose any assistance in your submission.", rewardUsdCents: 200, videoUrl: null,
    },
  })),
  ...writing.map(([slug, title, material]) => ({
    slug: `writing-${slug}`, title, category: "Writing",
    summary: "Write a useful, original piece from a complete brief. AI assistance is allowed when disclosed and checked.",
    brief: {
      version: 1 as const, kind: "writing" as const, sourceMaterial: material,
      steps: [
        { title: "Understand the reader", body: "Read the supplied facts and decide what the reader needs to know first." },
        { title: "Draft the content", body: "Use your own wording. AI can help with an outline or draft, but check every fact and remove generic filler." },
        { title: "Edit for accuracy", body: "Check spelling, structure and every product or service claim. If you consult outside sources, add their URLs. Do not paste Google results or another author’s article." },
        { title: "Submit the finished piece", body: "Paste the complete content below. Add source links where used and describe any AI assistance. A document attachment is optional." },
      ],
      requirements: ["200 to 600 words, including any requested notes or subject lines.", "All requested sections and only supported facts.", "Original wording with sources and AI assistance disclosed."],
      minWords: 200, maxWords: 600, proofRequired: false, sourceCount: 0,
      aiPolicy: "AI-assisted writing is allowed. Verify and edit the result, disclose the tool used, and do not submit copied text.", rewardUsdCents: 150, videoUrl: null,
    },
  })),
  ...["Message clarity", "Product recall", "Accessibility feedback"].map((topic, i) => ({
    slug: `ad-feedback-${i + 1}`, title: `Watch a sponsored video: ${topic.toLowerCase()}`, category: "Ad feedback",
    summary: "Authorised paid viewing and honest feedback. Awaiting an approved video and reward before publication.",
    brief: {
      version: 1 as const, kind: "ad-feedback" as const,
      sourceMaterial: `Campaign focus: ${topic}. An admin must attach an advertiser-approved video and confirm that paid viewing is permitted. No video or advertiser has been supplied yet.`,
      steps: [
        { title: "Check the campaign", body: "Read the approved campaign and viewing requirements. Do not start until the reward and video are published." },
        { title: "Watch the supplied video", body: "Watch normally once. Do not click external ads, repeatedly refresh, use bots, create accounts or purchase anything." },
        { title: "Give honest feedback", body: "Summarise the message, mention two concrete moments and explain what could be clearer. You are paid for the completed feedback, not a positive opinion." },
        { title: "Attach viewing evidence", body: "Attach the requested completion screenshot without unrelated personal information, then submit your feedback." },
      ],
      requirements: ["80 to 250 words of specific, honest feedback.", "A completion screenshot matching the approved video.", "No fake engagement, incentivised public reviews or ad clicks."],
      minWords: 80, maxWords: 250, proofRequired: true, sourceCount: 0,
      aiPolicy: "Feedback must reflect your own viewing. AI can help correct spelling, but must not invent observations.", rewardUsdCents: 0, videoUrl: null,
    },
  })),
];
