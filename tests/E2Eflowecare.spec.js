import { test, expect } from '@playwright/test';
import Logger from './Utills/logger.js';

class E2EPatientAppointment {
  constructor() {
    this.createdPatient = null;
  }

  randomEmail() {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let name = '';
    for (let i = 0; i < 8; i++) {
      name += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${name}${Math.floor(Math.random() * 10000)}@thinkitive.com`;
  }

  randomPatientDetails() {
    const firstNames = ['John', 'Michael', 'David', 'Emily', 'Sarah', 'Jessica', 'Daniel', 'Emma', 'Olivia', 'James', 'Sophia', 'William', 'Benjamin', 'Lucas', 'Mason', 'Ella', 'Ava', 'Liam', 'Noah', 'Grace'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee'];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 10000)}@thinkitive.com`;
    const mobile = '9' + Math.floor(100000000 + Math.random() * 900000000).toString();
    return { firstName, lastName, email, mobile };
  }

  async login(page) {
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

  async logout(page) {
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

  async createPatient(page) {
    Logger.info('Starting patient registration test');
    await this.login(page);
    await page.waitForURL('**/scheduling/appointment');
    Logger.info('Dashboard loaded');
    await page.locator('div').filter({ hasText: /^Create$/ }).nth(1).click();
    Logger.info('Clicked Create');
    await page.getByRole('menuitem', { name: 'New Patient' }).click();
    Logger.info('Selected New Patient');
    await page.locator('div').filter({ hasText: /^Enter Patient Details$/ }).click();
    Logger.info('Selected Enter Patient Details');
    await page.getByRole('button', { name: 'Next' }).click();
    Logger.info('Proceeded to patient details form');

    // Generate unique patient details
    const { firstName, lastName, email, mobile } = this.randomPatientDetails();
    await page.getByRole('textbox', { name: 'First Name *' }).fill(firstName);
    await page.getByRole('textbox', { name: 'Last Name *' }).fill(lastName);
    await page.getByRole('textbox', { name: 'Date Of Birth *' }).fill('09-06-1994');
    await page.locator('form').filter({ hasText: 'Gender *Gender *' }).getByLabel('Open').click();
    await page.getByRole('option', { name: 'Male' }).first().click();
    await page.getByRole('textbox', { name: 'Mobile Number *' }).fill(mobile);
    await page.getByRole('textbox', { name: 'Email *' }).fill(email);
    Logger.info('Filled patient details');
    await page.getByRole('button', { name: 'Save' }).click();
    Logger.info('Clicked Save');
    await expect(page.locator('text=Patient Details Added Successfully')).toBeVisible();
    Logger.info('Verified patient creation success message');
    await page.waitForURL('**/patients');
    await expect(page.getByRole('tab', { name: 'Patients', selected: true })).toBeVisible();
    Logger.info('Verified navigation to patients page');
    this.createdPatient = { firstName, lastName, email };
    await this.logout(page);
  }

  async scheduleAppointment(page) {
    Logger.info('Starting appointment booking test');
    await this.login(page);
    await page.getByText('Create').click();
    Logger.info('Clicked Create');
    await page.getByRole('menuitem', { name: 'New Appointment' }).locator('div').click();
    Logger.info('Selected New Appointment');

    // Step 3: Search and select the newly created patient
    await page.getByPlaceholder('Search Patient').click();
    await page.getByPlaceholder('Search Patient').fill(`${this.createdPatient.firstName} ${this.createdPatient.lastName}`);

    let found = false;
    for (let attempt = 0; attempt < 5; attempt++) {

      // Wait for dropdown to update

      await page.waitForTimeout(1000);

      // Check for "No options"
      const noOptions = await page.locator('text=No options').isVisible().catch(() => false);
      if (noOptions) {
        continue; // Try again
      }

      // Get all options
      const options = await page.locator('li[role="option"]').all();
      for (const option of options) {
        const text = await option.textContent();
        if (text && text.includes(this.createdPatient.firstName) && text.includes(this.createdPatient.lastName)) {
          await option.click();
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (!found) throw new Error('Created patient not found in dropdown');
    Logger.info('Selected created patient for appointment');

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
    await page.locator("xpath=(//div[@class='MuiBox-root css-q6ik5y'])[1]").click();
    Logger.info('Selected time slot');

    // Step 8: Save appointment
    await page.getByRole('button', { name: 'Save And Close' }).click();
    Logger.info('Saved appointment');

    // Verify appointment is for the created patient
    // Wait for the appointment grid to be visible (second grid on the page)
    const appointmentGrid = page.getByRole('grid').nth(1);
    await expect(appointmentGrid).toBeVisible();

    // Find the row that contains the created patient's name
    const patientRow = appointmentGrid.getByRole('row', { name: new RegExp(this.createdPatient.firstName, 'i') });

    // Assert that the row contains both first and last name
    await expect(patientRow).toContainText(this.createdPatient.firstName, { timeout: 5000 });
    await expect(patientRow).toContainText(this.createdPatient.lastName, { timeout: 5000 });
    Logger.info('Verified appointment for created patient');
    await this.logout(page);
  }
}

// Maximize viewport for all tests

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

const e2e = new E2EPatientAppointment();

test('E2E: Create patient and schedule appointment for that patient', async ({ page }) => {
  await e2e.createPatient(page);
  await e2e.scheduleAppointment(page);
});
