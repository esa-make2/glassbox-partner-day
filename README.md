# The interactive glass box presentation — Make NAMER Partner Day (October 2026)

## Controls
| Key | Action |
|---|---|
| `1`–`6` | Fly to that inner wall |
| `7` | Exit the box: the full-picture view |
| `0` / `Esc` | Back to the start screen |
| `Enter` | From the start screen, enter wall 1 |
| `←` `↑` `↓` `→` | Fly the rocket (camera follows). Outside the box: orbit around it |
| `+` / `-` (or scroll) | Zoom in / out |
| `PageDown` / `PageUp` | Next / previous (works with most presentation clickers) |
| `H` | Hide the HUD |
| `F` | Fullscreen |

Press the current wall's number again to re-centre. The URL keeps your place (`#3`), so a reload returns to the same wall.

## Editing content
Everything on the walls is in `content.js`. Edit, save, reload.
To make a card clickable, add `href: "https://…"` to it; the whole card becomes a link and opens in a new tab. Works on the walls and in the topic 7 list.
To show a hover tooltip on a card, add `tooltip: "…"`: the card lifts and the line appears above it. Leave it out and the card does nothing on hover. Works on the walls and in the topic 7 list too.
Images: drop files in `assets/` and set `image: { src: "assets/your-file.png", alt: "…" }`. Frames are 16:10.

## Files
- `content.js`: all copy, links, images
- `game.js`: three.js scene (glass box, rocket, camera)
- `style.css`: Waves '26 tokens; wall panels use every role × 1.5 for projector legibility
- `lib/`: three.js r147 (classic build so it runs from file://), `fonts/`: Satoshi (Fontshare)
