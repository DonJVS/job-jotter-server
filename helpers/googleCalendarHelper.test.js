// 1. Mock modules before requiring them
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

jest.mock('../db', () => ({
  query: jest.fn(),
}));

jest.mock('googleapis', () => ({
  google: {
    auth: {
      fromJSON: jest.fn(),
    },
    calendar: jest.fn(),
  },
}));

jest.mock('@google-cloud/local-auth', () => ({
  authenticate: jest.fn().mockResolvedValue({
    credentials: { refresh_token: 'mock_refresh_token' },
  }),
}));

const path = require('path'); // Now safe to require after mocks

// 2. Define constants after mocks
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

// 3. Use describe to structure your tests
describe('Google Calendar Helper Tests', () => {
  let authorize, listEvents, saveCredentials;
  let fs, google, authenticate, db;

  beforeEach(() => {
    // Reset module registry to ensure fresh module for each test
    jest.resetModules();
    jest.clearAllMocks();

    // Re-require the mocked modules and the module under test
    fs = require('fs').promises;
    google = require('googleapis').google;
    authenticate = require('@google-cloud/local-auth').authenticate;
    db = require('../db');
    
    // Re-require the module under test after resetting modules
    const helper = require('./googleCalendarHelper');
    authorize = helper.authorize;
    listEvents = helper.listEvents;
    saveCredentials = helper.saveCredentials;

    // Set up fs.readFile mock implementation
    fs.readFile.mockImplementation((filePath, encoding) => {
      if (filePath === TOKEN_PATH) {
        // Simulate missing token.json for the 'request new credentials' test
        return Promise.reject(new Error('File not found'));
      }
      if (filePath === CREDENTIALS_PATH) {
        // Return valid credentials.json content
        return Promise.resolve(
          JSON.stringify({
            installed: {
              client_id: 'mock_client_id',
              client_secret: 'mock_client_secret',
            },
          })
        );
      }
      // Default case for unexpected file paths
      return Promise.resolve('{}');
    });

    // Ensure writeFile does not throw errors
    fs.writeFile.mockResolvedValue();
  });

  // 4. Group related tests
  describe('authorize (loadSavedCredentialsIfExist)', () => {

    it('should return credentials when token file exists', async () => {
      // Override fs.readFile to return token.json content
      const mockCredentials = { type: 'authorized_user', refresh_token: 'abc' };
      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockCredentials));
      google.auth.fromJSON.mockReturnValue(mockCredentials);

      // Call authorize
      const credentials = await authorize();

      // Assertions
      expect(fs.readFile).toHaveBeenCalledWith(TOKEN_PATH, 'utf-8');
      expect(google.auth.fromJSON).toHaveBeenCalledWith(mockCredentials);
      expect(credentials).toEqual(mockCredentials);
    });

    it('should request new credentials when token file does not exist', async () => {
      // Simulate authenticate returning a mock OAuth2 client
      const mockOAuth2Client = { credentials: { refresh_token: 'mock_refresh_token' } };
      authenticate.mockResolvedValueOnce(mockOAuth2Client);

      // Call authorize
      const client = await authorize();

      // Assertions
      expect(fs.readFile).toHaveBeenCalledWith(TOKEN_PATH, 'utf-8');
      expect(authenticate).toHaveBeenCalledWith({
        scopes: [
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/calendar',
        ],
        keyfilePath: CREDENTIALS_PATH,
        port: 5002,
      });
      expect(fs.writeFile).toHaveBeenCalledWith(
        TOKEN_PATH,
        expect.stringContaining('mock_refresh_token')
      );
      expect(client).toEqual(mockOAuth2Client);
    });
  });



  // Test saveCredentials
  describe('saveCredentials', () => {
    it('should save credentials to the token file', async () => {
      const fs = require('fs').promises;
      const mockClient = { credentials: { refresh_token: 'mock_refresh_token' } };
      const mockKey = {
        installed: {
          client_id: 'mock_client_id',
          client_secret: 'mock_client_secret',
        },
      };

      fs.readFile.mockResolvedValue(JSON.stringify(mockKey));

      const { saveCredentials } = require('./googleCalendarHelper');
      await saveCredentials(mockClient);

      expect(fs.readFile).toHaveBeenCalledWith(CREDENTIALS_PATH, 'utf-8');;
      expect(fs.writeFile).toHaveBeenCalledWith(
        TOKEN_PATH,
        expect.stringContaining('mock_refresh_token')
      );
    });
  });

  // Test listEvents
  describe('listEvents', () => {
    it('should list events when events exist', async () => {
      const mockAuth = {};
      const mockEvents = [
        {
          id: '1',
          start: { dateTime: '2024-06-01T10:00:00Z' },
          summary: 'Test Event',
        },
      ];
      const mockList = jest.fn().mockResolvedValue({ data: { items: mockEvents } });

      google.calendar.mockReturnValue({
        events: { list: mockList },
      });

      const events = await listEvents(mockAuth);

      expect(google.calendar).toHaveBeenCalledWith({ version: 'v3', auth: mockAuth });
      expect(mockList).toHaveBeenCalled();
      expect(events).toEqual(mockEvents);
    });

    it('should return undefined when no events exist', async () => {
      const mockAuth = {};
      const mockList = jest.fn().mockResolvedValue({ data: { items: [] } });

      google.calendar.mockReturnValue({
        events: { list: mockList },
      });

      const events = await listEvents(mockAuth);

      expect(google.calendar).toHaveBeenCalledWith({ version: 'v3', auth: mockAuth });
      expect(mockList).toHaveBeenCalled();
      expect(events).toBeUndefined(); // Update the expectation to check for undefined
    });
  });
});
