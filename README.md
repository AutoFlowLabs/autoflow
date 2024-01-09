<div align="center">
  <picture>
    <source
      srcset="https://github.com/AutoFlowLabs/autoflow/assets/40566635/241de554-a5b1-4c78-8d8f-c356681b9d41"
      media="(prefers-color-scheme: dark)"
      height="400" width="400"
    />
    <img
      src="https://github.com/AutoFlowLabs/autoflow/assets/40566635/1a5de8c8-caa1-43d8-9b47-e62064d21a6d"
      alt="autoflow Logo"
      height="400" width="400"
    />
  </picture>
</div>

# AutoFlow

Add superpowers to your end-to-end tests with AutoFlow's open-source library. Learn more at https://autoflow.tools

## Setup

### 1. Install the @autoflow/playwright dependency

You can add the @autoflow/playwright package to your project by executing the following command in your terminal:

```sh
$ npm i @autoflow/playwright -D
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

Utilize and incorporate the `autoflow` function into your codebase by importing it as shown:

```ts
import { test } from "@playwright/test";
import { autoflow } from "@autoflow/playwright";

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

To employ the `autoflow()` function, you require a basic text prompt and an argument that includes your`page`and `test` objects. Moreover, it's crucial to specify a `flow` type, which presently includes support for action and query. The `assert` flow type will soon become available as well.

```ts
autoflow("<your prompt>", { page, test }, "<flow type>");
```

### Supported Browsers

The functionality provided by this package is limited to performing `autoflow()` actions exclusively within Chromium browsers

### Additional Options

You have the option to include additional settings as a third argument

```ts
const options = {
  debug: boolean, // If true, debugging information is returned from the autoflow() call.
  parallelism: number, // The number of prompts that will be run in a chunk, applies when passing an array of prompts to autoflow(). Defaults to 10.
  failImmediately: boolean, // If true and an array of prompts was provided, the function will throw immediately if any prompt throws. Defaults to false.
};

autoflow("<your prompt>", { page, test }, "<flow type>", options);
```

### Flow Types (Supported Actions & Return Values)

Various behaviors and return types exist depending on the specified or inferred `type` of action within the autoflow function

**Action**: An action, such as a "click," represents a simulated user interaction with the webpage, like clicking a link. If necessary, it will scroll to accomplish the designated task but prioritizes elements visible in the current viewport. Successful actions will return undefined, while failures will trigger an error, as shown below:

```ts
try {
  await autoflow("Click the link", { page, test }, "action", options);
} catch (e) {
  console.error("Failed to click the link");
}
```

Action prompts will result in one or multiple browser actions, including:

Clicking elements
Inputting text
Pressing the 'Enter' key
Navigating to a new URL
However, certain browser actions like drag-and-drops and file uploads are not currently compatible or supported.

**Query**: A query will provide requested data from the visible section of the page as a string, for instance:

```ts
const linkText = await autoflow(
  "Get the text of the first link",
  { page, test },
  "query"
);
console.log("The link text is", linkText);
```

**Assert**: COMING SOON! Stay tuned for updates!

## Examples

Within this repository, there exists a demo allowing quick experimentation with the `autoflow()` function. To begin using it, follow these steps

1. Construct the local version of the autoflow/playwright package.

```sh
cd packages/playwright
npm install
npm run build
```

2. Install the autoflow/playwright dependency within the examples directory.

```sh
cd ../../examples/playwright
npm install
```

3.  Make the `AUTOFLOW_TOKEN` environment variable or configuration value accessible (refer to the "Setup" section above).
4.  Run the tests, with or without UI mode

Without UI Mode
```sh
$ npm run test
```

With UI Mode
```sh
$ npm run test-ui
```

## Guide

To ensure your prompts function correctly, here are recommended best practices for Autoflow AI prompts

- Construct prompts using complete English sentences without spelling or grammatical errors.
- Enclose any text that should display precisely as stated within quotation marks. For instance, `Click on the "Login" button`
- Avoid incorporating CSS/XPath selectors or any implementation-level specifics in your prompts.
- Avoid merging multiple instructions within a single prompt. For instance, refrain from phrases like 'Type in the "Search bar" and then click on the "Menu"'. Instead, ensure that each prompt distinctly focuses on one action or query.
- Create prompts that match your specific needs. Having a bit of uncertainty can be okay and sometimes even preferred. For instance, a prompt like `Find and click the "Learn More" button` remains effective even if there are multiple buttons with that label or if the page has undergone a complete redesign.

<br>
<br>
