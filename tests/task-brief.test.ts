import test from "node:test";
import assert from "node:assert/strict";
import { taskCatalogue } from "../lib/task-catalogue.ts";
import { parseTaskBrief, validateTaskWork, wordCount } from "../lib/task-brief.ts";

test("19 distinct complete task briefs with the requested proposed rewards", () => {
  assert.equal(taskCatalogue.length,19);
  assert.equal(new Set(taskCatalogue.map(t=>t.slug)).size,19);
  for (const task of taskCatalogue) {
    assert.ok(parseTaskBrief(JSON.stringify(task.brief)), task.slug);
    assert.equal(task.brief.rewardUsdCents,task.brief.kind === "practice" ? 200 : task.brief.kind === "writing" ? 150 : 0);
    assert.ok(task.brief.steps.length >= 4);
  }
});
test("plain existing task briefs remain supported", () => {
  assert.equal(parseTaskBrief("Write an original product description."),null);
  assert.equal(parseTaskBrief('{"version":1}'),null);
});
test("practice submission enforces word count and proof", () => {
  const guide=taskCatalogue[0]!.brief;
  assert.match(validateTaskWork(guide,"Too short",0,[])!,/between/);
  assert.match(validateTaskWork(guide,"word ".repeat(150),0,[])!,/proof/);
  assert.equal(validateTaskWork(guide,"word ".repeat(150),1,[]),null);
  assert.match(validateTaskWork(guide,"word ".repeat(701),1,[])!,/between/);
});
test("writing supports text submission; required source links are counted", () => {
  const guide=taskCatalogue.find(t=>t.brief.kind === "writing")!.brief;
  assert.equal(validateTaskWork(guide,"word ".repeat(200),0,[]),null);
  assert.match(validateTaskWork({...guide,sourceCount:2},"word ".repeat(200),0,[])!,/2 source/);
  assert.equal(wordCount("  hello\nworld  "),2);
});
