import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BIRDS_PACK,
  HALLOWEEN_PACK,
  STICKER_PACKS,
  isPackReleased,
  packDropTime,
  releasedStickerPacks,
} from "./stickers.ts";

const DROP = Date.parse("2026-10-26T13:00:00Z");

describe("sticker pack drops", () => {
  it("halloween drops Mon Oct 26 2026 8:00 AM Chicago (13:00 UTC)", () => {
    assert.equal(packDropTime(HALLOWEEN_PACK), DROP);
    assert.equal(isPackReleased(HALLOWEEN_PACK, DROP - 1), false);
    assert.equal(isPackReleased(HALLOWEEN_PACK, DROP), true);
  });

  it("is an absolute instant: same answer in every timezone", () => {
    // 2026-10-26 07:59 in Chicago is already the 26th in Tokyo/London — still hidden.
    assert.equal(isPackReleased(HALLOWEEN_PACK, Date.parse("2026-10-26T07:59:00-05:00")), false);
    assert.equal(isPackReleased(HALLOWEEN_PACK, Date.parse("2026-10-26T21:59:00+09:00")), false);
    assert.equal(isPackReleased(HALLOWEEN_PACK, Date.parse("2026-10-26T22:00:00+09:00")), true);
  });

  it("date-only drops flip at 00:00 UTC; no date = always on", () => {
    assert.equal(packDropTime({ dropDate: "2026-10-21" }), Date.parse("2026-10-21T00:00:00Z"));
    assert.equal(isPackReleased({}), true);
  });

  it("zone-less date-times never release (would be timezone-dependent)", () => {
    assert.equal(isPackReleased({ dropDate: "2026-10-26T08:00:00" }, Date.parse("2030-01-01T00:00:00Z")), false);
    assert.equal(isPackReleased({ dropDate: "nonsense" }, Date.parse("2030-01-01T00:00:00Z")), false);
  });

  it("tray list hides halloween before the drop and keeps order after", () => {
    assert.ok(!releasedStickerPacks(DROP - 60_000).some((p) => p.id === "halloween"));
    const after = releasedStickerPacks(DROP).map((p) => p.id);
    assert.deepEqual(after.slice(-3), ["gulf-coast", "cozy-fall", "halloween"]);
    assert.ok(!after.includes("birds"));
  });

  it("halloween has 20 paid stickers with assets", () => {
    assert.equal(HALLOWEEN_PACK.free, false);
    assert.equal(HALLOWEEN_PACK.stickers.length, 20);
    for (const s of HALLOWEEN_PACK.stickers) assert.match(s.src ?? "", /^\/stickers\/halloween\/[a-z-]+\.webp$/);
  });

  const BIRDS_DROP = Date.parse("2026-11-02T14:00:00Z");

  it("birds drops Mon Nov 2 2026 8:00 AM Chicago (CST, 14:00 UTC)", () => {
    assert.equal(packDropTime(BIRDS_PACK), BIRDS_DROP);
    assert.equal(packDropTime(BIRDS_PACK), Date.parse("2026-11-02T08:00:00-06:00"));
    assert.equal(isPackReleased(BIRDS_PACK, BIRDS_DROP - 1), false);
    assert.equal(isPackReleased(BIRDS_PACK, BIRDS_DROP), true);
  });

  it("tray hides birds before its drop and lists it last after", () => {
    assert.ok(!releasedStickerPacks(BIRDS_DROP - 60_000).some((p) => p.id === "birds"));
    const after = releasedStickerPacks(BIRDS_DROP).map((p) => p.id);
    assert.deepEqual(after.slice(-4), ["gulf-coast", "cozy-fall", "halloween", "birds"]);
    assert.equal(STICKER_PACKS.length, after.length);
  });

  it("birds has 20 paid stickers with assets", () => {
    assert.equal(BIRDS_PACK.free, false);
    assert.equal(BIRDS_PACK.stickers.length, 20);
    assert.equal(new Set(BIRDS_PACK.stickers.map((s) => s.id)).size, 20);
    for (const s of BIRDS_PACK.stickers) assert.match(s.src ?? "", /^\/stickers\/birds\/[a-z-]+\.webp$/);
  });
});
