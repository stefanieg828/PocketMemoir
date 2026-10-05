# Peek — share a look, not your album

A **peek** lets someone browse your scrapbook or cork wall **read-only**. Their
own scraps, unlock, and `pocketmemoir.v1` stay untouched.

## Peek vs backup vs unlock

| | **Peek** | **Backup** | **Unlock** |
|---|---|---|---|
| Purpose | Friend looks at your album | You move *your* scraps between devices | one-time 99¢ · little scraps → big scraps |
| File kind | `pocketmemoir-peek` | `pocketmemoir-backup` | (no file — Stripe success URL / restore) |
| Where | Keep them safe → **share a peek** / **open a peek** | Keep them safe → Save to… / Share / Restore | Look → unlock sheet |
| Writes friend’s album? | No — in-memory session only | Restore merges or replaces | Restore can carry `unlocked` |
| Grants unlock? | **Never** | Yes, if the backup includes unlock | Yes |

## Share a peek (owner)

1. Open **Look → Keep them safe**.
2. Tap **share a peek** (Web Share with a `.json` file; cancel is quiet; fail
   falls back to download) or **download peek**.
3. Send the file however you like (Messages, email, Files…).

Photos travel inline as data URLs (same as backup). File-based peek is the
required path. Tiny hash links (`#peek=…`) are optional and skipped when
fragile or too large.

## Open a peek (friend)

1. Open **Look → Keep them safe → open a peek**.
2. Pick the `pocketmemoir-peek-….json` file.
3. A soft banner says **you’re peeking — scraps stay with them**.
4. Browse their scrapbook/cork with their look. Add / edit / delete / unlock /
   sticker place / restore that would clobber are hidden or disabled.
5. Tap **done peeking** — session clears; your album and unlock are unchanged.

Opening a peek **never** calls restore, **never** sets `unlocked`, and
**never** overwrites `pocketmemoir.v1`.

If you pick a full backup by mistake, Open a peek explains it’s a backup and
points you to Restore instead.

## Soft copy (lowercase body)

- share a peek
- open a peek / download peek
- you’re peeking — scraps stay with them · done peeking

Comic chrome may uppercase via CSS only — keep source copy lowercase.
