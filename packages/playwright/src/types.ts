import { type TestType } from "@playwright/test";
import { type Page } from "@playwright/test";

export { type TestType } from "@playwright/test";
export { type Page, type ElementHandle, type Frame } from "@playwright/test";

export type SimplifiedPage = Pick<Page, "mouse" | "keyboard">;
export type SimplifiedTestType = Pick<TestType<any, any>, "step">;

// Step-specific types
export type ScrollDirection = "up" | "down" | "bottom" | "top";

export type FlowType = "action" | "query" | "assert";

export type FlowOptions = {
  debug?: boolean;
};

export type AutoFlowMessage = {
  type: "task-start";
  packageVersion?: string;
  taskId?: string;
  task: string;
  snapshot: {
    dom: string;
    screenshot: string;
    pixelRatio: number;
    viewportWidth: number;
    viewportHeight: number;
  };
  flowType?: FlowType,
  options?: FlowOptions;
};

// This message is sent to the client, signaling execution is complete.
export type TaskCompletionStatus = {
  type: "task-complete";
  taskId?: string;
  wasSuccessful: Boolean;
  result?: {
    actions?: ("click" | "input" | "hover" | "keypress" | "navigate")[];
    assertion?: boolean;
    query?: string;
  };

  errorMessage?: string;
};

// This message is sent to the client asking them to perform some command in the browser.
export type ClientCommandRequest = {
  type: "command-request";
  taskId?: string;
  index: number;
  name: string;
  arguments: Record<string, any>;
};

// This message is sent from the client in response to the ClientCommandRequestand contains the result of the command.
export type ClientCommandResponse = {
  type: "command-response";
  packageVersion?: string;
  taskId?: string;
  index: number;
  result: any;
};

export type ExecutionOptions = {
  // Specific to the package, sets the max number of steps we'll execute
  // in parallel when autoflow() is called with an array of tasks
  parallelism?: number;
  // If true, the autoflow() step will fail immediately once any step fails
  // rather than waiting for other tasks to resolve.
  failImmediately?: boolean;
};