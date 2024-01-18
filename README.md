<div align="center">
  <picture>
    <source
      srcset="https://github.com/AutoFlowLabs/autoflow/assets/40566635/6cc95ead-0fea-49f9-b58d-cc5d4720c0fe"
      media="(prefers-color-scheme: dark)"
      alt="Autoflow Logo"
      height="100" width="400"
    />
    <img
      src="https://github.com/AutoFlowLabs/autoflow/assets/40566635/5592e09e-eea8-4c93-9051-c47b1f55495e"
      alt="Autoflow Logo"
      height="100" width="400"
    />
  </picture>
</div>

---
# AutoFlow

Add superpowers to your end-to-end tests with AutoFlow's open-source library. Learn more at https://autoflow.tools

## Setup

### 1. Install the @autoflowlabs/playwright dependency

You can add the @autoflowlabs/playwright package to your project by executing the following command in your terminal:

```sh
$ npm i @autoflowlabs/playwright -D
```


### 2. Setting up the API Key/Token
This library requires access to a specific environment variable that contains your AutoFlow token, which is essential for the playwright process. This token can be found in your account on https://autoflow.tools. You can expose this variable in various ways. One option is to set it as an environment variable, as demonstrated below:

 ```sh
 $ export AUTOFLOW_TOKEN="<your token here>"
 ```

Alternatively, you can store this token in a configuration file named `autoflow.config.json` located in your project's root directory, structured like this:

 ```json
 {
   "TOKEN": "<your token here>"
 }
 ```

### 3. Get Set Flow!

Utilize and incorporate the `autoflow()` function into your codebase by importing it as shown:

```ts
import { test } from "@playwright/test";
import { autoflow } from "@autoflowlabs/playwright";

test("autoflow example", async ({ page }) => {
  await page.goto("https://google.com/");

  // An object with page and test must be passed into every call
  const testArgs = { page, test };
  const searchButtonText = await autoflow("Get the search button text", testArgs, "query");
  await page.goto("https://google.com/");
  await autoflow(`Type "${searchButtonText}" in the search box`, testArgs, "action");
  await autoflow("Press enter", testArgs, "action");
});
```

## Usage

To employ the `autoflow()` function, you require a basic text prompt and an argument that includes your`page`and `test` objects. 

Moreover, you can also specify a `flowType`, which presently includes support for `action`, `query` and `assert`.

```ts
autoflow("<your prompt>", { page, test }, "<flow type (optional)>");
```

## Supported Browsers

The functionality provided by this package is limited to performing `autoflow()` actions exclusively within Chromium browsers.

## Type of Flows

There are 3 types of `flowType` supported. If a `flowType` is not provided, it is inferred from the statement.

Example 
- With `flowType`
```ts
await autoflow("Click the link", { page, test }, "action");
```

- With implicit `flowType`
```ts
await autoflow("Click the link", { page, test });
```


### 1. Action
Return Type: `undefined`

An action, such as a "click," represents a simulated user interaction with the webpage, like clicking a link. If necessary, it will scroll to accomplish the designated task but prioritizes elements visible in the current viewport. Successful actions will return undefined, while failures will trigger an error, as shown below:

```ts
try {
  await autoflow("Click the link", { page, test }, "action");
} catch (e) {
  console.error("Failed to click the link");
}
```

Action prompts will result in one or multiple browser actions, including:

- Clicking elements
- Inputting text
- Pressing the 'Enter' key
- Navigating to a new URL

### 2. Query
Return Type: `string`

A query will provide requested data from the visible section of the page as a string, for instance:

```ts
const linkText = await autoflow(
  "Get the text of the first link", { page, test }, "query");
console.log("The link text is", linkText);
```

### 3. Assert
Return Type: `bool`

Assert will evaluate whether something exists on the page and return a `true` or `false`

```ts
const linkText = await autoflow(
  "Is there a dog on this page?", { page, test }, "assert");
console.log("The link text is", linkText);
```


> It must be noted that the assert is more inclined towards how something looks or whether something is present on the page or not VS query is about how something reads.

## Don't have tests yet? Test out AutoFlow on examples

Within this repository, there exists a demo allowing quick experimentation with the `autoflow()` function. To begin using it, follow these steps:

1. Build the local version of the @autoflow/playwright package.

```sh
cd packages/playwright
npm install
npm run build
```

2. Install the @autoflow/playwright dependency within the examples directory.

```sh
cd ../../examples/playwright
npm install
```

3.  Make the `AUTOFLOW_TOKEN` environment variable or configuration value accessible (refer to the "Setup" section above).

4.  Run the tests, with or without UI mode

### Without UI Mode
```sh
$ npm run test
```


### With UI Mode
```sh
$ npm run test-ui
```
This is an alias for `npx playwright test --ui`

## Tips

- If the Chromium binary is not already installed, utilize the following command to install the necessary browsers.
```sh
$ npx playwright install
```


- To ensure your prompts function correctly, here are recommended best practices for Autoflow AI prompts

  - Construct prompts using complete English sentences. Minute grammatical errors are allowed but should be avoided
  - Enclose any text that should display precisely as stated within quotation marks. For instance, `Click on the "Login" button`
  - Avoid incorporating CSS/XPath selectors or any implementation-level specifics in your prompts.
  - Create prompts that match your specific needs. Having a bit of uncertainty can be okay and sometimes even preferred. For instance, a prompt like `Find and click the "Learn More" button` remains effective even if there are multiple buttons with that label or if the page has undergone a complete redesign.
  - A single prompt should have a single instruction. Avoid merging multiple instructions within a single prompt. For instance, refrain from phrases like 'Type in the "Search bar" and then click on the "Menu"'. Instead, ensure that each prompt distinctly focuses on one action or query.


