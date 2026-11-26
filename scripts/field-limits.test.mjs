/**
 * Scrap form caps: details (how) is 500; title stays 80; the note stays 140.
 *   node --test scripts/field-limits.test.mjs
 */
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";

const form = readFileSync(join(process.cwd(), "src/components/keep-form.tsx"), "utf8");

function fieldBlock(id) {
  const marker = `id="${id}"`;
  const start = form.indexOf(marker);
  assert.notEqual(start, -1, `missing #${id}`);
  return form.slice(start, start + 500);
}

describe("keep form field caps", () => {
  it("details uses HOW_MAX and is no longer capped at 200", () => {
    const how = fieldBlock("how");
    assert.match(how, /name="how"/);
    assert.match(how, /maxLength=\{HOW_MAX\}/);
    assert.match(form, /\{how\.length\} \/ \{HOW_MAX\}/);
    assert.doesNotMatch(form, /maxLength=\{200\}/);
    assert.doesNotMatch(form, /maxLength=\{500\}/);
  });

  it("title stays at TITLE_MAX and the note stays at NOTE_MAX", () => {
    assert.match(fieldBlock("title"), /maxLength=\{TITLE_MAX\}/);
    assert.match(fieldBlock("note"), /maxLength=\{NOTE_MAX\}/);
    assert.match(form, /TITLE_MAX/);
    assert.match(form, /NOTE_MAX/);
    assert.match(form, /HOW_MAX/);
  });
});
