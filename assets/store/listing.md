# Store Listing

## Description

YTM Global Hotkeys adds global keyboard shortcuts for YouTube Music on macOS
using Chrome’s built‑in commands API. Control playback even when Chrome isn’t
focused. No native helpers or extra permissions needed.

Features

- Global play/pause, next, previous, and focus shortcuts
- Targets the most relevant YTM tab (active → audible → recent)
- Auto‑opens YouTube Music if no tab exists
- Lightweight popup showing last command and time

Setup

1. Install the extension and open chrome://extensions/shortcuts
2. Assign shortcuts and set them to Global
3. Use your shortcuts from any app

Notes

- Optimized for macOS; functionality may be degraded on other platforms
- Chrome must be running

GitHub: https://github.com/gormanity/ytm-global-hotkeys

# Privacy Disclosures

## Single Purpose Description

Enable customizable keyboard shortcuts for controlling YouTube Music.

## Permission Justifications

- **storage**: Used to save user preferences for the extension’s commands and
  behavior (e.g., the user’s chosen YouTube Music tab selection/focus behavior
  and any extension settings). This enables the extension to reliably perform
  the same user-configured actions across browser restarts.

- **scripting**: Used to inject a small content script into YouTube Music pages
  to trigger playback/navigation actions (play/pause, next, previous) in
  response to the user’s keyboard shortcuts. This is required to control YouTube
  Music from the extension.

- **tabs**: Used to locate an existing YouTube Music tab and bring it to the
  foreground when the user triggers the “Focus YouTube Music” shortcut. This
  requires reading tab URLs/titles to identify the correct YouTube Music tab and
  activating it.

- **host_permission**: Limits script injection and interaction to YouTube Music
  only. The extension needs access to https://music.youtube.com/* to control
  playback/navigation within YouTube Music and to focus the appropriate YouTube
  Music tab when requested.
