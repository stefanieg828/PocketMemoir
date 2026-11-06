# assetlinks.json — add Play App Signing SHA-256

## Status (2026-09-28 CT)

| Fingerprint | Source | In live assetlinks? |
| --- | --- | --- |
| Upload key | `PocketMemoir-secrets` / keystore / local signed APK | **Yes** (only one today) |
| Play **App signing** key | Play Console only | **No** → yellow Custom Tabs URL bar on Play installs |

Live file (Pages + repo): `PocketMemoir-cats/public/.well-known/assetlinks.json`  
Live URL: `https://pocketmemoir.fun/.well-known/assetlinks.json`

DAL API currently returns only the upload fingerprint (expected until Play SHA is added).

**Do not push a fake/placeholder SHA to production** — it will not fix verification.
Paste the real Console value, then deploy.

---

## Target JSON (after you paste)

Keep the upload fingerprint. Add Play App Signing SHA-256 (and any extra hybrid
fingerprints from Console) in the **same** array:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "fun.pocketmemoir.app",
      "sha256_cert_fingerprints": [
        "2A:5F:18:2D:52:42:D0:44:8D:A0:36:2F:F8:E0:D9:9C:D7:6C:09:97:E6:B1:A7:1C:D1:67:F8:86:48:6C:1B:E1",
        "TODO_PASTE_PLAY_APP_SIGNING_SHA256_HERE"
      ]
    }
  }
]
```

Replace `TODO_PASTE_PLAY_APP_SIGNING_SHA256_HERE` with the colon-separated value from
**App signing key certificate** (see `PLAY_SIGNING_SHA256.md`). If Console lists
more than one App signing SHA-256 (quantum-ready hybrid), append each as another
string in the array.

---

## Steps once SHA is copied

1. Edit `PocketMemoir-cats/public/.well-known/assetlinks.json` as above.
2. Commit on the Pages deploy branch (`feature/visual-polish` today) and push.
3. Confirm live JSON includes both fingerprints.
4. Optional: [Digital Asset Links generator](https://developers.google.com/digital-asset-links/tools/generator)
5. Reinstall / clear site data → reopen Play TWA → confirm **no** URL bar.

Agent may push assetlinks **only** when a real Play signing SHA is provided.
