const { google } = require('googleapis');
const { authorize, listEvents } = require('./googleCalendarHelper');

// Mock fs.promises explicitly
const fs = require('fs').promises;
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
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

describe('Google Calendar Helper Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    fs.readFile.mockImplementation((filePath) => {
      if (filePath.includes('token.json')) {
        return Promise.reject(new Error('File not found')); // Simulate missing token.json
      }
      if (filePath.includes('credentials.json')) {
        return Promise.resolve(
          JSON.stringify({
            installed: {
              client_id: 'mock_client_id',
              client_secret: 'mock_client_secret',
            },
          })
        );
      }
      return Promise.resolve('{}'); // Default case for unexpected file paths
    });

    fs.writeFile.mockResolvedValue(); // Ensure writeFile does not throw errors
  });

  // Test loadSavedCredentialsIfExist
  describe('authorize (loadSavedCredentialsIfExist)', () => {

    it('should return credentials when token file exists', async () => {
      const mockCredentials = { type: 'authorized_user', refresh_token: 'abc' };
      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockCredentials));
      google.auth.fromJSON.mockReturnValue(mockCredentials);

      const credentials = await authorize();

      expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('token.json'));
      expect(google.auth.fromJSON).toHaveBeenCalledWith(mockCredentials);
      expect(credentials).toEqual(mockCredentials);
    });

    it('should request new credentials when token file does not exist', async () => {
      const mockOAuth2Client = { credentials: { refresh_token: 'mock_refresh_token' } };
      const { authenticate } = require('@google-cloud/local-auth');
      authenticate.mockResolvedValueOnce(mockOAuth2Client);

      const client = await authorize();

      expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('token.json'));
      expect(authenticate).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('token.json'),
        expect.stringContaining('mock_refresh_token')
      );
      expect(client).toEqual(mockOAuth2Client);
    });
  });

  // Test saveCredentials
  describe('saveCredentials', () => {
    it('should save credentials to the token file', async () => {
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

      expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('credentials.json'));
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('token.json'),
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
