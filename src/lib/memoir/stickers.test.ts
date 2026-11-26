import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BIRDS_PACK,
  FIRESIDE_NEST_PACK,
  FIRST_FROST_PACK,
  HALLOWEEN_PACK,
  LATE_AUTUMN_PACK,
  SNOW_DAY_PACK,
  STICKER_PACKS,
  THANKSGIVING_2_PACK,
  THANKSGIVING_PACK,
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
    assert.ok(!after.includes("late-autumn"));
  });

  it("birds has 20 paid stickers with assets", () => {
    assert.equal(BIRDS_PACK.free, false);
    assert.equal(BIRDS_PACK.stickers.length, 20);
    assert.equal(new Set(BIRDS_PACK.stickers.map((s) => s.id)).size, 20);
    for (const s of BIRDS_PACK.stickers) assert.match(s.src ?? "", /^\/stickers\/birds\/[a-z-]+\.webp$/);
  });

  const LATE_AUTUMN_DROP = Date.parse("2026-11-09T14:00:00Z");

  it("late autumn drops Mon Nov 9 2026 8:00 AM Chicago (CST, 14:00 UTC)", () => {
    assert.equal(packDropTime(LATE_AUTUMN_PACK), LATE_AUTUMN_DROP);
    assert.equal(packDropTime(LATE_AUTUMN_PACK), Date.parse("2026-11-09T08:00:00-06:00"));
    assert.equal(isPackReleased(LATE_AUTUMN_PACK, LATE_AUTUMN_DROP - 1), false);
    assert.equal(isPackReleased(LATE_AUTUMN_PACK, LATE_AUTUMN_DROP), true);
  });

  it("tray hides late autumn before its drop and lists it last after", () => {
    assert.ok(!releasedStickerPacks(LATE_AUTUMN_DROP - 60_000).some((p) => p.id === "late-autumn"));
    const after = releasedStickerPacks(LATE_AUTUMN_DROP).map((p) => p.id);
    assert.deepEqual(after.slice(-5), ["gulf-coast", "cozy-fall", "halloween", "birds", "late-autumn"]);
    assert.ok(!after.includes("thanksgiving"));
  });

  it("late autumn has 20 paid stickers with assets", () => {
    assert.equal(LATE_AUTUMN_PACK.free, false);
    assert.equal(LATE_AUTUMN_PACK.stickers.length, 20);
    assert.equal(new Set(LATE_AUTUMN_PACK.stickers.map((s) => s.id)).size, 20);
    for (const s of LATE_AUTUMN_PACK.stickers) {
      assert.match(s.src ?? "", /^\/stickers\/late-autumn\/[a-z-]+\.webp\?v=2$/);
    }
  });

  const THANKSGIVING_DROP = Date.parse("2026-11-16T14:00:00Z");

  it("thanksgiving drops Mon Nov 16 2026 8:00 AM Chicago (CST, 14:00 UTC)", () => {
    assert.equal(packDropTime(THANKSGIVING_PACK), THANKSGIVING_DROP);
    assert.equal(packDropTime(THANKSGIVING_PACK), Date.parse("2026-11-16T08:00:00-06:00"));
    assert.equal(isPackReleased(THANKSGIVING_PACK, THANKSGIVING_DROP - 1), false);
    assert.equal(isPackReleased(THANKSGIVING_PACK, THANKSGIVING_DROP), true);
  });

  it("tray hides thanksgiving before its drop and lists it last after", () => {
    assert.ok(!releasedStickerPacks(THANKSGIVING_DROP - 60_000).some((p) => p.id === "thanksgiving"));
    const after = releasedStickerPacks(THANKSGIVING_DROP).map((p) => p.id);
    assert.deepEqual(after.slice(-6), ["gulf-coast", "cozy-fall", "halloween", "birds", "late-autumn", "thanksgiving"]);
    assert.ok(!after.includes("thanksgiving-2"));
  });

  it("thanksgiving has 20 paid wordless stickers with assets", () => {
    assert.equal(THANKSGIVING_PACK.name, "thanksgiving");
    assert.equal(THANKSGIVING_PACK.free, false);
    assert.equal(THANKSGIVING_PACK.stickers.length, 20);
    assert.equal(new Set(THANKSGIVING_PACK.stickers.map((s) => s.id)).size, 20);
    for (const s of THANKSGIVING_PACK.stickers) {
      assert.match(s.src ?? "", /^\/stickers\/thanksgiving\/[a-z-]+\.webp$/);
      assert.equal(s.name, s.id.slice(3).replace(/-/g, " "));
    }
  });

  const THANKSGIVING_2_DROP = Date.parse("2026-11-23T14:00:00Z");

  it("game day feast drops Mon Nov 23 2026 8:00 AM Chicago (CST, 14:00 UTC)", () => {
    assert.equal(packDropTime(THANKSGIVING_2_PACK), THANKSGIVING_2_DROP);
    assert.equal(packDropTime(THANKSGIVING_2_PACK), Date.parse("2026-11-23T08:00:00-06:00"));
    assert.equal(isPackReleased(THANKSGIVING_2_PACK, THANKSGIVING_2_DROP - 1), false);
    assert.equal(isPackReleased(THANKSGIVING_2_PACK, THANKSGIVING_2_DROP), true);
  });

  it("tray hides game day feast before its drop and lists it last after", () => {
    assert.ok(!releasedStickerPacks(THANKSGIVING_2_DROP - 60_000).some((p) => p.id === "thanksgiving-2"));
    const after = releasedStickerPacks(THANKSGIVING_2_DROP).map((p) => p.id);
    assert.deepEqual(after.slice(-7), ["gulf-coast", "cozy-fall", "halloween", "birds", "late-autumn", "thanksgiving", "thanksgiving-2"]);
    assert.ok(!after.includes("first-frost"));
  });

  it("game day feast has 20 paid wordless stickers with assets", () => {
    assert.equal(THANKSGIVING_2_PACK.name, "game day feast");
    assert.equal(THANKSGIVING_2_PACK.free, false);
    assert.equal(THANKSGIVING_2_PACK.stickers.length, 20);
    assert.equal(new Set(THANKSGIVING_2_PACK.stickers.map((s) => s.id)).size, 20);
    for (const s of THANKSGIVING_2_PACK.stickers) {
      assert.match(s.src ?? "", /^\/stickers\/thanksgiving-2\/[a-z-]+\.webp$/);
      assert.equal(s.name, s.id.slice(3).replace(/-/g, " "));
    }
  });

  const FIRST_FROST_DROP = Date.parse("2026-11-30T14:00:00Z");

  it("first frost drops Mon Nov 30 2026 8:00 AM Chicago (CST, 14:00 UTC)", () => {
    assert.equal(packDropTime(FIRST_FROST_PACK), FIRST_FROST_DROP);
    assert.equal(packDropTime(FIRST_FROST_PACK), Date.parse("2026-11-30T08:00:00-06:00"));
    assert.equal(isPackReleased(FIRST_FROST_PACK, FIRST_FROST_DROP - 1), false);
    assert.equal(isPackReleased(FIRST_FROST_PACK, FIRST_FROST_DROP), true);
  });

  it("tray hides first frost before its drop and lists it last after", () => {
    assert.ok(!releasedStickerPacks(FIRST_FROST_DROP - 60_000).some((p) => p.id === "first-frost"));
    const after = releasedStickerPacks(FIRST_FROST_DROP).map((p) => p.id);
    assert.deepEqual(after.slice(-8), ["gulf-coast", "cozy-fall", "halloween", "birds", "late-autumn", "thanksgiving", "thanksgiving-2", "first-frost"]);
    assert.ok(!after.includes("fireside-nest"));
  });

  it("first frost has 20 paid wordless stickers with assets", () => {
    assert.equal(FIRST_FROST_PACK.name, "first frost");
    assert.equal(FIRST_FROST_PACK.free, false);
    assert.equal(FIRST_FROST_PACK.stickers.length, 20);
    assert.equal(new Set(FIRST_FROST_PACK.stickers.map((s) => s.id)).size, 20);
    for (const s of FIRST_FROST_PACK.stickers) {
      assert.match(s.src ?? "", /^\/stickers\/first-frost\/[a-z-]+\.webp$/);
      assert.equal(s.name, s.id.slice(3).replace(/-/g, " "));
    }
  });

  const FIRESIDE_NEST_DROP = Date.parse("2026-12-07T14:00:00Z");

  it("fireside nest drops Mon Dec 7 2026 8:00 AM Chicago (CST, 14:00 UTC)", () => {
    assert.equal(packDropTime(FIRESIDE_NEST_PACK), FIRESIDE_NEST_DROP);
    assert.equal(packDropTime(FIRESIDE_NEST_PACK), Date.parse("2026-12-07T08:00:00-06:00"));
    assert.equal(isPackReleased(FIRESIDE_NEST_PACK, FIRESIDE_NEST_DROP - 1), false);
    assert.equal(isPackReleased(FIRESIDE_NEST_PACK, FIRESIDE_NEST_DROP), true);
  });

  it("tray hides fireside nest before its drop and lists it last after", () => {
    assert.ok(!releasedStickerPacks(FIRESIDE_NEST_DROP - 60_000).some((p) => p.id === "fireside-nest"));
    const after = releasedStickerPacks(FIRESIDE_NEST_DROP).map((p) => p.id);
    assert.deepEqual(after.slice(-9), ["gulf-coast", "cozy-fall", "halloween", "birds", "late-autumn", "thanksgiving", "thanksgiving-2", "first-frost", "fireside-nest"]);
    assert.ok(!after.includes("snow-day"));
  });

  it("fireside nest has 20 paid wordless stickers with assets", () => {
    assert.equal(FIRESIDE_NEST_PACK.name, "fireside nest");
    assert.equal(FIRESIDE_NEST_PACK.free, false);
    assert.equal(FIRESIDE_NEST_PACK.stickers.length, 20);
    assert.equal(new Set(FIRESIDE_NEST_PACK.stickers.map((s) => s.id)).size, 20);
    for (const s of FIRESIDE_NEST_PACK.stickers) {
      assert.match(s.src ?? "", /^\/stickers\/fireside-nest\/[a-z-]+\.webp$/);
      assert.equal(s.name, s.id.slice(3).replace(/-/g, " "));
    }
  });

  const SNOW_DAY_DROP = Date.parse("2026-12-14T14:00:00Z");

  it("snow day drops Mon Dec 14 2026 8:00 AM Chicago (CST, 14:00 UTC)", () => {
    assert.equal(packDropTime(SNOW_DAY_PACK), SNOW_DAY_DROP);
    assert.equal(packDropTime(SNOW_DAY_PACK), Date.parse("2026-12-14T08:00:00-06:00"));
    assert.equal(isPackReleased(SNOW_DAY_PACK, SNOW_DAY_DROP - 1), false);
    assert.equal(isPackReleased(SNOW_DAY_PACK, SNOW_DAY_DROP), true);
  });

  it("tray hides snow day before its drop and lists it last after", () => {
    assert.ok(!releasedStickerPacks(SNOW_DAY_DROP - 60_000).some((p) => p.id === "snow-day"));
    const after = releasedStickerPacks(SNOW_DAY_DROP).map((p) => p.id);
    assert.deepEqual(after.slice(-10), ["gulf-coast", "cozy-fall", "halloween", "birds", "late-autumn", "thanksgiving", "thanksgiving-2", "first-frost", "fireside-nest", "snow-day"]);
    assert.equal(STICKER_PACKS.length, after.length);
  });

  it("snow day has 20 paid wordless stickers with assets", () => {
    assert.equal(SNOW_DAY_PACK.name, "snow day");
    assert.equal(SNOW_DAY_PACK.free, false);
    assert.equal(SNOW_DAY_PACK.stickers.length, 20);
    assert.equal(new Set(SNOW_DAY_PACK.stickers.map((s) => s.id)).size, 20);
    for (const s of SNOW_DAY_PACK.stickers) {
      assert.match(s.src ?? "", /^\/stickers\/snow-day\/[a-z-]+\.webp$/);
      assert.equal(s.name, s.id.slice(3).replace(/-/g, " "));
    }
  });
});
