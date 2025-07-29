import { test, expect } from '@playwright/test';
import Logger from './Utills/logger.js';

// Maximize viewport for all tests
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

// =========================
// Utility Functions
// =========================

// Generates a random email for patient registration
  function randomEmail() {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let name = '';
    for (let i = 0; i < 8; i++) {
      name += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${name}${Math.floor(Math.random() * 10000)}@thinkitive.com`;
  }

// =========================
// Auth Helpers
// =========================

/**
 * Logs in to the application using the provided page instance.
 */
async function login(page) {
  Logger.info('Navigating to login page');
  await page.goto('https://stage_ketamin.uat.provider.ecarehealth.com/');
  await page.goto('https://stage_ketamin.uat.provider.ecarehealth.com/auth/login');
  await page.getByPlaceholder('Email').click();
  await page.getByPlaceholder('Email').fill('michael.huang@healthcaretest.com');
  await page.getByPlaceholder('Email').press('Tab');
  await page.getByPlaceholder('*********').fill('Admin@123');
  await page.getByRole('button', { name: 'Let\'s get Started' }).click();
  Logger.info('Logged in successfully');
}

/**
 * Logs out of the application using the provided page instance.
 */
async function logout(page) {
  Logger.info('Logging out');
  try {
    await expect(page.getByRole('img', { name: 'admin image' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('img', { name: 'admin image' }).click();
    await page.getByText('Log Out').click();
    await page.getByRole('button', { name: 'Yes,Sure' }).click();
    Logger.info('Logged out successfully');
  } catch (error) {
    Logger.warn('Logout skipped: page already closed or user menu not found.');
  }
}

// =========================
// Test 1: Patient Registration
// =========================
test.describe('Patient Registration - Mandatory Fields', () => {
  test('example - should successfully register a new patient with mandatory fields', async ({ page }) => {
    Logger.info('Starting patient registration test');
    // Step 1: Login
    await login(page);
    // Step 2: Wait for dashboard to load
    await page.waitForURL('**/scheduling/appointment');
    Logger.info('Dashboard loaded');
    // Step 3: Open Create > New Patient
    await page.locator('div').filter({ hasText: /^Create$/ }).nth(1).click();
    Logger.info('Clicked Create');
    await page.getByRole('menuitem', { name: 'New Patient' }).click();
    Logger.info('Selected New Patient');
    await page.locator('div').filter({ hasText: /^Enter Patient Details$/ }).click();
    Logger.info('Selected Enter Patient Details');
    await page.getByRole('button', { name: 'Next' }).click();
    Logger.info('Proceeded to patient details form');
    // Step 4: Fill patient details
    await page.getByRole('textbox', { name: 'First Name *' }).fill('John');
    await page.getByRole('textbox', { name: 'Last Name *' }).fill('Patil');
    await page.getByRole('textbox', { name: 'Date Of Birth *' }).fill('09-06-1994');
    await page.locator('form').filter({ hasText: 'Gender *Gender *' }).getByLabel('Open').click();
    await page.getByRole('option', { name: 'Male' }).first().click();
    await page.getByRole('textbox', { name: 'Mobile Number *' }).fill('9276544400');
    // Use a random email for each run
    const email = randomEmail();
    await page.getByRole('textbox', { name: 'Email *' }).fill(email);
    Logger.info('Filled patient details');
    // Step 5: Save patient
    await page.getByRole('button', { name: 'Save' }).click();
    Logger.info('Clicked Save');
    // Step 6: Verify patient creation
    await expect(page.locator('text=Patient Details Added Successfully')).toBeVisible();
    Logger.info('Verified patient creation success message');
    await page.waitForURL('**/patients');
    await expect(page.getByRole('tab', { name: 'Patients', selected: true })).toBeVisible();
    Logger.info('Verified navigation to patients page');
    // Optionally: Check for success message again
    // await expect(page.getByText('Patient Details Added Successfully.')).toBeVisible();
    // Optionally: Logout if needed
    // await logout(page);
  });
});

// =========================
// Test 2: Appointment Booking
// =========================

test('demo - appointment booking', async ({ page }) => {
  Logger.info('Starting appointment booking test');
  // Step 1: Login
  await login(page);
  // Step 2: Open appointment creation
  await page.getByText('Create').click();
  Logger.info('Clicked Create');
  await page.getByRole('menuitem', { name: 'New Appointment' }).locator('div').click();
  Logger.info('Selected New Appointment');
  // Step 3: Search and select a random patient
  await page.getByPlaceholder('Search Patient').click();
  // Wait for the dropdown options to appear
  const options = await page.locator('li[role="option"]').all();
  // Pick a random index
  const randomIndex = Math.floor(Math.random() * options.length);
  // Click the random patient option
  await options[randomIndex].click();
  Logger.info('Selected random patient for appointment');
  // Step 4: Select appointment type
  await page.getByPlaceholder('Select Type').click();
  await page.getByRole('option', { name: 'New Patient Visit' }).click();
  Logger.info('Selected appointment type');
  // Step 5: Fill reason and select timezone
  await page.getByPlaceholder('Reason').click();
  await page.getByPlaceholder('Reason').fill('Fever');
  Logger.info('Filled reason for visit');
  await page.getByLabel('Timezone *').click();
  await page.getByRole('option', { name: 'Central Standard Time (GMT -06:00)' }).click();
  await page.getByLabel('Timezone *').click();
  await page.getByRole('option', { name: 'Alaska Daylight Time (GMT -08:00)' }).click();
  Logger.info('Selected timezone');
  // Step 6: Select visit type and provider
  await page.getByRole('button', { name: 'Telehealth' }).click();
  await page.getByPlaceholder('Search Provider').click();
  await page.getByPlaceholder('Search Provider').fill('Michael Huang');
  await page.getByRole('option', { name: 'Michael Huang' }).click();
  Logger.info('Selected provider');
  // Step 7: View availability and select slot
  await page.getByRole('button', { name: 'View availability' }).click();
  Logger.info('Viewing availability');
  // Dynamically select tomorrow's date
  const today = new Date();
  const tomorrow = today.getDate() + 1;
  await page.getByRole('gridcell', { name: String(tomorrow), exact: true }).click();
  //Logger.info(Selected date: ${tomorrow});
  await page.locator("xpath=(//div[@class='MuiBox-root css-q6ik5y'])[1]").click();
  Logger.info('Selected time slot');
  // Step 8: Save appointment and log out
  await page.getByRole('button', { name: 'Save And Close' }).click();
  Logger.info('Saved appointment');
  await logout(page);
});