import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyReadingToDocument,
  normalizeBoldText,
  normalizeTextSize,
  READING_BOOT,
  stepTextSize,
  TEXT_SIZE_META,
  TEXT_SIZES,
} from "./reading.ts";

function fakeRoot() {
  return { dataset: {} as Record<string, string | undefined> };
}

function runBoot(state: unknown) {
  const d = fakeRoot();
  new Function("d", "s", READING_BOOT)(d, state ?? {});
  return d.dataset;
}

describe("reading comfort", () => {
  it("has four steps with the agreed scales", () => {
    assert.deepEqual([...TEXT_SIZES], ["small", "normal", "large", "xlarge"]);
    assert.deepEqual(
      TEXT_SIZES.map((id) => TEXT_SIZE_META[id].scale),
      [0.9, 1, 1.15, 1.3],
    );
  });

  it("normalizes unknown / legacy values to normal + not bold", () => {
    assert.equal(normalizeTextSize(undefined), "normal");
    assert.equal(normalizeTextSize("huge"), "normal");
    assert.equal(normalizeTextSize("xlarge"), "xlarge");
    assert.equal(normalizeBoldText("yes"), false);
    assert.equal(normalizeBoldText(true), true);
  });

  it("steps clamp at both ends", () => {
    assert.equal(stepTextSize("small", -1), "small");
    assert.equal(stepTextSize("small", 1), "normal");
    assert.equal(stepTextSize("xlarge", 1), "xlarge");
    assert.equal(stepTextSize("large", 1), "xlarge");
  });

  it("applies data-text-size / data-bold to the root", () => {
    const root = fakeRoot();
    applyReadingToDocument("large", true, root);
    assert.equal(root.dataset.textSize, "large");
    assert.equal(root.dataset.bold, "1");
    applyReadingToDocument("normal", false, root);
    assert.equal(root.dataset.textSize, "normal");
    assert.equal("bold" in root.dataset, false);
  });

  it("boot fragment mirrors the store (no flash on load)", () => {
    assert.deepEqual(runBoot({ textSize: "xlarge", boldText: true }), { textSize: "xlarge", bold: "1" });
    assert.deepEqual(runBoot({}), { textSize: "normal" });
    assert.deepEqual(runBoot({ textSize: "nope", boldText: "1" }), { textSize: "normal" });
  });
});
