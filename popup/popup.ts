type StorageShape = {
  lastCommand?: string;
  lastCommandAt?: string;
  lastCommandError?: string | null;
};

const lastCommandEl = document.getElementById("last-command");
const lastCommandAtEl = document.getElementById("last-command-at");
const lastCommandErrorEl = document.getElementById("last-command-error");
const shortcutsLinkEl = document.getElementById("shortcuts-link");
const hotkeysListEl = document.getElementById("hotkeys-list");

const commandLabels: Record<string, string> = {
  play_pause: "Play/Pause",
  next_track: "Next",
  prev_track: "Previous",
  focus_ytm: "Focus",
};

function formatRelativeTime(isoTimestamp?: string): string {
  if (!isoTimestamp) {
    return "--";
  }

  const parsed = Date.parse(isoTimestamp);
  if (Number.isNaN(parsed)) {
    return isoTimestamp;
  }

  const deltaMs = Date.now() - parsed;
  const deltaSeconds = Math.floor(deltaMs / 1000);

  if (deltaSeconds < 0) {
    return "just now";
  }
  if (deltaSeconds < 10) {
    return "just now";
  }
  if (deltaSeconds < 60) {
    return `${deltaSeconds}s ago`;
  }

  const deltaMinutes = Math.floor(deltaSeconds / 60);
  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) {
    return `${deltaHours}h ago`;
  }

  const deltaDays = Math.floor(deltaHours / 24);
  return `${deltaDays}d ago`;
}

function renderStatus(data: StorageShape) {
  if (!lastCommandEl || !lastCommandAtEl || !lastCommandErrorEl) {
    return;
  }

  lastCommandEl.textContent = data.lastCommand ?? "None";
  lastCommandAtEl.textContent = formatRelativeTime(data.lastCommandAt);
  lastCommandErrorEl.textContent = data.lastCommandError ?? "None";
}

function formatShortcut(shortcut?: string) {
  return shortcut && shortcut.trim().length > 0 ? shortcut : "Not set";
}

function renderHotkeys(commands: chrome.commands.Command[]) {
  if (!hotkeysListEl) {
    return;
  }

  hotkeysListEl.textContent = "";

  const filtered = commands.filter(
    (command) => command.name && command.name in commandLabels
  );

  for (const command of filtered) {
    const row = document.createElement("div");
    row.className = "hotkey-row";

    const name = document.createElement("div");
    name.className = "hotkey-name";
    name.textContent = commandLabels[command.name] ?? command.name;

    const shortcut = document.createElement("div");
    shortcut.className = "hotkey-shortcut";
    shortcut.textContent = formatShortcut(command.shortcut);

    row.appendChild(name);
    row.appendChild(shortcut);
    hotkeysListEl.appendChild(row);
  }
}

function loadCommands() {
  if (!chrome.commands?.getAll) {
    return;
  }

  chrome.commands.getAll((commands) => {
    const err = chrome.runtime.lastError;
    if (err) {
      return;
    }
    renderHotkeys(commands);
  });
}

if (shortcutsLinkEl) {
  shortcutsLinkEl.addEventListener("click", (event) => {
    event.preventDefault();
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  });
}

chrome.storage.sync.get(
  ["lastCommand", "lastCommandAt", "lastCommandError"],
  (data) => {
    renderStatus(data);
  }
);

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync") {
    return;
  }

  const next: StorageShape = {
    lastCommand: changes.lastCommand?.newValue,
    lastCommandAt: changes.lastCommandAt?.newValue,
    lastCommandError: changes.lastCommandError?.newValue,
  };

  renderStatus(next);
});

loadCommands();
