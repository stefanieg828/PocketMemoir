/**
 * Stripe-verified web unlock. The verifier (VPS, see docs/unlock.md) checks a
 * Checkout Session with Stripe and returns an Ed25519-signed token; the app
 * verifies it offline with this public key. Play/TWA does not use this.
 */
import { verifyAsync } from "@noble/ed25519";

/** Raw 32-byte Ed25519 public key, base64url. Private half lives only on the VPS. */
export const UNLOCK_PUBLIC_KEY = "qy83Y6evHO2SoT6-HeMKrW9IZkYTUih-PRus2gm2cx0";

/** Tried in order: own subdomain first, then the temporary path on the same VPS. */
export const UNLOCK_API_BASES: readonly string[] = (() => {
  const env =
    typeof import.meta !== "undefined"
      ? (import.meta.env?.VITE_UNLOCK_API as string | undefined)
      : undefined;
  const list = [
    env?.trim(),
    "https://api.pocketmemoir.fun",
    "https://grilledcheeseandtomatosoup.fun/pm-api",
  ].filter((v): v is string => Boolean(v));
  return [...new Set(list)];
})();

function fromB64u(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export type UnlockClaims = { v: number; p: string; sid: string; iat: number };

/** Returns the claims if the token is a valid big-scraps unlock signed by our key. */
export async function verifyUnlockToken(token: unknown): Promise<UnlockClaims | null> {
  if (typeof token !== "string" || token.length > 600) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const ok = await verifyAsync(
      fromB64u(sig),
      new TextEncoder().encode(payload),
      fromB64u(UNLOCK_PUBLIC_KEY),
    );
    if (!ok) return null;
    const claims = JSON.parse(new TextDecoder().decode(fromB64u(payload))) as UnlockClaims;
    if (claims?.p !== "big-scraps" || typeof claims.sid !== "string") return null;
    return claims;
  } catch {
    return null;
  }
}

export type UnlockApiResult =
  | { ok: true; token: string; email?: string }
  | { ok: false; error: string; status?: number };

async function callApi(path: string, init?: RequestInit): Promise<UnlockApiResult> {
  const lastError = "couldn't reach the unlock check. check your connection and try again.";
  for (const base of UNLOCK_API_BASES) {
    try {
      const res = await fetch(`${base}${path}`, { ...init, cache: "no-store" });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; token?: string; error?: string; email?: string }
        | null;
      if (res.ok && data?.ok && data.token) {
        if (await verifyUnlockToken(data.token)) return {
            ok: true,
            token: data.token,
            ...(typeof data.email === "string" && data.email ? { email: data.email } : {}),
          };
        return { ok: false, error: "that unlock didn't check out." };
      }
      // A real answer from the verifier — don't try the next host.
      return { ok: false, status: res.status, error: data?.error || lastError };
    } catch {
      /* network / DNS / TLS — try the next base */
    }
  }
  return { ok: false, error: lastError };
}

export function verifyCheckoutSession(sessionId: string) {
  return callApi(`/verify?session_id=${encodeURIComponent(sessionId)}`);
}

export function restorePurchaseByEmail(email: string) {
  return callApi(`/restore`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

/** Read Stripe's success redirect: ?unlock=success&session_id=cs_… */
export function readCheckoutSessionFromUrl(
  href = typeof window !== "undefined" ? window.location.href : "",
): string | null {
  try {
    const sid = new URL(href).searchParams.get("session_id");
    return sid && /^cs_(live|test)_[A-Za-z0-9]+$/.test(sid) ? sid : null;
  } catch {
    return null;
  }
}
