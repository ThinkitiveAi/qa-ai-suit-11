const { test, expect } = require('@playwright/test');

test('Provider Onboarding – Mandatory Fields', async ({ page }) => {
  // Test URL
  const testURL = 'https://stage_aithinkitive.uat.provider.ecarehealth.com/';
  
  // Navigate to the application
  await page.goto(testURL);
  
  // Login with provided credentials
  await page.getByRole('textbox', { name: 'Email' }).fill('rose.gomez@jourrapide.com');
  await page.getByRole('textbox', { name: '*********' }).fill('Pass@123');
  
  // Click "Let's Get Started" button
  await page.getByRole('button', { name: 'Let\'s get Started' }).click();
  
  // Wait for the page to load and click on Settings tab
  await page.getByRole('tab', { name: 'Settings' }).click();
  
  // Click on User Settings from the menu
  await page.getByRole('menuitem', { name: 'User Settings' }).click();
  
  // Go to the Providers tab
  await page.getByRole('tab', { name: 'Providers' }).click();
  
  // Click on Add Provider User button
  await page.getByRole('button', { name: 'Add Provider User' }).click();
  
  // Fill in the mandatory Provider Details
  // First Name: Victor
  await page.getByRole('textbox', { name: 'First Name *' }).fill('Victor');
  
  // Last Name: Dimitri
  await page.getByRole('textbox', { name: 'Last Name *' }).fill('Dimitri');
  
  // Role: Provider (Select from dropdown)
  await page.locator('form').filter({ hasText: 'Role *Role *' }).getByLabel('Open').click();
  await page.getByRole('option', { name: 'Provider' }).click();
  
  // Gender: Male (Select from dropdown)
  await page.locator('form').filter({ hasText: 'Gender *Gender *' }).getByLabel('Open').click();
  await page.getByRole('option', { name: 'Male', exact: true }).click();
  
  // Email: victordimitri@mailinator.com
  await page.getByRole('textbox', { name: 'Email *' }).fill('victordimitri@mailinator.com');
  
  // Click Save button
  await page.getByRole('button', { name: 'Save' }).click();
  
  // Verify the expected result
  // Check for success message
  await expect(page.locator('text=Provider created successfully.')).toBeVisible();
  
  // Verify the new provider appears in the providers list
  await expect(page.getByRole('heading', { name: 'Victor Dimitri', level: 4 })).toBeVisible();
  
  // Verify the email is displayed in the provider card
  await expect(page.locator('text=victordimitri@mailinat')).toBeVisible();
  
  // Verify the provider status is Active
  await expect(page.locator('text=Active').first()).toBeVisible();
  
  console.log('✅ Test Passed: Provider "Victor Dimitri" has been successfully created and is visible in the Providers list');
});