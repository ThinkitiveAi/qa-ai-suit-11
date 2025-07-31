const { test, expect } = require('@playwright/test');

/**
 * eCareHealth AI Session API End-to-End Test Suite
 * 
 * This test suite covers the complete API workflow in a single test:
 * 1. Provider Login → 2. Add Provider → 3. Get Provider → 4. Set Availability
 * → 5. Create Patient → 6. Get Patient → 7. Get Availability → 8. Book Appointment
 */

// Test configuration
const CONFIG = {
  baseURL: 'https://stage-api.ecarehealth.com',
  tenant: 'stage_aithinkitive',
  credentials: {
    username: 'rose.gomez@jourrapide.com',
    password: 'Pass@123'
  },
  timeout: 30000
};

// Test data storage
let testData = {
  accessToken: null,
  providerUUID: null,
  patientUUID: null,
  createdProvider: null,
  createdPatient: null,
  providerEmail: null,
  providerFirstName: null,
  providerLastName: null,
  patientEmail: null,
  patientFirstName: null,
  patientLastName: null,
  startTime: null,
  availableSlots: null,
  availabilitySettings: null
};

// Test results tracking
let testResults = [];

// Helper functions
function logTestResult(testName, status, statusCode, response, validation) {
  testResults.push({
    testName,
    status,
    statusCode,
    response: typeof response === 'object' ? JSON.stringify(response, null, 2) : response,
    validation,
    timestamp: new Date().toISOString()
  });
  
  // Real-time logging
  if (status === "PASS") {
    console.log(`✓ ${testName}: PASSED (${statusCode})`);
  } else if (status === "FAIL") {
    console.log(`✗ ${testName}: FAILED (${statusCode}) - ${validation}`);
  } else {
    console.log(`⚠ ${testName}: ERROR - ${validation}`);
  }
}

function generateRandomData() {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
  const autoFirstName = `AutoFN${generateRandomString(6)}`;
  
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
  
  const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return {
    firstName: autoFirstName,
    lastName: randomLastName,
    email: `${autoFirstName}_${timestamp}@example.com`,
    phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`
  };
}

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
}

function getNextMonday() {
  const today = new Date();
  const nextMonday = new Date();
  nextMonday.setDate(today.getDate() + (1 + 7 - today.getDay()) % 7);
  if (nextMonday <= today) {
    nextMonday.setDate(nextMonday.getDate() + 7);
  }
  return nextMonday;
}

// NEW UTILITY FUNCTIONS FOR UTC TIME CONVERSION
function convertESTToUTC(estDateTimeString) {
  // Create date object from EST time
  const estDate = new Date(estDateTimeString);
  
  // EST is UTC-5 (or UTC-4 during daylight saving time)
  // For simplicity, using UTC-5 (standard time)
  const utcDate = new Date(estDate.getTime() + (5 * 60 * 60 * 1000));
  
  return utcDate;
}

function convertUTCToEST(utcDateTimeString) {
  // Create date object from UTC time
  const utcDate = new Date(utcDateTimeString);
  
  // Convert UTC to EST (UTC-5)
  const estDate = new Date(utcDate.getTime() - (5 * 60 * 60 * 1000));
  
  return estDate;
}

function formatDateForAPI(date) {
  return date.toISOString();
}

function getUTCMondaySlotTimes() {
  const nextMonday = getNextMonday();
  
  // Set EST times (12:00 PM - 1:00 PM EST as per availability)
  const estStartTime = new Date(nextMonday);
  estStartTime.setHours(12, 0, 0, 0); // 12:00 PM EST
  
  const estEndTime = new Date(nextMonday);
  estEndTime.setHours(13, 0, 0, 0); // 1:00 PM EST
  
  // Convert to UTC for API calls
  const utcStartTime = convertESTToUTC(estStartTime.toISOString());
  const utcEndTime = convertESTToUTC(estEndTime.toISOString());
  
  return {
    estStartTime,
    estEndTime,
    utcStartTime,
    utcEndTime,
    date: nextMonday.toISOString().split('T')[0] // YYYY-MM-DD format
  };
}

// Add delay function for waiting between API calls
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateTestReport() {
  const totalTests = testResults.length;
  const passedTests = testResults.filter(test => test.status === "PASS").length;
  const failedTests = testResults.filter(test => test.status === "FAIL").length;
  const errorTests = testResults.filter(test => test.status === "ERROR").length;
  
  console.log('\n' + '='.repeat(60));
  console.log('           TEST EXECUTION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Environment: ${CONFIG.baseURL}`);
  console.log(`Tenant: ${CONFIG.tenant}`);
  console.log(`Execution Time: ${new Date().toISOString()}`);
  console.log('-'.repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Errors: ${errorTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log('='.repeat(60));
  
  console.log('\nDETAILED RESULTS:');
  testResults.forEach((result, index) => {
    console.log(`${index + 1}. ${result.testName}: ${result.status} (${result.statusCode})`);
    console.log(`   Validation: ${result.validation}`);
    console.log(`   Time: ${result.timestamp}`);
    if (result.status !== "PASS") {
      console.log(`   Response: ${result.response.substring(0, 150)}...`);
    }
    console.log('-'.repeat(40));
  });
  
  return {
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      errors: errorTests,
      successRate: Math.round((passedTests / totalTests) * 100)
    },
    results: testResults
  };
}

// Main End-to-End Test
test.describe('eCareHealth API End-to-End Test Suite', () => {
  
  test('Complete API Workflow - Provider to Patient Appointment Booking with UTC', async ({ request }) => {
    console.log('\n🚀 Starting eCareHealth End-to-End API Test');
    console.log(`Environment: ${CONFIG.baseURL}`);
    console.log(`Tenant: ${CONFIG.tenant}\n`);

    // =================================================================
    // STEP 1: PROVIDER LOGIN
    // =================================================================
    console.log('📝 Step 1: Provider Login');
    
    try {
      const loginResponse = await request.post(`${CONFIG.baseURL}/api/master/login`, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'X-TENANT-ID': CONFIG.tenant
        },
        data: {
          username: CONFIG.credentials.username,
          password: CONFIG.credentials.password,
          xTENANTID: CONFIG.tenant
        }
      });

      const loginData = await loginResponse.json();
      const statusCode = loginResponse.status();

      expect(statusCode).toBe(200);
      expect(loginData.data).toHaveProperty('access_token');

      testData.accessToken = loginData.data.access_token;
      
      logTestResult("Provider Login", "PASS", statusCode, loginData, 
        `Expected: 200, Actual: ${statusCode} - Login successful, access token received`);

    } catch (error) {
      logTestResult("Provider Login", "ERROR", 0, error.message, "Network/Parse Error");
      throw error;
    }

    // =================================================================
    // STEP 2: ADD PROVIDER
    // =================================================================
    console.log('\n📝 Step 2: Add Provider');
    
    try {
      const timestamp = Date.now();
      const providerTestData = generateRandomData();
      testData.providerEmail = `saurabh.kale+${providerTestData.firstName}${timestamp}@medarch.com`;
      testData.providerFirstName = providerTestData.firstName;
      testData.providerLastName = providerTestData.lastName;
      
      const providerData = {
        roleType: "PROVIDER",
        active: false,
        admin_access: true,
        status: false,
        avatar: "",
        role: "PROVIDER",
        firstName: providerTestData.firstName,
        lastName: providerTestData.lastName,
        gender: "MALE",
        phone: "",
        npi: "",
        specialities: null,
        groupNpiNumber: "",
        licensedStates: null,
        licenseNumber: "",
        acceptedInsurances: null,
        experience: "",
        taxonomyNumber: "",
        workLocations: null,
        email: testData.providerEmail,
        officeFaxNumber: "",
        areaFocus: "",
        hospitalAffiliation: "",
        ageGroupSeen: null,
        spokenLanguages: null,
        providerEmployment: "",
        insurance_verification: "",
        prior_authorization: "",
        secondOpinion: "",
        careService: null,
        bio: "",
        expertise: "",
        workExperience: "",
        licenceInformation: [{
          uuid: "",
          licenseState: "",
          licenseNumber: ""
        }],
        deaInformation: [{
          deaState: "",
          deaNumber: "",
          deaTermDate: "",
          deaActiveDate: ""
        }]
      };

      const providerResponse = await request.post(`${CONFIG.baseURL}/api/master/provider`, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Authorization': `Bearer ${testData.accessToken}`,
          'Content-Type': 'application/json'
        },
        data: providerData
      });

      const providerResponseData = await providerResponse.json();
      const statusCode = providerResponse.status();

      expect(statusCode).toBe(201);
      expect(providerResponseData.message).toContain("Provider created successfully");

      testData.createdProvider = providerResponseData;

      logTestResult("Add Provider", "PASS", statusCode, providerResponseData,
        `Expected: 201 with success message, Actual: ${statusCode}`);

    } catch (error) {
      logTestResult("Add Provider", "ERROR", 0, error.message, "Network/Parse Error");
      throw error;
    }

    // =================================================================
    // STEP 3: GET PROVIDER
    // =================================================================
    console.log('\n📝 Step 3: Get Provider');
    
    try {
      const getProviderResponse = await request.get(`${CONFIG.baseURL}/api/master/provider?page=0&size=20`, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Authorization': `Bearer ${testData.accessToken}`
        }
      });

      const providerListData = await getProviderResponse.json();
      const statusCode = getProviderResponse.status();

      expect(statusCode).toBe(200);

      // Find the created provider
      let createdProviderFound = null;
      if (providerListData.data && providerListData.data.content) {
        createdProviderFound = providerListData.data.content.find(provider => 
          provider.firstName === testData.providerFirstName && 
          provider.lastName === testData.providerLastName &&
          provider.email === testData.providerEmail
        );
      }

      expect(createdProviderFound).not.toBeNull();
      testData.providerUUID = createdProviderFound.uuid;

      logTestResult("Get Provider", "PASS", statusCode, providerListData,
        `Expected: 200 and created provider found, Actual: ${statusCode}, Provider UUID: ${testData.providerUUID}`);

    } catch (error) {
      logTestResult("Get Provider", "ERROR", 0, error.message, "Network/Parse Error");
      throw error;
    }

    // =================================================================
    // STEP 4: SET AVAILABILITY (Updated with UTC consideration)
    // =================================================================
    console.log('\n📝 Step 4: Set Availability');
    
    try {
      const availabilityData = {
        setToWeekdays: false,
        providerId: testData.providerUUID,
        bookingWindow: "3",
        timezone: "EST", // Provider timezone
        bufferTime: 0,
        initialConsultTime: 0,
        followupConsultTime: 0,
        settings: [{
          type: "NEW",
          slotTime: "30",
          minNoticeUnit: "8_HOUR"
        }],
        blockDays: [],
        daySlots: [{
          day: "MONDAY",
          startTime: "12:00:00", // EST time
          endTime: "13:00:00",   // EST time
          availabilityMode: "VIRTUAL"
        }],
        bookBefore: "undefined undefined",
        xTENANTID: CONFIG.tenant
      };

      const availabilityResponse = await request.post(`${CONFIG.baseURL}/api/master/provider/availability-setting`, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Authorization': `Bearer ${testData.accessToken}`,
          'Content-Type': 'application/json',
          'X-TENANT-ID': CONFIG.tenant
        },
        data: availabilityData
      });

      const availabilityResponseData = await availabilityResponse.json();
      const statusCode = availabilityResponse.status();

      expect(statusCode).toBe(200);
      expect(availabilityResponseData.message).toContain(`Availability added successfully for provider ${testData.providerFirstName} ${testData.providerLastName}`);

      logTestResult("Set Availability", "PASS", statusCode, availabilityResponseData,
        `Expected: 200 with success message, Actual: ${statusCode}`);

      // Wait for availability to be processed
      console.log('⏳ Waiting for availability to be processed...');
      await delay(3000); // Wait 3 seconds for the system to process availability

    } catch (error) {
      logTestResult("Set Availability", "ERROR", 0, error.message, "Network/Parse Error");
      throw error;
    }

    // =================================================================
    // STEP 5: CREATE PATIENT
    // =================================================================
    console.log('\n📝 Step 5: Create Patient');
    
    try {
      const patientTestData = generateRandomData();
      testData.patientEmail = patientTestData.email;
      testData.patientFirstName = patientTestData.firstName;
      testData.patientLastName = patientTestData.lastName;
      
      const patientData = {
        phoneNotAvailable: true,
        emailNotAvailable: true,
        registrationDate: "",
        firstName: patientTestData.firstName,
        middleName: "",
        lastName: patientTestData.lastName,
        timezone: "IST",
        birthDate: "1994-08-16T18:30:00.000Z",
        gender: "MALE",
        ssn: "",
        mrn: "",
        languages: null,
        avatar: "",
        mobileNumber: "",
        faxNumber: "",
        homePhone: "",
        address: {
          line1: "",
          line2: "",
          city: "",
          state: "",
          country: "",
          zipcode: ""
        },
        emergencyContacts: [{
          firstName: "",
          lastName: "",
          mobile: ""
        }],
        patientInsurances: [{
          active: true,
          insuranceId: "",
          copayType: "FIXED",
          coInsurance: "",
          claimNumber: "",
          note: "",
          deductibleAmount: "",
          employerName: "",
          employerAddress: {
            line1: "",
            line2: "",
            city: "",
            state: "",
            country: "",
            zipcode: ""
          },
          subscriberFirstName: "",
          subscriberLastName: "",
          subscriberMiddleName: "",
          subscriberSsn: "",
          subscriberMobileNumber: "",
          subscriberAddress: {
            line1: "",
            line2: "",
            city: "",
            state: "",
            country: "",
            zipcode: ""
          },
          groupId: "",
          memberId: "",
          groupName: "",
          frontPhoto: "",
          backPhoto: "",
          insuredFirstName: "",
          insuredLastName: "",
          address: {
            line1: "",
            line2: "",
            city: "",
            state: "",
            country: "",
            zipcode: ""
          },
          insuredBirthDate: "",
          coPay: "",
          insurancePayer: {}
        }],
        emailConsent: false,
        messageConsent: false,
        callConsent: false,
        patientConsentEntities: [{
          signedDate: new Date().toISOString()
        }]
      };

      const patientResponse = await request.post(`${CONFIG.baseURL}/api/master/patient`, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Authorization': `Bearer ${testData.accessToken}`,
          'Content-Type': 'application/json',
          'X-TENANT-ID': CONFIG.tenant
        },
        data: patientData
      });

      const patientResponseData = await patientResponse.json();
      const statusCode = patientResponse.status();

      expect(statusCode).toBe(201);
      expect(patientResponseData.message).toContain("Patient Details Added Successfully");

      testData.createdPatient = patientResponseData;

      logTestResult("Create Patient", "PASS", statusCode, patientResponseData,
        `Expected: 201 with success message, Actual: ${statusCode}`);

    } catch (error) {
      logTestResult("Create Patient", "ERROR", 0, error.message, "Network/Parse Error");
      throw error;
    }

    // =================================================================
    // STEP 6: GET PATIENT
    // =================================================================
    console.log('\n📝 Step 6: Get Patient');
    
    try {
      const getPatientResponse = await request.get(`${CONFIG.baseURL}/api/master/patient?page=0&size=20&searchString=`, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Authorization': `Bearer ${testData.accessToken}`,
          'X-TENANT-ID': CONFIG.tenant
        }
      });

      const patientListData = await getPatientResponse.json();
      const statusCode = getPatientResponse.status();

      expect(statusCode).toBe(200);

      // Find the created patient
      let createdPatientFound = null;
      if (patientListData.data && patientListData.data.content) {
        const patients = patientListData.data.content.filter(patient => 
          patient.firstName === testData.patientFirstName && patient.lastName === testData.patientLastName
        );