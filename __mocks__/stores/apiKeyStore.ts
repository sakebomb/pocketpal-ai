export const mockApiKeyStore = {
  tavilyApiKey: null as string | null,
  get hasTavilyKey() {
    return !!this.tavilyApiKey && this.tavilyApiKey.trim().length > 0;
  },
  setTavilyApiKey: jest.fn().mockResolvedValue(true),
  clearTavilyApiKey: jest.fn().mockResolvedValue(true),
};

export const apiKeyStore = mockApiKeyStore;
