import type { Page, ElementHandle, Frame, ScrollDirection } from "./types.js";
import * as cdp from "./cdp.js";

export const clickElementById = async (
  page: Page,
  args: { id: string }
): Promise<void> => {
  const { centerX, centerY } = await cdp.getElementPosition(page, {
    backendNodeId: parseInt(args.id),
  });
  await handleElementClick(page, { x: centerX, y: centerY });
};

export const clickAndInputOnElementById = async (
  page: Page,
  args: { id: string; value: string }
) => {
  const { centerX, centerY } = await cdp.getElementPosition(page, {
    backendNodeId: parseInt(args.id),
  });
  await handleInputAtLocation(page, {
    x: centerX,
    y: centerY,
    value: args.value,
  });
};

export const handleHoverAction = async (
  page: Page,
  args: { x: number; y: number }
) => {
  const { element, tagName, isCustomElement } = await ElementLocationInfo(
    page,
    args
  );
  if (!element || tagName === "CANVAS" || isCustomElement) {
    await moveMouseToCoordinates(page, args);
  } else {
    await performHoverAction(page, { element });
  }
};
// Actions using CDP Element
export const hoverElementById = async (
  page: Page,
  args: { id: string }
): Promise<void> => {
  const { centerX, centerY } = await cdp.getElementPosition(page, {
    backendNodeId: parseInt(args.id),
  });
  await handleHoverAction(page, { x: centerX, y: centerY });
};

// Actions using Location

export const handleElementClick = async (
  page: Page,
  args: { x: number; y: number }
): Promise<void> => {
  const { element, tagName, isCustomElement } = await ElementLocationInfo(
    page,
    args
  );
  if (!element || tagName === "CANVAS" || isCustomElement) {
    await click(page, args);
  } else {
    await performHoverAndClick(page, { element });
  }
};

export const handleInputAtLocation = async (
  page: Page,
  args: { x: number; y: number; value: string }
): Promise<void> => {
  const { element, isCustomElement, tagName } = await ElementLocationInfo(
    page,
    args
  );
  if (!element || isCustomElement) {
    await moveMouseToCoordinates(page, args);
    await click(page, args);
    await keypressSelectAll(page);
    await keypressBackspace(page);
    await input(page, args);
  } else if (tagName === "SELECT") {
    await performHoverClickAndSelectOption(page, {
      element,
      value: args.value,
    });
  } else {
    await performHoverClickAndInput(page, { element, value: args.value });
  }
};

// Actions using Element
export const performHoverAction = async (
  page: Page,
  args: { element: ElementHandle<Element> }
): Promise<void> => {
  await args.element.hover();
};

export const performHoverAndClick = async (
  page: Page,
  args: { element: ElementHandle<Element> }
): Promise<void> => {
  await args.element.hover();
  await args.element.click();
};

export const performHoverClickAndInput = async (
  page: Page,
  args: { element: ElementHandle<Element>; value: string }
) => {
  await args.element.hover();
  await args.element.click();
  await args.element.fill(args.value);
};

export const performHoverClickAndSelectOption = async (
  page: Page,
  args: { element: ElementHandle<Element>; value: string }
) => {
  await args.element.hover();
  await args.element.click();
  await args.element.selectOption(args.value);
};

// Actions using Device
export const moveMouseToCoordinates = async (
  page: Page,
  args: { x: number; y: number }
) => {
  await page.mouse.move(args.x, args.y);
};

export const click = async (page: Page, args: { x: number; y: number }) => {
  await page.mouse.move(args.x, args.y);
  await page.mouse.click(args.x, args.y);
};

export const input = async (page: Page, args: { value: string }) => {
  await page.keyboard.type(args.value);
};

export const keypressEnter = async (page: Page) => {
  await page.keyboard.press("Enter");
};

export const keypressSelectAll = async (page: Page) => {
  await page.keyboard.press("Meta+A");
};

export const keypressBackspace = async (page: Page) => {
  await page.keyboard.press("Backspace");
};

export const navigate = async (page: Page, args: { url: string }) => {
  await page.goto(args.url);
};

// Actions using Script
export const performScrollAction = async (
  page: Page,
  args: { target: ScrollDirection }
) => {
  await page.evaluate((evalArgs) => {
    // The viewport should be defined, but if it somehow isn't pick a reasonable default
    const viewportHeight = window.visualViewport?.height ?? 720;
    // For relative scrolls, attempt to scroll by 75% of the viewport height
    const relativeScrollDistance = 0.75 * viewportHeight;
    const elementToScroll = document.scrollingElement || document.body;

    switch (evalArgs.target) {
      case "top":
        return elementToScroll.scrollTo({ top: 0 });
      case "bottom":
        return elementToScroll.scrollTo({ top: elementToScroll.scrollHeight });
      case "up":
        return elementToScroll.scrollBy({ top: -relativeScrollDistance });
      case "down":
        return elementToScroll.scrollBy({ top: relativeScrollDistance });
      default:
        throw Error(`Unsupported scroll target ${evalArgs.target}`);
    }
  }, args);
};

// Meta
export const retrieveViewportMetadata = async (page: Page) => {
  const metaData = await page.evaluate(() => {
    return {
      viewportWidth: window.visualViewport?.width || 0,
      viewportHeight: window.visualViewport?.height || 0,
      pixelRatio: window.devicePixelRatio,
    };
  });

  return metaData;
};

interface PageSnapshot {
  dom: string;
  screenshot: string;
  viewportWidth: number;
  viewportHeight: number;
  pixelRatio: number;
  layoutMetrics: any;
}

export const capturePageSnapshot = async (
  page: Page
): Promise<PageSnapshot> => {
  const domSnapshotPromise = cdp
    .captureDOMSnapshot(page)
    .then((snapshot) => JSON.stringify(snapshot));
  const screenshotPromise = page
    .screenshot({ scale: "css" })
    .then((screenshotData) => screenshotData.toString("base64"));
  const layoutMetricsPromise = cdp.getPageLayoutMetrics(page);
  const viewportPromise = retrieveViewportMetadata(page);

  const [
    dom,
    screenshot,
    { viewportWidth, viewportHeight, pixelRatio },
    layoutMetrics,
  ] = await Promise.all([
    domSnapshotPromise,
    screenshotPromise,
    viewportPromise,
    layoutMetricsPromise,
  ]);

  return {
    dom,
    screenshot,
    viewportWidth,
    viewportHeight,
    pixelRatio,
    layoutMetrics,
  };
};

export const ElementLocationInfo = async (
  context: Page | Frame | ElementHandle<ShadowRoot>,
  args: { x: number; y: number; isShadowRoot?: boolean }
): Promise<{
  element: ElementHandle<Element> | null;
  tagName: string | null;
  isCustomElement: boolean | null;
}> => {
  const { x, y, isShadowRoot } = args;
  const evaluatedHandle = isShadowRoot
    ? await (context as ElementHandle<ShadowRoot>).evaluateHandle(
        (e, { x, y }) =>
          Reflect.has(e, "elementFromPoint") ? e.elementFromPoint(x, y) : null,
        args
      )
    : await (context as Page | Frame).evaluateHandle(
        ({ x, y }) => document.elementFromPoint(x, y),
        args
      );

  const element = evaluatedHandle.asElement();
  if (!element) {
    return { element: null, tagName: null, isCustomElement: false };
  }

  const tagName = (await element.getProperty("tagName"))?.toString();
  const isCustomElement = tagName.includes("-");

  if (tagName === "IFRAME") {
    const frame = await element.contentFrame();
    if (frame) {
      const boundingClientRect = await element.evaluate((node) =>
        node.getBoundingClientRect()
      );
      return await ElementLocationInfo(frame, {
        x: args.x - boundingClientRect.x,
        y: args.y - boundingClientRect.y,
      });
    }
  }

  if (isCustomElement) {
    const shadowRootHandle = await element.evaluateHandle((e) => e.shadowRoot);
    const shadowRoot = shadowRootHandle.asElement();
    if (shadowRoot) {
      return await ElementLocationInfo(shadowRoot, {
        x: args.x,
        y: args.y,
        isShadowRoot: true,
      });
    }
  }

  return {
    element,
    tagName,
    isCustomElement,
  };
};
