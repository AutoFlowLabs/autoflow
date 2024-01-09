import WebSocket from "ws";
import { WEBSOCKET_URL, LOGS_ENABLED } from "./config.js";
import type {
  ClientCommandRequest,
  ClientCommandResponse,
  TaskCompletionStatus,
  AutoFlowMessage,
} from "./types.js";

let activeWebSocket: null | WebSocket = null;

/**
 * Closes the websocket connection and clears the global shared reference
 */
export const closeWebSocketConnection = async (): Promise<void> => {
  if (activeWebSocket) {
    activeWebSocket.close();
    activeWebSocket = null;
  }
};

/**
 * Returns a stable reference to a WebSocket connected to the AutoFlow server.
 */
export const establishWebSocketConnection = async (): Promise<WebSocket> => {
  const promise = new Promise<WebSocket>((resolve, reject) => {
    if (!activeWebSocket) {
      activeWebSocket = new WebSocket(WEBSOCKET_URL);
    }

    const ws = activeWebSocket as WebSocket;

    if (ws.readyState === ws.OPEN) {
      resolve(ws);
    } else {
      ws.addEventListener("error", (event: any) => {
        if (event.error.toString().endsWith("403")) {
          reject(
            "Authentication failed. Make sure the $AUTOFLOW_TOKEN environment variable matches " +
              "the one in your account at https://autoflow.tools"
          );
        }
        else if (event.message.endsWith("401")) {
          reject(
            "Authentication failed. Make sure the $AUTOFLOW_TOKEN environment variable matches " +
              "the one in your account at https://autoflow.tools"
          );
        } else {
          reject("An unknown error occurred.");
        }
      });
      ws.addEventListener("open", (event: any) => {
        resolve(ws);
      });
    }
  });

  return promise;
};

/**
 * Sends a message over the autoflow WebSocket
 */
export const sendMessageOverWebSocket = async (
  message: AutoFlowMessage | ClientCommandResponse
): Promise<void> => {
  const webSocket = await establishWebSocketConnection();
  const serializedMessage = JSON.stringify(message);
  if (LOGS_ENABLED) {
    console.log(`> ws send:`, serializedMessage.slice(0, 250));
  }
  webSocket.send(serializedMessage);
};

/**
 * Adds an event listener for message events emitted by the WebSocket. The
 * callback receives a parsed object from the message's `data` field. Returns
 * a functions that will remove the listener.
 */
export const addWebSocketMessageListener = async (
  taskId: string,
  handler: (
    data: TaskCompletionStatus | ClientCommandRequest,
    removeListener: () => void
  ) => void
): Promise<void> => {
  const webSocket = await establishWebSocketConnection();

  const removeListener = () =>
    webSocket.removeEventListener("message", messageListener);

  const messageListener = (message: WebSocket.MessageEvent) => {
    const data = message.data as any;
    const parsedData = JSON.parse(data) as
      | TaskCompletionStatus
      | ClientCommandRequest;
    if (LOGS_ENABLED && taskId === parsedData.taskId) {
      console.log(`< ws recv:`, JSON.stringify(parsedData).slice(0, 250));
    }
    handler(parsedData, removeListener);
  };

  webSocket.addEventListener("message", messageListener);
};
