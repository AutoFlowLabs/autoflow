import { uuidv7 } from "uuidv7";
import * as cdp from "./cdp.js";
import * as playwright from "./playwright.js";
import * as webSocket from "./webSocket.js";
import * as meta from "./meta.js";
import { PACKAGE_NAME, MAX_TASK_CHARS, TOKEN } from "./config.js";
import type {
  SimplifiedPage,
  SimplifiedTestType,
  Page,
  TestType,
  ScrollDirection,
  ClientCommandRequest,
  ClientCommandResponse,
  TaskCompletionStatus,
  AutoFlowMessage,
  FlowOptions,
  ExecutionOptions
} from "./types.js";

interface AutoflowOptions extends ExecutionOptions, FlowOptions {}
/**
 * Executes the provided plain-english task. If an array of tasks is provided
 * as the first argument, tasks will be bundled according to the options.parallelism
 * value (default=10) and executed in parallel. The promise will resolve once all
 * provided tasks have completed
 */
export const autoflow = async (
  task: string | string[],
  configuration: { page: SimplifiedPage; test: SimplifiedTestType },
  options?: AutoflowOptions
): Promise<any> => {
  if (!configuration || !configuration.page || !configuration.test) {
    throw new Error(
      "The necessary { page, test } argument is absent in the autoflow() function."
    );
  } else if (Array.isArray(task)) {
    return runInParallel(task, configuration, options);
  }

  // Generate a unique ID that all messages in this exchange will use
  const taskId = uuidv7();

  const { test, page } = configuration as {
    page: Page;
    test: TestType<any, any>;
  };

  return new Promise((resolve, reject) => {
    test.step(`${PACKAGE_NAME}.tools '${task}'`, async () => {
      if (!TOKEN) {
        reject(
          constructErrorMessage({
            message:
              "To run autoflow steps, it's necessary to define either the $AUTOFLOW_TOKEN " +
              'environment variable or provide a autoflow.config.json file containing a "TOKEN" field. ' +
              "You can generate your API key by signing up for an account at https://autoflow.tools",
          })
        );
        return;
      } else if (task.length > MAX_TASK_CHARS) {
        reject(
          constructErrorMessage({
            message: `Provided task string is too long, max length is ${MAX_TASK_CHARS} chars`,
          })
        );
        return;
      }

      await initiateTask(page, task, taskId, options);
      const taskCompleteResponse = await executeTaskCommands(
        page,
        test,
        taskId
      );
      const taskResult = taskCompleteResponse.result;

      if (options?.debug) {
        resolve(taskCompleteResponse);
      } else if (taskCompleteResponse.errorMessage) {
        reject(
          constructErrorMessage({
            message: taskCompleteResponse.errorMessage,
            taskId: taskId,
          })
        );
      } else if (!taskResult && taskCompleteResponse.wasSuccessful === false) {
        reject(
          constructErrorMessage({
            message:
              "An unknown error occurred when trying to run the autoflow step",
            taskId: taskId,
          })
        );
      } else if (!taskResult) {
        resolve(undefined);
      } else if (taskResult.assertion !== undefined) {
        resolve(taskResult.assertion);
      } else if (taskResult.query !== undefined) {
        resolve(taskResult.query);
      } else if (
        taskResult.actions !== undefined &&
        taskCompleteResponse.wasSuccessful === false
      ) {
        reject(
          constructErrorMessage({
            message: "Could not execute autoflow step as action",
            taskId: taskId,
          })
        );
      } else {
        resolve(undefined);
      }
    });
  }).catch((e) => {
    return test.step(e, async () => {
      console.error(e);
      throw e;
    });
  });
};

interface ErrorMessageOptions {
  message: string;
  taskId?: string;
}

export const constructErrorMessage = (options: ErrorMessageOptions): string => {
  const { message, taskId } = options;
  const prefix = `${PACKAGE_NAME}.error '${message}'. Version:${meta.getVersion()}`;

  if (taskId) {
    return `${prefix} TaskId:${taskId}`;
  } else {
    return prefix;
  }
};

/**
 * Sends a message over the websocket to begin an autoflow task.
 */
const initiateTask = async (
  page: Page,
  task: string,
  taskId: string,
  options?: FlowOptions
): Promise<void> => {
  const snapshot = await playwright.capturePageSnapshot(page);
  const taskStartMessage: AutoFlowMessage = {
    type: "task-start",
    packageVersion: meta.getVersion(),
    taskId,
    task,
    snapshot,
    options,
  };

  await webSocket.sendMessageOverWebSocket(taskStartMessage);
};

/**
 * Sends a message over the websocket in response to an autoflow command completing.
 */
const sendCommandResponse = async (
  index: number,
  taskId: string,
  result: any
): Promise<void> => {
  const responseMessage: ClientCommandResponse = {
    type: "command-response",
    packageVersion: meta.getVersion(),
    taskId,
    index,
    result:
      result === undefined || result === null ? "null" : JSON.stringify(result),
  };

  await webSocket.sendMessageOverWebSocket(responseMessage);
};

/**
 * Listens for websocket commands, executes them, then responds in a promise that
 * is resolved once we see the task-complete message.
 */
const executeTaskCommands = async (
  page: Page,
  test: TestType<any, any>,
  taskId: string
) => {
  return new Promise<TaskCompletionStatus>((resolve) => {
    webSocket.addWebSocketMessageListener(taskId, (data, removeListener) => {
      // Only respond to messages corresponding to the task for which this
      // listener was bound.
      if (!data.taskId || data.taskId === taskId) {
        switch (data.type) {
          case "command-request":
            const prettyCommandName = getPrettyCommandName(data.name);
            try {
              // Code throwing an exception
              test.step(`${PACKAGE_NAME}.action ${prettyCommandName}`, async () => {
                const result = await executeCommand(page, data);
                await sendCommandResponse(data.index, taskId, result);
              });
            } catch (e) {
              console.log((e as Error).stack);
            }

            break;
          case "task-complete":
            removeListener();
            // If there was a response in the completion, print it as
            // a test step in the actions list.
            if (data.result?.assertion !== undefined) {
              test.step(`${PACKAGE_NAME}.assertion ${data.result.assertion}`, async () => {
                resolve(data);
              });
            } else if (data.result?.query !== undefined) {
              test.step(`${PACKAGE_NAME}.response ${data.result.query}`, async () => {
                resolve(data);
              });
            } else {
              resolve(data);
            }
            break;
        }
      }
    });
  });
};

/**
 * Executes a webdriver command passed over the websocket using CDP.
 */
const executeCommand = async (
  page: Page,
  command: ClientCommandRequest
): Promise<any> => {
  switch (command.name) {
    // CDP
    case "getDOMSnapshot":
      return await cdp.captureDOMSnapshot(page);

    // Queries
    case "captureSnapshot":
      return await playwright.capturePageSnapshot(page);

    // Actions using CDP Element
    case "clickElement":
      return await playwright.clickElementById(
        page,
        command.arguments as { id: string }
      );
    case "sendKeysToElement":
      return await playwright.clickAndInputOnElementById(
        page,
        command.arguments as { id: string; value: string }
      );
    case "hoverElement":
      return await playwright.hoverElementById(
        page,
        command.arguments as { id: string }
      );
    case "scrollElement":
      return await cdp.scrollElement(
        page,
        command.arguments as {
          elementId: string;
          scrollDirection: ScrollDirection;
        }
      );

    // Actions using Location
    case "clickLocation":
      return await playwright.handleElementClick(
        page,
        command.arguments as { x: number; y: number }
      );
    case "hoverLocation":
      return await playwright.handleHoverAction(
        page,
        command.arguments as { x: number; y: number }
      );
    case "clickAndInputLocation":
      return await playwright.handleInputAtLocation(
        page,
        command.arguments as { x: number; y: number; value: string }
      );
    case "getElementAtLocation":
      return await playwright.ElementLocationInfo(
        page,
        command.arguments as { x: number; y: number }
      );

    // Actions using Device
    case "sendKeys":
      return await playwright.input(
        page,
        command.arguments as { value: string }
      );
    case "keypressEnter":
      return await playwright.keypressEnter(page);
    case "navigate":
      return await playwright.navigate(
        page,
        command.arguments as { url: string }
      );

    // Actions using Script
    case "scrollPage":
      return await playwright.performScrollAction(
        page,
        command.arguments as { target: ScrollDirection }
      );

    default:
      throw Error(`Unsupported command ${command.name}`);
  }
};

/**
 * Runs the provided tasks in parallel by chunking them up according to the
 * `parallelism` option and waiting for all chunks to complete.
 */
const runInParallel: typeof autoflow = async (
  tasks,
  configuration,
  options
) => {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    Promise.reject("Empty task list, nothing to do");
  }

  const parallelism = options?.parallelism || 10;
  const failImmediately = options?.failImmediately || false;
  const tasksArray = tasks as string[];
  const allValues: any[] = [];

  for (let i = 0; i < tasksArray.length; i += parallelism) {
    const taskPromises = tasksArray
      .slice(i, i + parallelism)
      .map((_) => autoflow(_, configuration, options));

    if (failImmediately) {
      const values = await Promise.all(taskPromises);
      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        allValues.push(value);
      }
    } else {
      const results = await Promise.allSettled(taskPromises);
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        allValues.push(result.status === "fulfilled" ? result.value : result);
      }
    }
  }

  return allValues;
};

const getPrettyCommandName = (rawCommandName: string) => {
  switch (rawCommandName) {
    case "clickElement":
    case "clickLocation":
      return "click";
    case "sendKeysToElement":
    case "clickAndInputLocation":
    case "sendKeys":
      return "input";
    case "hoverElement":
    case "hoverLocation":
      return "hover";
    case "getElementAtLocation":
      return "getElement";
    case "keypressEnter":
      return "pressEnter";
    case "getDOMSnapshot":
    case "snapshot":
      return "analyze";
    default:
      return rawCommandName;
  }
};
