import { test, expect } from "@playwright/test";
import { autoflow } from "../../../packages/playwright/src";

test.describe('GitHub', () => {
  test('verify the number of labels in a repo', async ({ page }) => {
    await page.goto('https://github.com/AutoFlowLabs/autoflow')
    await autoflow(`Click on the Issues tabs`, { page, test }, "action")
    await page.waitForURL('https://github.com/AutoFlowLabs/autoflow/issues')
    // Alternatively: await ai('Click on Labels', { page, test })
    await page.locator('[role="search"] a[href="/AutoFlowLabs/autoflow/labels"]').click()
    await page.waitForURL('https://github.com/AutoFlowLabs/autoflow/labels')
    const numLabels = await autoflow('How many labels are listed?', { page, test }, "query") as string
    expect(parseInt(numLabels)).toEqual(9)
  })
})
