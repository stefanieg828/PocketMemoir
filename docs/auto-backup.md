# auto backup

Opt-in, free. "keep them safe" → "turn on auto backup" makes a random 32-character backup code
(Crockford base32, 160 bits) kept in `localStorage["pocketmemoir.cloudBackup"]`.

- PBKDF2-SHA256 (150k) on the code → AES-GCM key + 64-hex storage id. Encrypted (gzip first) in the browser.
- `PUT /backup/:id` on pm-verifier (api.pocketmemoir.fun, fallback grilledcheeseandtomatosoup.fun/pm-api),
  12 MB cap, last 5 versions kept in `/opt/pm-verifier/data/bk/<id>/`. Server never sees code, email, or scraps.
- Runs 20 s after any change, when the app is hidden, and once a day. Skips empty / sample-only shelves.
- New device: home slip "been here before? bring back your notes" → type code → usual restore dialog → code adopted.
- No email recovery: the server has no mail sender, and a lost code can't be reset (by design).
