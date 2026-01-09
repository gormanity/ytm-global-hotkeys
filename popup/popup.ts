type StorageShape = {
  lastCommand?: string;
  lastCommandAt?: string;
  lastCommandError?: string | null;
};

const lastCommandEl = document.getElementById("last-command");
const lastCommandAtEl = document.getElementById("last-command-at");
const lastCommandErrorEl = document.getElementById("last-command-error");

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
