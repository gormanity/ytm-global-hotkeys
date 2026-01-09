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
          const button =
            document.querySelector<HTMLElement>("#play-pause-button") ??
            document.querySelector<HTMLElement>(
              'button[aria-label="Play"], button[aria-label="Pause"]'
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

function executeNextTrack(tabId: number): Promise<CommandResult> {
  return new Promise((resolve) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: () => {
          const isVisible = (el: HTMLElement) => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          };

          const primary =
            document.querySelector<HTMLElement>("#next-button") ??
            document.querySelector<HTMLElement>("#mini-player #next-button");
          if (primary && isVisible(primary)) {
            primary.click();
            return { ok: true };
          }

          const buttons = Array.from(
            document.querySelectorAll<HTMLElement>(
              'tp-yt-paper-icon-button[aria-label], button[aria-label]'
            )
          );
          const match = buttons.find((button) => {
            const label = button.getAttribute("aria-label") ?? "";
            return label.toLowerCase().startsWith("next") && isVisible(button);
          });

          if (!match) {
            return { ok: false, reason: "no-button" };
          }
          match.click();
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

function executePrevTrack(tabId: number): Promise<CommandResult> {
  return new Promise((resolve) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: () => {
          const isVisible = (el: HTMLElement) => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          };

          const primary =
            document.querySelector<HTMLElement>("#previous-button") ??
            document.querySelector<HTMLElement>(
              "#mini-player #previous-button"
            );
          if (primary && isVisible(primary)) {
            primary.click();
            return { ok: true };
          }

          const buttons = Array.from(
            document.querySelectorAll<HTMLElement>(
              'tp-yt-paper-icon-button[aria-label], button[aria-label]'
            )
          );
          const match = buttons.find((button) => {
            const label = button.getAttribute("aria-label") ?? "";
            return (
              label.toLowerCase().startsWith("previous") && isVisible(button)
            );
          });

          if (!match) {
            return { ok: false, reason: "no-button" };
          }
          match.click();
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

    let result: CommandResult = { ok: false, reason: "unknown-command" };
    if (command === "play_pause") {
      result = await executePlayPause(tab.id);
    } else if (command === "next_track") {
      result = await executeNextTrack(tab.id);
    } else if (command === "prev_track") {
      result = await executePrevTrack(tab.id);
    } else {
      logEvent("unknown command", { command });
    }

    if (!result.ok) {
      logEvent("command failed", { reason: result.reason, command });
      await storageSet({ lastCommandError: result.reason ?? "unknown" });
      return;
    }

    await storageSet({ lastCommandError: null });
  })();
});
