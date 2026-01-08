const logPrefix = "[ytm-global-hotkeys]";

function logEvent(message: string, data?: Record<string, unknown>) {
  if (data) {
    console.log(logPrefix, message, data);
  } else {
    console.log(logPrefix, message);
  }
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

  chrome.storage.sync.set(
    {
      lastCommand: command,
      lastCommandAt: timestamp,
    },
    () => {
      const err = chrome.runtime.lastError;
      if (err) {
        logEvent("storage write failed", { message: err.message });
      }
    }
  );
});
