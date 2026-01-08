type StorageShape = {
  lastCommand?: string;
  lastCommandAt?: string;
};

const lastCommandEl = document.getElementById("last-command");
const lastCommandAtEl = document.getElementById("last-command-at");

function renderStatus(data: StorageShape) {
  if (!lastCommandEl || !lastCommandAtEl) {
    return;
  }

  lastCommandEl.textContent = data.lastCommand ?? "None";
  lastCommandAtEl.textContent = data.lastCommandAt ?? "--";
}

chrome.storage.sync.get(["lastCommand", "lastCommandAt"], (data) => {
  renderStatus(data);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync") {
    return;
  }

  const next: StorageShape = {
    lastCommand: changes.lastCommand?.newValue,
    lastCommandAt: changes.lastCommandAt?.newValue,
  };

  renderStatus(next);
});
