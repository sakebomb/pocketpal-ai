import {makeAutoObservable, runInAction} from 'mobx';
import * as Keychain from 'react-native-keychain';

const TAVILY_KEY_SERVICE = 'tavily_api_key_service';

class ApiKeyStore {
  tavilyApiKey: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.loadKeysFromSecureStorage();
  }

  private async loadKeysFromSecureStorage() {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: TAVILY_KEY_SERVICE,
      });
      if (credentials) {
        runInAction(() => {
          this.tavilyApiKey = credentials.password;
        });
      }
    } catch (error) {
      console.error('Failed to load API keys from secure storage:', error);
    }
  }

  get hasTavilyKey(): boolean {
    return !!this.tavilyApiKey && this.tavilyApiKey.trim().length > 0;
  }

  async setTavilyApiKey(key: string) {
    try {
      await Keychain.setGenericPassword('tavily_key', key, {
        service: TAVILY_KEY_SERVICE,
      });
      runInAction(() => {
        this.tavilyApiKey = key;
      });
      return true;
    } catch (error) {
      console.error('Failed to save Tavily API key:', error);
      return false;
    }
  }

  async clearTavilyApiKey() {
    try {
      await Keychain.resetGenericPassword({service: TAVILY_KEY_SERVICE});
      runInAction(() => {
        this.tavilyApiKey = null;
      });
      return true;
    } catch (error) {
      console.error('Failed to clear Tavily API key:', error);
      return false;
    }
  }
}

export const apiKeyStore = new ApiKeyStore();
