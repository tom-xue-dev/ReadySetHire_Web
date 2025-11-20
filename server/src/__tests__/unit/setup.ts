// Unit test setup - no database connection needed
// This file is for unit tests that use mocked dependencies

// No database setup needed for unit tests
// All database interactions are mocked

// Disable global setup for unit tests
beforeAll(() => {
  // Mock console to avoid noise in unit tests
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  // Restore console
  jest.restoreAllMocks();
});
