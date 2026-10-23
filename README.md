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

### On a phone
Phones (up to 820px wide, or held sideways under 520px tall) get a touch layout. The 3D box stays on screen as a backdrop, and each wall's content appears in a scrollable panel.

| Gesture | Action |
|---|---|
| Swipe left / right | Next / previous topic |
| `‹` `›` or a number on the bottom bar | Previous / next, or jump to that topic |
| **Step inside ›** | From the start screen, enter wall 1 |
| Tap the handle at the top of the panel | Slide the panel down to see the 3D scene, tap again to bring it back |
| Tap a card marked "Tap for note" | Show its tooltip (tap again to hide). A card that is also a link opens the link instead |

Held sideways, the panel sits on the left and the 3D scene on the right.

## Editing content
Everything on the walls is in `content.js`. Edit, save, reload.
To make a card clickable, add `href: "https://…"` to it; the whole card becomes a link and opens in a new tab. Works on the walls and in the topic 7 list.
To show a hover tooltip on a card, add `tooltip: "…"`: the card lifts and the line appears above it. Leave it out and the card does nothing on hover. Works on the walls and in the topic 7 list too. On a phone, the tooltip shows when the card is tapped.
Images: drop files in `assets/` and set `image: { src: "assets/your-file.png", alt: "…" }`. Frames are 16:10.

## Files
- `content.js`: all copy, links, images
- `game.js`: three.js scene (glass box, rocket, camera)
- `style.css`: Waves '26 tokens; wall panels use every role × 1.5 for projector legibility; the phone layout is one block at the end of the file
- `lib/`: three.js r147 (classic build so it runs from file://), with its MIT licence
- `fonts/`: Satoshi from Fontshare, kept on this computer only for offline use. It's gitignored because the ITF Free Font License doesn't allow sharing the font files in a public repository. Without it, the page loads Satoshi from Fontshare's servers, so it needs internet.
