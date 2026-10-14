# Copy Play App Signing SHA-256 (fullscreen TWA fix)

**Why:** Play-installed builds are signed with Google’s **App signing key**, not your
upload keystore. `assetlinks.json` currently lists only the upload-key SHA-256, so
Chrome falls back to Custom Tabs and shows the yellow URL bar (`pocketmemoir.fun`).

**We cannot fetch the Play signing SHA from this box** (not in the AAB, keystore,
bubblewrap `fingerprints`, or local APK). It appears in Play Console only after the
app is enrolled in Play App Signing (default on first AAB upload).

---

## Exact click-path (current Play Console — prefer this)

Official Help now routes signing under **Protected with Play**:

1. Open [Play Console](https://play.google.com/console) → select **PocketMemoir**
   (`fun.pocketmemoir.app`).
2. Left nav → **Protected with Play**.
3. Open **Play Store distribution** (or **Play Store protection**, depending on UI).
4. Click **Go to Play app signing** / **Manage Play app signing**.
5. Find the section **App signing key certificate**  
   (**not** “Upload key certificate” — that one already matches assetlinks).
6. Copy **SHA-256 certificate fingerprint** (colon-separated hex).
7. If the page shows **quantum-ready / hybrid** keys, copy **every** App signing
   SHA-256 listed (classical + any PQC / additional classical) and add **all** of
   them to `assetlinks.json`.

### Deep link (skips hunting menus)

After login, open:

`https://play.google.com/console/developers/app/keymanagement`

Pick the PocketMemoir app when prompted → lands on the App signing page.

---

## Alternate / older UI labels (still valid on many accounts)

If you do not see “Protected with Play”:

1. Play Console → **PocketMemoir**
2. **Release** (or **Test and release**) → **Setup** → **App integrity**  
   *or* **Release** → **Setup** → **App signing**
3. Expand **App signing key certificate** → copy **SHA-256**

---

## What to do with the fingerprint

1. Paste into `public/.well-known/assetlinks.json` as a **second** entry in
   `sha256_cert_fingerprints` (keep the upload key). See
   `docs/ASSETLINKS_PLAY_SIGNING_PLAN.md` in this folder / cats docs.
2. Deploy Pages (merge to the branch that deploys `pocketmemoir.fun`).
3. Wait a few minutes, then verify:
   ```bash
   curl -s https://pocketmemoir.fun/.well-known/assetlinks.json
   ```
4. On the phone: clear Chrome storage for the site **or** reinstall the Play build,
   then open the app — URL bar should disappear (true TWA / fullscreen).

---

## Already on file (upload key — keep this)

```
2A:5F:18:2D:52:42:D0:44:8D:A0:36:2F:F8:E0:D9:9C:D7:6C:09:97:E6:B1:A7:1C:D1:67:F8:86:48:6C:1B:E1
```

Package: `fun.pocketmemoir.app` · Host: `https://pocketmemoir.fun`
