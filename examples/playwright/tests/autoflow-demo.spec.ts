import { test, expect } from "@playwright/test";
import { autoflow } from "../../../packages/playwright/src";

test.describe("Calendly", () => {
  test("book the next available timeslot", async ({ page }) => {
    await page.goto("https://calendly.com/sahil-autoflow/interview");

    await page.waitForSelector('[data-testid="calendar"]');
    await autoflow("Close the privacy modal by Rejecting all cookies", { page, test }, "action");
    await autoflow("Click on the first day in the month with times available", { page, test }, "action");
    await autoflow("Select a timeslot from the sidebar having the role of listitem", { page, test }, "action");
    await page.locator('[data-container="selected-spot"] button:nth-of-type(2)').click();
    await autoflow("Fill out the name with 'John Smith'", { page, test }, "action");
    await autoflow("Fill out the email with 'contact@autoflowapp.com'", { page, test }, "action");
    await page.getByText("Schedule Event").click();

    const element = await page.getByText("You are scheduled");
    expect(element).toBeDefined();
  });
});
