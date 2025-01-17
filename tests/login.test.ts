import { chromium, test } from "@playwright/test";
import { TOTP } from "totp-generator";

const digLoginUrl = "https://app.dig.security//";
const username = "parag@metronlabs.com";
const password = "dfxCksU0mwDw7dL_WDRx";
const locatorOTP = "[id='code']";


test("loginToDigSecurityPlatform", async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(digLoginUrl);

    // Fill in the username
    await page.locator("[name='username']").click();
    await page.locator("[name='username']").fill(username);
    await page.click("'Continue'");

    // Check for the invalid email error
    const invalidEmailError = await page.locator("text=Email is not valid.").isVisible();
    if (invalidEmailError) {
        throw new Error("Test aborted: Email is not valid.");
    }

    // Fill in the password
    await page.locator("[id='password']").click();
    await page.locator("[id='password']").fill(password);
    await page.click("'Continue'");

    const invalidPasswordError = await page.locator("text=Wrong email or password").isVisible();
    if (invalidPasswordError) {
        throw new Error("Test aborted: Password is not valid.");
    }

    if (await page.getByText("Verify Your Identity").isVisible()) {
        console.log("Username and Password are correct.")
    }

    while (true) {
        const { otp, expires } = TOTP.generate("KA7GK6RYIIRTCZTJMF5VIZBPERRTKSTR")
        await page.locator(locatorOTP).click();
        await page.locator(locatorOTP).fill(otp);
        await page.click("'Continue'");
        await page.waitForTimeout(3000);
        if (await page.getByText(username)) {
            break;
        }

    }
    // Add a small delay for any post-login processing
    await page.waitForTimeout(3000);

    // Close browser
    await browser.close();


})