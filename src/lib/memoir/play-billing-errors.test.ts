import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyPlayError,
  formatPlayPrice,
  pickItem,
  playFailureMessage,
  probeStatusMessage,
} from "./play-billing-errors.ts";

function err(name: string, message: string) {
  const e = new Error(message);
  e.name = name;
  return e;
}

describe("classifyPlayError", () => {
  it("treats TWA RESULT_CANCELED as play-closed (not a silent user cancel)", () => {
    const e = err(
      "AbortError",
      "Payment app returned RESULT_CANCELED code. This is how payment apps can close their activity programmatically.",
    );
    assert.equal(classifyPlayError(e), "play-closed");
    assert.ok(playFailureMessage("play-closed").length > 10);
  });
  it("maps other PaymentRequest errors", () => {
    assert.equal(classifyPlayError(err("AbortError", "User closed the Payment Request UI.")), "user-closed");
    assert.equal(classifyPlayError(err("NotSupportedError", "The payment method is not supported")), "not-supported");
    assert.equal(classifyPlayError(err("SecurityError", "requires transient user activation")), "needs-tap");
    assert.equal(classifyPlayError(err("InvalidStateError", "already showing")), "busy");
    assert.equal(classifyPlayError("weird"), "unknown");
  });
  it("every failure copy is soft lowercase", () => {
    for (const k of ["play-closed", "user-closed", "not-supported", "needs-tap", "busy", "unknown"] as const) {
      const m = playFailureMessage(k);
      assert.equal(m, m.toLowerCase());
    }
  });
});

describe("getDetails helpers", () => {
  it("picks big_scraps and formats Play price", () => {
    const item = pickItem([{ itemId: "big_scraps", title: "x", price: { currency: "USD", value: "0.99" } }], "big_scraps");
    assert.ok(item);
    assert.equal(formatPlayPrice(item, "en-US"), "$0.99");
    assert.equal(pickItem([], "big_scraps"), null);
    assert.equal(pickItem(undefined, "big_scraps"), null);
    assert.equal(formatPlayPrice(null), null);
  });
  it("explains each probe status in the TWA; stays quiet in a browser without the API", () => {
    assert.equal(probeStatusMessage("ready", true), null);
    assert.equal(probeStatusMessage("no-api", false), null);
    for (const s of ["no-api", "service-error", "no-product", "details-error"] as const) {
      const m = probeStatusMessage(s, true);
      assert.ok(m && m === m.toLowerCase());
    }
  });
});
