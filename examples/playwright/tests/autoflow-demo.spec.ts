import { test, expect } from '@playwright/test';
import { autoflow } from '../../../packages/playwright/src';

test.describe('GitHub', () => {
  test('verify the number of labels in a repo', async ({ page }) => {
    await page.goto('https://github.com/AutoFlowLabs/autoflow');
    await autoflow(`Click on the 'Issues' tabs`, { page, test }, 'action');
    await page.waitForURL('https://github.com/AutoFlowLabs/autoflow/issues');
    // Alternatively: await autoflow('Click on Labels', { page, test }, 'action');
    await page
      .locator('[role="search"] a[href="/AutoFlowLabs/autoflow/labels"]')
      .click();
    await page.waitForURL('https://github.com/AutoFlowLabs/autoflow/labels');
    const numLabels = (await autoflow(
      'How many labels are listed?',
      { page, test },
      'query'
    )) as string;
    expect(parseInt(numLabels)).toEqual(9);
  });
});

test.describe('lobster', () => {
  test('Lobster Recent Stories Count', async ({ page }) => {
    await page.goto('https://lobste.rs/');
    await autoflow(`click on the 'recent' tab`, { page, test }, 'action');
    await page.waitForURL('https://lobste.rs/recent');
    const numStories = (await autoflow(
      'How many stories are listed?',
      { page, test },
      'query'
    )) as string;
    expect(parseInt(numStories)).toEqual(10);
  });
});

const firstNameForSauce = 'jon';
const lastNameForSauce = 'doe';
const zipForSauce = '335001';

test.describe('saucedemo', () => {
  test('Shopping and Checkout', async ({ page }) => {
    await page.goto('https://www.saucedemo.com/');

    await autoflow(
      `Fill the 'username' with a standard_user'`,
      { page, test },
      'action'
    );

    await autoflow(
      `Fill the 'password' with secret_sauce'`,
      { page, test },
      'action'
    );
    await autoflow(`click on the login button`, { page, test }, 'action');
    await page.waitForURL('https://www.saucedemo.com/inventory.html');
    await autoflow(
      `click 'add to cart' button of item with name 'Sauce Labs Backpack'`,
      { page, test },
      'action'
    );
    await autoflow(
      `click 'add to cart' button of item with name 'Sauce Labs Bike Light'`,
      { page, test },
      'action'
    );
    //  Alternatively: const shoppingCartLink = await page.waitForSelector('.shopping_cart_link');
    // await shoppingCartLink.click();
    await autoflow(`Click the 'shopping cart icon'`, { page, test }, 'action');

    await page.waitForURL('https://www.saucedemo.com/cart.html');
    await autoflow(`click the 'checkout' button`, { page, test }, 'action');
    await page.waitForURL('https://www.saucedemo.com/checkout-step-one.html');
    await autoflow(
      `fill the 'first name' with ${firstNameForSauce}`,
      { page, test },
      'action'
    );
    await autoflow(
      `fill the 'last name' with ${lastNameForSauce}`,
      { page, test },
      'action'
    );
    await autoflow(
      `fill the 'zip/postal code' with ${zipForSauce}`,
      { page, test },
      'action'
    );
    await autoflow(`click the 'continue' button`, { page, test }, 'action');
    await page.waitForURL('https://www.saucedemo.com/checkout-step-two.html');
  });
});

test.describe('herokuapp', () => {
  test('add/remove elements', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/add_remove_elements/');
    await autoflow(
      `Click on the 'add element' button`,
      { page, test },
      'action'
    );
    await autoflow(`Click on the 'delete' button`, { page, test }, 'action');
  });
  test('number of checkboxes checked', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/checkboxes');
    await autoflow(`Click on the 'checkbox 1'`, { page, test }, 'action');
    await autoflow(`Click on the 'checkbox 2'`, { page, test }, 'action');
    await page.waitForTimeout(2000);
    const noOfCheckedCheckboxes = await autoflow(
      'how many checkboxes are checked?',
      { page, test },
      'query'
    );
    expect(parseInt(noOfCheckedCheckboxes)).toEqual(1);
  });
  test('elements rendered after action', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/dynamic_loading/2');
    await autoflow(`Click on the 'start' button`, { page, test }, 'action');
    await page.waitForTimeout(5000);
    const linkText = await autoflow(
      `Is there a hello world text written on this page?`,
      { page, test },
      'assert'
    );
    expect(linkText).toBe(true);
  });
  test('get the text in iframe', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/iframe');
    const text = await autoflow(
      `get the text in the iframe`,
      { page, test },
      'query'
    );
    console.log(text);
  });
  test('jquery-ui menu navigation', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/jqueryui/menu');
    await autoflow(`click on 'enabled' link`, { page, test }, 'action');
    await autoflow(
      `click on back to 'jquery ui' link`,
      { page, test },
      'action'
    );
  });
});
