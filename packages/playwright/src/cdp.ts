import type { Page, ScrollDirection } from "./types.js";

let pageToCDPSessionMap = new Map<Page, CDPSession>();

/**
 * Closes the cdp session and clears the global shared reference. This
 * happens automatically when a page closes in a playwright test, so
 * should generally not be necessary.
 */
export const detachCDPSessionIfExist = async (page: Page): Promise<void> => {
  if (pageToCDPSessionMap.has(page)) {
    const session = pageToCDPSessionMap.get(page)!; // Renamed for clarity
    await session.detach();
    pageToCDPSessionMap.delete(page);
  }
};

/**
 * Returns a stable reference to a CDP session.
 */
export const createOrRetrieveCDPSession = async (
  page: Page
): Promise<CDPSession> => {
  if (!pageToCDPSessionMap.has(page)) {
    try {
      const session = await page.context().newCDPSession(page);
      pageToCDPSessionMap.set(page, session);
    } catch (e) {
      throw new Error(
        "The autoflow() function can only be run against Chromium browsers."
      );
    }
  }

  return pageToCDPSessionMap.get(page)!;
};

export const capturePageScreenshot = async (page: Page): Promise<string> => {
  const cdProtocol = await createOrRetrieveCDPSession(page);
  const screenshot = await cdProtocol.send("Page.captureScreenshot");
  return screenshot.data; // Base64-encoded image data
};

export const scrollElement = async (
  page: Page,
  args: { elementId: string; scrollDirection: ScrollDirection }
): Promise<void> => {
  if (!args || !args.elementId || !args.scrollDirection) {
    throw new Error("Please provide a valid element ID and scroll direction.");
  }

  const scrollFunction = `function() {
    let scrollElement = this;
    let elementHeight = 0;

    switch (scrollElement.tagName) {
      case 'BODY':
      case 'HTML':
        scrollElement = document.scrollingElement || document.body;
        elementHeight = window.visualViewport?.height ?? 720;
        break;
      default:
        elementHeight = scrollElement.clientHeight ?? 720;
        break;
    }

    const relativeScrollDistance = 0.75 * elementHeight;

    switch ("${args.scrollDirection}") {
      case 'top':
        return scrollElement.scrollTo({ top: 0 });
      case 'bottom':
        return scrollElement.scrollTo({ top: scrollElement.scrollHeight });
      case 'up':
        return scrollElement.scrollBy({ top: -relativeScrollDistance });
      case 'down':
        return scrollElement.scrollBy({ top: relativeScrollDistance });
      default:
        throw new Error('Unsupported scroll direction ${args.scrollDirection}');
    }
  }`;

  await executeFunctionOnNode(page, {
    functionBody: scrollFunction,
    nodeId: parseInt(args.elementId),
  });
};

export const executeFunctionOnNode = async (
  page: Page,
  args: { functionBody: string; nodeId: number }
): Promise<void> => {
  if (!args || !args.functionBody || !args.nodeId) {
    throw new Error("Please provide a valid function body and node ID.");
  }

  const cdProtocol = await createOrRetrieveCDPSession(page);

  const {
    object: { objectId },
  } = await cdProtocol.send("DOM.resolveNode", {
    backendNodeId: args.nodeId,
  });

  await cdProtocol.send("Runtime.callFunctionOn", {
    functionDeclaration: args.functionBody,
    objectId,
  });
};

export const captureDOMSnapshot = async (page: Page): Promise<any> => {
  if (!page) {
    throw new Error("Please provide a valid page.");
  }

  const cdProtocol = await createOrRetrieveCDPSession(page);

  const domSnapshot = await cdProtocol.send("DOMSnapshot.captureSnapshot", {
    computedStyles: [
      "background-color",
      "visibility",
      "opacity",
      "z-index",
      "overflow",
    ],
    includePaintOrder: true,
    includeDOMRects: true,
  });

  return domSnapshot;
};

export const getPageLayoutMetrics = async (page: Page): Promise<any> => {
  if (!page) {
    throw new Error("Please provide a valid page.");
  }

  const cdProtocol = await createOrRetrieveCDPSession(page);

  const layoutMetrics = await cdProtocol.send("Page.getLayoutMetrics");

  return layoutMetrics;
};

export const simulateKeystrokes = async (
  page: Page,
  args: { elementId: string; keystrokes: string[] }
): Promise<boolean> => {
  if (
    !args ||
    !args.elementId ||
    !args.keystrokes ||
    args.keystrokes.length === 0
  ) {
    throw new Error(
      "Please provide a valid element ID and non-empty array of keystrokes."
    );
  }

  const cdpSession = await createOrRetrieveCDPSession(page);
  const firstKeystroke = args.keystrokes[0];

  const { nodeId } = await cdpSession.send("DOM.requestNode", {
    objectId: args.elementId,
  });

  await cdpSession.send("DOM.focus", { nodeId });

  for (let i = 0; i < firstKeystroke.length; i++) {
    await cdpSession.send("Input.dispatchKeyEvent", {
      type: "char",
      text: firstKeystroke[i],
    });
  }

  return true;
};

export const simulateElementClick = async (
  page: Page,
  args: { elementId: string }
): Promise<boolean> => {
  if (!args || !args.elementId) {
    throw new Error("Please provide a valid element ID.");
  }

  const cdpSession = await createOrRetrieveCDPSession(page);

  const { centerX, centerY } = await getElementPosition(page, {
    backendNodeId: parseInt(args.elementId),
  });

  await cdpSession.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: centerX,
    y: centerY,
    button: "left",
    clickCount: 1,
    buttons: 1,
  });

  await cdpSession.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: centerX,
    y: centerY,
    button: "left",
    clickCount: 1,
    buttons: 1,
  });

  return true;
};
interface ElementPosition {
  topLeftX: number;
  topLeftY: number;
  topRightX: number;
  topRightY: number;
  bottomRightX: number;
  bottomRightY: number;
  bottomLeftX: number;
  bottomLeftY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export const getElementPosition = async (
  page: Page,
  args: { backendNodeId: number }
): Promise<ElementPosition> => {
  if (!args || !args.backendNodeId) {
    throw new Error("Couldn't find the element to perform the action. Please check and try again.");
  }

  const cdpSession = await createOrRetrieveCDPSession(page);

  let quadsResponse = await cdpSession.send("DOM.getContentQuads", args);

  const [
    topLeftX,
    topLeftY,
    topRightX,
    topRightY,
    bottomRightX,
    bottomRightY,
    bottomLeftX,
    bottomLeftY,
  ] = quadsResponse.quads[0];

  const width = topRightX - topLeftX;
  const height = bottomRightY - topRightY;
  const centerX = topLeftX + width / 2;
  const centerY = topRightY + height / 2;

  return {
    topLeftX,
    topLeftY,
    topRightX,
    topRightY,
    bottomRightX,
    bottomRightY,
    bottomLeftX,
    bottomLeftY,
    width,
    height,
    centerX,
    centerY,
  };
};

export const focusOnElementByBackendNodeId = async (
  page: Page,
  args: { backendNodeId: number }
): Promise<void> => {
  if (!args || !args.backendNodeId) {
    throw new Error("Please provide a valid backend node ID.");
  }

  const cdpSession = await createOrRetrieveCDPSession(page);

  await cdpSession.send("DOM.focus", { backendNodeId: args.backendNodeId });
};

type CDPSession = Awaited<
  ReturnType<ReturnType<Page["context"]>["newCDPSession"]>
>;
