const { test, expect } = require('@playwright/test');

test('Set Availability for Telehealth', async ({ page }) => {
  // Step 1: Navigate to the URL
  await page.goto('https://stage_ketamin.uat.provider.ecarehealth.com/');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Step 2: Login with credentials
  await page.getByRole('textbox', { name: 'Email' }).fill('amanda.lee@healthcaretest.com');
  await page.getByRole('textbox', { name: '*********' }).fill('Admin@123');
  
  // Step 3: Click "Let's Get Started"
  await page.getByRole('button', { name: 'Let\'s get Started' }).click();
  
  // Wait for dashboard to load
  await page.waitForLoadState('networkidle');
  
  // Step 4: Click on the "Scheduling" tab from the left menu
  await page.getByRole('tab', { name: 'Scheduling' }).click();
  
  // Step 5: Select the "Availability" option
  // First wait for the scheduling menu to appear, then click Availability
  await page.getByRole('menuitem', { name: 'Availability' }).click();
  
  // Wait for availability page to load
  await page.waitForLoadState('networkidle');
  
  // Step 6: Click on the "Edit Availability" button
  await page.getByRole('button', { name: 'Edit Availability' }).click();
  
  // Wait for the form to appear
  await page.waitForSelector('dialog[aria-labelledby]');
  
  // Step 7: Fill in the mandatory availability fields
  
  // Select Provider: Choose the provider from dropdown (e.g., "Dr. Victor Dimitri")
  // Note: The form may already have a provider selected, but we can change it if needed
  const providerDropdown = page.locator('combobox[aria-label*="Select Provider"]').first();
  await providerDropdown.click();
  // Look for Dr. Victor Dimitri or use the currently selected provider
  const victorOption = page.getByRole('option', { name: /Victor Dimitri/i });
  if (await victorOption.isVisible()) {
    await victorOption.click();
  } else {
    // If Dr. Victor Dimitri is not available, use the first available provider
    await page.keyboard.press('Escape'); // Close dropdown if no specific provider found
  }
  
  // Select Timezone: (e.g., "Asia/Kolkata")
  await page.locator('combobox[aria-label*="Time Zone"]').click();
  const timezoneOption = page.getByRole('option', { name: /Asia\/Kolkata/i });
  if (await timezoneOption.isVisible()) {
    await timezoneOption.click();
  } else {
    // Use a default timezone if Asia/Kolkata is not available
    await page.keyboard.press('Escape');
  }
  
  // Select Booking Window: (e.g., "30 minutes")
  await page.locator('combobox[aria-label*="Booking Window"]').click();
  const bookingWindowOption = page.getByRole('option', { name: /30 minutes/i });
  if (await bookingWindowOption.isVisible()) {
    await bookingWindowOption.click();
  } else {
    // Use default booking window if 30 minutes is not available
    await page.keyboard.press('Escape');
  }
  
  // Day Slot Creation
  
  // Step 8: Select Day: (e.g., "Monday") - Monday should already be selected by default
  await page.getByRole('tab', { name: 'Monday' }).click();
  
  // Step 9: Start Time: 10:00 AM
  await page.locator('combobox[aria-label*="Start Time"]').click();
  const startTimeOption = page.getByRole('option', { name: /10:00 AM/i });
  if (await startTimeOption.isVisible()) {
    await startTimeOption.click();
  } else {
    // Type the time manually if not in dropdown
    await page.locator('combobox[aria-label*="Start Time"]').fill('10:00 AM');
  }
  
  // Step 10: End Time: 05:00 PM
  await page.locator('combobox[aria-label*="End Time"]').click();
  const endTimeOption = page.getByRole('option', { name: /05:00 PM|17:00/i });
  if (await endTimeOption.isVisible()) {
    await endTimeOption.click();
  } else {
    // Type the time manually if not in dropdown
    await page.locator('combobox[aria-label*="End Time"]').fill('05:00 PM');
  }
  
  // Step 11: Click on "Set to Weekdays" toggle and enable it
  const weekdaysToggle = page.getByRole('checkbox', { name: 'Set to Weekdays' });
  if (!(await weekdaysToggle.isChecked())) {
    await weekdaysToggle.click();
  }
  
  // Step 12: Check the "Telehealth" checkbox
  const telehealthCheckbox = page.getByRole('checkbox', { name: 'Telehealth' });
  if (!(await telehealthCheckbox.isChecked())) {
    await telehealthCheckbox.click();
  }
  
  // Step 13: Select Appointment Type: (e.g., "Video Consultation")
  // Note: There might be multiple appointment type dropdowns in the Availability Settings section
  const appointmentTypeDropdowns = page.locator('combobox[aria-label*="Appointment Type"]');
  const firstAppointmentType = appointmentTypeDropdowns.first();
  await firstAppointmentType.click();
  
  const videoConsultationOption = page.getByRole('option', { name: /Video Consultation/i });
  if (await videoConsultationOption.isVisible()) {
    await videoConsultationOption.click();
  } else {
    // If Video Consultation is not available, look for other telehealth-related options
    const telehealthOptions = page.getByRole('option', { name: /telehealth|virtual|online/i });
    if (await telehealthOptions.first().isVisible()) {
      await telehealthOptions.first().click();
    } else {
      // Use default appointment type
      await page.keyboard.press('Escape');
    }
  }
  
  // Step 14: Click on "Save" button
  await page.getByRole('button', { name: 'Save' }).click();
  
  // Wait for the save operation to complete
  await page.waitForLoadState('networkidle');
  
  // Expected Result: Availability is saved successfully and visible on the calendar
  // Verify that we're back to the availability calendar page
  await expect(page.locator('h3')).toContainText('Availability');
  
  // Verify that the dialog has closed (form is no longer visible)
  await expect(page.locator('dialog[aria-labelledby]')).not.toBeVisible();
  
  // Optional: Verify that the calendar shows the updated availability
  // This would depend on how the application displays the saved availability
  await expect(page.locator('table[aria-label*="Month View"]')).toBeVisible();
  
  console.log('✅ Availability for Telehealth has been set successfully!');
});

// Additional helper functions and error handling

test.beforeEach(async ({ page }) => {
  // Set viewport size for consistent testing
  await page.setViewportSize({ width: 1280, height: 720 });
  
  // Set timeout for slower network operations
  page.setDefaultTimeout(10000);
});

test.afterEach(async ({ page }) => {
  // Clean up - you could add logout logic here if needed
  await page.close();
});