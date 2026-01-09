const logPrefix = "[ytm-global-hotkeys]";
const ytmUrlPattern = "https://music.youtube.com/*";

type CommandResult = {
  ok: boolean;
  reason?: string;
};

function logEvent(message: string, data?: Record<string, unknown>) {
  if (data) {
    console.log(logPrefix, message, data);
  } else {
    console.log(logPrefix, message);
  }
}

function storageSet(data: Record<string, unknown>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(data, () => {
      const err = chrome.runtime.lastError;
      if (err) {
        logEvent("storage write failed", { message: err.message });
      }
      resolve();
    });
  });
}

function queryYtmTabs(): Promise<chrome.tabs.Tab[]> {
  return new Promise((resolve) => {
    chrome.tabs.query({ url: ytmUrlPattern }, (tabs) => {
      const err = chrome.runtime.lastError;
      if (err) {
        logEvent("tab query failed", { message: err.message });
        resolve([]);
        return;
      }
      resolve(tabs);
    });
  });
}

function executePlayPause(tabId: number): Promise<CommandResult> {
  return new Promise((resolve) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: () => {
          const button = document.querySelector<HTMLButtonElement>(
            'button[aria-label^="Play"], button[aria-label^="Pause"]'
          );
          if (!button) {
            return { ok: false, reason: "no-button" };
          }
          button.click();
          return { ok: true };
        },
      },
      (results) => {
        const err = chrome.runtime.lastError;
        if (err) {
          resolve({ ok: false, reason: "script-error" });
          return;
        }
        const first = results && results[0] && results[0].result;
        resolve(first ?? { ok: false, reason: "no-result" });
      }
    );
  });
}

function pickMostRecentTab(tabs: chrome.tabs.Tab[]): chrome.tabs.Tab | null {
  if (tabs.length === 0) {
    return null;
  }
  return tabs.reduce((latest, tab) => {
    if (!latest.lastAccessed || !tab.lastAccessed) {
      return latest;
    }
    return tab.lastAccessed > latest.lastAccessed ? tab : latest;
  }, tabs[0]);
}

chrome.runtime.onInstalled.addListener(() => {
  logEvent("installed");
});

chrome.runtime.onStartup.addListener(() => {
  logEvent("startup");
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "play_pause") {
    logEvent("unknown command", { command });
    return;
  }

  const timestamp = new Date().toISOString();
  logEvent("command received", { command, timestamp });

  void (async () => {
    await storageSet({
      lastCommand: command,
      lastCommandAt: timestamp,
      lastCommandError: null,
    });

    const tabs = await queryYtmTabs();
    const tab = pickMostRecentTab(tabs);
    if (!tab || tab.id === undefined) {
      logEvent("no YTM tab found");
      await storageSet({ lastCommandError: "no-tab" });
      return;
    }

    const result = await executePlayPause(tab.id);
    if (!result.ok) {
      logEvent("play/pause failed", { reason: result.reason });
      await storageSet({ lastCommandError: result.reason ?? "unknown" });
      return;
    }

    await storageSet({ lastCommandError: null });
  })();
});
