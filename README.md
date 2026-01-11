# YTM Global Hotkeys

Chrome Manifest V3 extension that provides global keyboard shortcuts for
YouTube Music on macOS using Chrome's `commands` API. Chrome must be running.

## Commands

- `play_pause`
- `next_track`
- `prev_track`
- `focus_ytm`

## Setup

1. Run `npm run dev`.
2. Load the extension as unpacked in `chrome://extensions`.
3. Open `chrome://extensions/shortcuts`, assign shortcuts for each command, and
   set them to **Global** so they work even when Chrome is unfocused.

## Tab Selection Rules

Only one YouTube Music tab is controlled at a time. When a command runs, the
extension targets:

1. The active YTM tab, if present
2. Otherwise an audible YTM tab
3. Otherwise the most recently accessed YTM tab
4. If no YTM tab exists, it opens `https://music.youtube.com/` and targets it

## Development Notes

- Source is TypeScript in `src/` and `popup/`.
- Build output goes to `dist/` (generated, not committed).
- `popup/popup.html` loads `dist/popup.js` directly.
