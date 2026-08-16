import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("keeps the Salpeobom multi-listing analysis flow wired", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  assert.match(page, /const \[listings, setListings\]/);
  assert.match(page, /listing\.files\.forEach/);
  assert.match(page, /payload\.result/);
  assert.match(page, /setAnalyses\(next\)/);
});

test("calculates gaps and seller questions from returned evidence", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  assert.match(page, /evidence\.filter/);
  assert.match(page, /defaultQuestions/);
  assert.match(page, /navigator\.clipboard\.writeText/);
});

test("validates analysis uploads on the server", async () => {
  const route = await readFile(new URL("app/api/analyze/route.ts", root), "utf8");
  assert.match(route, /MAX_IMAGE_BYTES/);
  assert.match(route, /SUPPORTED_IMAGE_TYPES/);
  assert.match(route, /판매글 설명 또는 이미지가 필요합니다/);
});

test("stops analysis when the vision result conflicts with the selected category", async () => {
  const route = await readFile(new URL("app/api/analyze/route.ts", root), "utf8");
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  assert.match(route, /listing_verification/);
  assert.match(route, /아이폰 12, 아이폰 14, 갤럭시 모두 반드시 match/);
  assert.match(route, /invalidListing: true/);
  assert.match(route, /hasVerificationStatus/);
  assert.match(route, /verification\?\.status === "mismatch"/);
  assert.match(page, /payload\.invalidListing/);
  assert.match(page, /listing\.description === defaultDescription/);
});
