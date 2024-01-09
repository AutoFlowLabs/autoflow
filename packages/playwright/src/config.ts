import * as fs from "fs";
import * as path from "path";

let cachedConfig: null | Record<string, string> = null;

export const loadConfig = () => {
  if (!cachedConfig) {
    let loadedConfig: Record<string, string> = {};

    const configFilePath = path.join(process.cwd(), "autoflow.config.json");
    if (fs.existsSync(configFilePath)) {
      loadedConfig = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
    }

    cachedConfig = loadedConfig;
  }

  return cachedConfig;
};

export const retrieveConfigValue = (key: string, fallback?: string): string => {
  if (process.env[`AUTOFLOW_${key}`] !== undefined) {
    return process.env[`AUTOFLOW_${key}`]!;
  }

  const loadedConfig = loadConfig();

  if (loadedConfig[key] !== undefined) {
    return loadedConfig[key].toString();
  } else if (fallback) {
    return fallback;
  } else {
    return "";
  }
};

// Configurable via environment variables or the config file
export const TOKEN = retrieveConfigValue("TOKEN");
export const WEBSOCKET_PROTOCOL = process.env["WEBSOCKET_PROTOCOL"] || "ws";
export const WEBSOCKET_HOST = retrieveConfigValue(
  "WEBSOCKET_HOST",
  "127.0.0.1:8000"
);
export const PACKAGE_NAME = retrieveConfigValue("PACKAGE_NAME", "autoflow");
export const LOGS_ENABLED_STRING = retrieveConfigValue("LOGS_ENABLED", "true");
export const MAX_TASK_CHARS_STRING = retrieveConfigValue(
  "MAX_TASK_CHARS",
  "1000"
);

// Computed configuration values
export const MAX_TASK_CHARS = parseInt(MAX_TASK_CHARS_STRING);
export const WEBSOCKET_URL = `${WEBSOCKET_PROTOCOL}://${WEBSOCKET_HOST}/ws/socket-server/?key=${TOKEN}`;
export const LOGS_ENABLED = LOGS_ENABLED_STRING === "true";
