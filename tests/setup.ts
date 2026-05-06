import { beforeAll, afterAll } from 'vitest';

/**
 * Test Setup
 * 
 * Configures test environment for both static and prisma modes.
 * The actual mode is determined by the MODE env var during test execution.
 */

// Global test configuration
export const TEST_MODE = process.env.MODE || 'static';
export const TEST_PORT = process.env.TEST_PORT || 3000;
export const TEST_BASE_URL = process.env.TEST_BASE_URL || `http://localhost:${TEST_PORT}`;

console.log(`[TEST SETUP] Running tests in ${TEST_MODE} mode`);
console.log(`[TEST SETUP] Base URL: ${TEST_BASE_URL}`);

// Verify the test server is running
beforeAll(async () => {
  console.log('[TEST SETUP] Waiting for server to be ready...');
  const maxRetries = 20;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch(`${TEST_BASE_URL}/api/menu`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        console.log('[TEST SETUP] Server is ready');
        return;
      }
    } catch (error) {
      retries++;
      console.log(`[TEST SETUP] Retry ${retries}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  throw new Error(`Server not ready after ${maxRetries} retries at ${TEST_BASE_URL}`);
});

afterAll(() => {
  console.log('[TEST TEARDOWN] Tests completed');
});
