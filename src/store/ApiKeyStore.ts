import {makeAutoObservable, runInAction} from 'mobx';
import * as Keychain from 'react-native-keychain';

const TAVILY_KEY_SERVICE = 'tavily_api_key_service';
const BRAVE_KEY_SERVICE = 'brave_api_key_service';
const AVIATIONSTACK_KEY_SERVICE = 'aviationstack_api_key_service';
const OMDB_KEY_SERVICE = 'omdb_api_key_service';
const SERPER_KEY_SERVICE = 'serper_api_key_service';

class ApiKeyStore {
  tavilyApiKey: string | null = null;
  braveApiKey: string | null = null;
  aviationstackApiKey: string | null = null;
  omdbApiKey: string | null = null;
  serperApiKey: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.loadKeysFromSecureStorage();
  }

  private async loadKeysFromSecureStorage() {
    try {
      const [tavily, brave, aviationstack, omdb, serper] = await Promise.all([
        Keychain.getGenericPassword({service: TAVILY_KEY_SERVICE}),
        Keychain.getGenericPassword({service: BRAVE_KEY_SERVICE}),
        Keychain.getGenericPassword({service: AVIATIONSTACK_KEY_SERVICE}),
        Keychain.getGenericPassword({service: OMDB_KEY_SERVICE}),
        Keychain.getGenericPassword({service: SERPER_KEY_SERVICE}),
      ]);
      runInAction(() => {
        if (tavily) {
          this.tavilyApiKey = tavily.password;
        }
        if (brave) {
          this.braveApiKey = brave.password;
        }
        if (aviationstack) {
          this.aviationstackApiKey = aviationstack.password;
        }
        if (omdb) {
          this.omdbApiKey = omdb.password;
        }
        if (serper) {
          this.serperApiKey = serper.password;
        }
      });
    } catch (error) {
      console.error('Failed to load API keys from secure storage:', error);
    }
  }

  get hasTavilyKey(): boolean {
    return !!this.tavilyApiKey && this.tavilyApiKey.trim().length > 0;
  }

  get hasBraveKey(): boolean {
    return !!this.braveApiKey && this.braveApiKey.trim().length > 0;
  }

  get hasAviationstackKey(): boolean {
    return !!this.aviationstackApiKey && this.aviationstackApiKey.trim().length > 0;
  }

  get hasOmdbKey(): boolean {
    return !!this.omdbApiKey && this.omdbApiKey.trim().length > 0;
  }

  get hasSerperKey(): boolean {
    return !!this.serperApiKey && this.serperApiKey.trim().length > 0;
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

  async setBraveApiKey(key: string) {
    try {
      await Keychain.setGenericPassword('brave_key', key, {
        service: BRAVE_KEY_SERVICE,
      });
      runInAction(() => {
        this.braveApiKey = key;
      });
      return true;
    } catch (error) {
      console.error('Failed to save Brave API key:', error);
      return false;
    }
  }

  async clearBraveApiKey() {
    try {
      await Keychain.resetGenericPassword({service: BRAVE_KEY_SERVICE});
      runInAction(() => {
        this.braveApiKey = null;
      });
      return true;
    } catch (error) {
      console.error('Failed to clear Brave API key:', error);
      return false;
    }
  }

  async setAviationstackApiKey(key: string) {
    try {
      await Keychain.setGenericPassword('aviationstack_key', key, {
        service: AVIATIONSTACK_KEY_SERVICE,
      });
      runInAction(() => {
        this.aviationstackApiKey = key;
      });
      return true;
    } catch (error) {
      console.error('Failed to save AviationStack API key:', error);
      return false;
    }
  }

  async clearAviationstackApiKey() {
    try {
      await Keychain.resetGenericPassword({service: AVIATIONSTACK_KEY_SERVICE});
      runInAction(() => {
        this.aviationstackApiKey = null;
      });
      return true;
    } catch (error) {
      console.error('Failed to clear AviationStack API key:', error);
      return false;
    }
  }

  async setOmdbApiKey(key: string) {
    try {
      await Keychain.setGenericPassword('omdb_key', key, {
        service: OMDB_KEY_SERVICE,
      });
      runInAction(() => {
        this.omdbApiKey = key;
      });
      return true;
    } catch (error) {
      console.error('Failed to save OMDB API key:', error);
      return false;
    }
  }

  async clearOmdbApiKey() {
    try {
      await Keychain.resetGenericPassword({service: OMDB_KEY_SERVICE});
      runInAction(() => {
        this.omdbApiKey = null;
      });
      return true;
    } catch (error) {
      console.error('Failed to clear OMDB API key:', error);
      return false;
    }
  }

  async setSerperApiKey(key: string) {
    try {
      await Keychain.setGenericPassword('serper_key', key, {
        service: SERPER_KEY_SERVICE,
      });
      runInAction(() => {
        this.serperApiKey = key;
      });
      return true;
    } catch (error) {
      console.error('Failed to save Serper API key:', error);
      return false;
    }
  }

  async clearSerperApiKey() {
    try {
      await Keychain.resetGenericPassword({service: SERPER_KEY_SERVICE});
      runInAction(() => {
        this.serperApiKey = null;
      });
      return true;
    } catch (error) {
      console.error('Failed to clear Serper API key:', error);
      return false;
    }
  }
}

export const apiKeyStore = new ApiKeyStore();
