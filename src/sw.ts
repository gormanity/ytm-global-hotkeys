const logPrefix = "[ytm-global-hotkeys]";
const ytmUrlPattern = "https://music.youtube.com/*";
const ytmUrl = "https://music.youtube.com/";
const commandRetryAttempts = 6;
const commandRetryDelayMs = 300;

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

function createYtmTab(): Promise<chrome.tabs.Tab | null> {
  return new Promise((resolve) => {
    chrome.tabs.create({ url: ytmUrl, active: false }, (tab) => {
      const err = chrome.runtime.lastError;
      if (err) {
        logEvent("tab create failed", { message: err.message });
        resolve(null);
        return;
      }
      resolve(tab ?? null);
    });
  });
}

function focusTab(tab: chrome.tabs.Tab): Promise<void> {
  return new Promise((resolve) => {
    if (tab.windowId !== undefined) {
      chrome.windows.update(tab.windowId, { focused: true }, () => {
        chrome.tabs.update(tab.id ?? undefined, { active: true }, () => {
          resolve();
        });
      });
      return;
    }

    chrome.tabs.update(tab.id ?? undefined, { active: true }, () => {
      resolve();
    });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
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

          const getShadowButton = (selectors: string[]) => {
            const hosts = Array.from(
              document.querySelectorAll<HTMLElement>(
                "ytmusic-player-bar, ytmusic-mini-player-bar"
              )
            );
            for (const host of hosts) {
              const root = (host as HTMLElement & { shadowRoot?: ShadowRoot })
                .shadowRoot;
              if (!root) {
                continue;
              }
              for (const selector of selectors) {
                const button = root.querySelector<HTMLElement>(selector);
                if (button) {
                  return button;
                }
              }
            }
            return null;
          };

          const primary =
            document.querySelector<HTMLElement>("#next-button") ??
            document.querySelector<HTMLElement>("#mini-player #next-button");
          if (primary && isVisible(primary)) {
            primary.click();
            return { ok: true };
          }

          const shadowButton = getShadowButton([
            "#next-button",
            'button[aria-label="Next song"]',
            'button[aria-label="Next track"]',
            'tp-yt-paper-icon-button[aria-label^="Next"]',
          ]);
          if (shadowButton && isVisible(shadowButton)) {
            shadowButton.click();
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

          const getShadowButton = (selectors: string[]) => {
            const hosts = Array.from(
              document.querySelectorAll<HTMLElement>(
                "ytmusic-player-bar, ytmusic-mini-player-bar"
              )
            );
            for (const host of hosts) {
              const root = (host as HTMLElement & { shadowRoot?: ShadowRoot })
                .shadowRoot;
              if (!root) {
                continue;
              }
              for (const selector of selectors) {
                const button = root.querySelector<HTMLElement>(selector);
                if (button) {
                  return button;
                }
              }
            }
            return null;
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

          const shadowButton = getShadowButton([
            "#previous-button",
            'button[aria-label="Previous song"]',
            'button[aria-label="Previous track"]',
            'tp-yt-paper-icon-button[aria-label^="Previous"]',
          ]);
          if (shadowButton && isVisible(shadowButton)) {
            shadowButton.click();
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

function rankCandidateTabs(tabs: chrome.tabs.Tab[]): chrome.tabs.Tab[] {
  const withIds = tabs.filter((tab) => tab.id !== undefined);
  const byLastAccessed = [...withIds].sort((a, b) => {
    const aAccessed = a.lastAccessed ?? 0;
    const bAccessed = b.lastAccessed ?? 0;
    return bAccessed - aAccessed;
  });

  const ordered = [
    ...withIds.filter((tab) => tab.active),
    ...withIds.filter((tab) => tab.audible),
    ...byLastAccessed,
  ];

  const seen = new Set<number>();
  const unique: chrome.tabs.Tab[] = [];
  for (const tab of ordered) {
    if (tab.id === undefined || seen.has(tab.id)) {
      continue;
    }
    seen.add(tab.id);
    unique.push(tab);
  }

  return unique;
}

async function executeCommandWithRetry(
  tabId: number,
  command: string
): Promise<CommandResult> {
  let lastResult: CommandResult = { ok: false, reason: "unknown-command" };

  for (let attempt = 0; attempt < commandRetryAttempts; attempt += 1) {
    if (command === "play_pause") {
      lastResult = await executePlayPause(tabId);
    } else if (command === "next_track") {
      lastResult = await executeNextTrack(tabId);
    } else if (command === "prev_track") {
      lastResult = await executePrevTrack(tabId);
    } else {
      return { ok: false, reason: "unknown-command" };
    }

    if (lastResult.ok) {
      return lastResult;
    }

    if (lastResult.reason !== "no-button") {
      return lastResult;
    }

    await sleep(commandRetryDelayMs);
  }

  return lastResult;
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
    let tab = pickMostRecentTab(tabs);

    if (command === "focus_ytm") {
      const candidates = rankCandidateTabs(tabs);
      tab = candidates[0] ?? null;
      if (!tab) {
        tab = await createYtmTab();
      }

      if (!tab) {
        logEvent("focus failed", { reason: "no-tab" });
        await storageSet({ lastCommandError: "no-tab" });
        return;
      }

      await focusTab(tab);
      await storageSet({ lastCommandError: null });
      return;
    }

    if (!tab || tab.id === undefined) {
      logEvent("no YTM tab found, opening new tab");
      tab = await createYtmTab();
    }

    if (!tab || tab.id === undefined) {
      await storageSet({ lastCommandError: "no-tab" });
      return;
    }

    const candidates = rankCandidateTabs(tabs.length > 0 ? tabs : [tab]);
    let lastResult: CommandResult | null = null;

    for (const candidate of candidates) {
      if (candidate.id === undefined) {
        continue;
      }
      lastResult = await executeCommandWithRetry(candidate.id, command);
      if (lastResult.ok) {
        await storageSet({ lastCommandError: null });
        return;
      }
      if (lastResult.reason !== "no-button") {
        break;
      }
    }

    logEvent("command failed", {
      reason: lastResult?.reason ?? "unknown",
      command,
    });
    await storageSet({ lastCommandError: lastResult?.reason ?? "unknown" });
  })();
});
