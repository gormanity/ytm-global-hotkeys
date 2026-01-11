# Project: YouTube Music Global Hotkeys (Chrome Extension)

## Goal

Provide global keyboard shortcuts on macOS to control YouTube Music (play/pause,
next, previous) using Chrome’s `commands` API.

Chrome must be running. The YouTube Music tab does not need to be focused.

## Explicit Non-Goals

- No native helper / native messaging
- No support for browsers other than Chrome
- No platforms where Chrome global commands are unsupported
- No support for services other than YouTube Music
- No analytics, tracking, or remote calls

## Target Platform

- macOS (primary)
- Chrome Manifest V3
- Language: TypeScript (compiled to JS)
- Bundler: esbuild
- Output: dist/ (generated)

## Definition of “Global”

Keyboard shortcuts registered via `chrome.commands` and marked as **Global** in
Chrome’s shortcuts UI.

## Core Commands

- play_pause
- next_track
- prev_track
- focus_ytm
  - Focus the most recently used YTM tab, opening one if none exists.

## Design Principles

- Reliability > cleverness
- Prefer simple DOM interaction over abstractions
- Fail loudly and visibly (store last error)
- One YouTube Music tab is controlled at a time
  - Target selection prefers active, then audible, then most recently accessed YTM tab
  - If no YTM tab exists, open one and target it

## Success Criteria

From another app on macOS:

- Press shortcut
- YouTube Music responds within ~200ms
- No Chrome window focus change unless explicitly configured
- If no YTM tab exists, the extension opens one to handle the command
- A dedicated focus shortcut brings the YTM tab to the foreground

## Known Constraints

- Shortcuts must be configured by the user in Chrome
- Selectors may break if YouTube Music UI changes
- Extension cannot intercept OS-level media keys directly

## Build & Dev Loop

- Source is TypeScript in `src/` and `popup/`
- Build output goes to `dist/` (generated)
- Dev: `npm run dev` (esbuild watch) + manual reload in `chrome://extensions`
- Typecheck: `npm run typecheck`

## Repo Policy

- `dist/` is not committed
- Keep build tooling minimal (esbuild + tsc only) unless explicitly expanded
