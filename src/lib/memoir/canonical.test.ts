import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SITE_ORIGIN, canonicalUrl } from "./canonical.ts";

describe("canonicalUrl", () => {
  it("maps the home path to the origin with no trailing slash", () => {
    assert.equal(canonicalUrl("/"), SITE_ORIGIN);
    assert.equal(canonicalUrl(""), SITE_ORIGIN);
    assert.equal(canonicalUrl("/index.html"), SITE_ORIGIN);
    assert.equal(canonicalUrl("/?utm=1"), SITE_ORIGIN);
  });

  it("strips a trailing slash and index.html from other routes", () => {
    assert.equal(canonicalUrl("/calendar"), `${SITE_ORIGIN}/calendar`);
    assert.equal(canonicalUrl("/calendar/"), `${SITE_ORIGIN}/calendar`);
    assert.equal(canonicalUrl("/keep/index.html"), `${SITE_ORIGIN}/keep`);
    assert.equal(canonicalUrl("/kept/abc#top"), `${SITE_ORIGIN}/kept/abc`);
  });
});
