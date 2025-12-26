import { onBeforeMount } from 'vue';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { getUrlParam, getUrlParams } from '../utils/utils';

enum LiveKitEnv {
  ProdEnv = 'ProdEnv',
  TestEnv = 'TestEnv',
}

/**
 * Parameters for environment change redirect
 */
export interface EnvironmentChangeParams extends Record<string, string> {}

/**
 * Options for configuring room environment behavior
 */
export interface UseRoomEnvironmentOptions {
  onEnvironmentChange?: (params: EnvironmentChangeParams) => void;
}

/**
 * Composable for managing room environment configuration
 * Handles switching between production and test environments
 */
export function useRoomEnvironment(options?: UseRoomEnvironmentOptions) {
  // Get current environment setting from URL or localStorage
  let currentEnv = localStorage.getItem('tuikit-live-env') || LiveKitEnv.ProdEnv;
  const settingEnv = getUrlParam('testEnv') === 'true' ? LiveKitEnv.TestEnv : LiveKitEnv.ProdEnv;

  // Enable production environment
  async function enableProdEnv() {
    await TUIRoomEngine.callExperimentalAPI(JSON.stringify({
      api: 'setTestEnvironment',
      params: {
        enableRoomTestEnv: false,
      },
    }));
    currentEnv = LiveKitEnv.ProdEnv;
  }

  // Enable test environment
  async function enableTestEnv() {
    await TUIRoomEngine.callExperimentalAPI(JSON.stringify({
      api: 'setTestEnvironment',
      params: {
        enableRoomTestEnv: true,
      },
    }));
    currentEnv = LiveKitEnv.TestEnv;
  }

  // Initialize environment configuration
  function initializeEnvironment() {
    // If environment setting changed, update localStorage and trigger callback
    if (currentEnv !== settingEnv) {
      localStorage.setItem('tuikit-live-env', settingEnv);
      
      // Trigger callback for navigation with URL params
      if (options?.onEnvironmentChange) {
        options.onEnvironmentChange(getUrlParams());
      }
    }

    // Set up environment when TUIRoomEngine is ready
    TUIRoomEngine.once('ready', () => {
      if (settingEnv === LiveKitEnv.TestEnv) {
        enableTestEnv();
      } else {
        enableProdEnv();
      }
    });
  }

  // Initialize on mount
  onBeforeMount(() => {
    initializeEnvironment();
  });

  return {
    currentEnv,
    settingEnv,
  };
}
