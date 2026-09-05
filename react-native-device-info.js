/**
 * Shim for react-native-device-info, aliased in babel.config.js.
 * sp-react-native-in-app-updates imports react-native-device-info directly,
 * but that package isn't Expo-config-plugin-friendly — this reads the same
 * two fields (bundle id, version) straight from the Expo config instead.
 */
import Constants from 'expo-constants';

export const getBundleId = () => {
  return Constants.expoConfig?.ios?.bundleIdentifier ?? '';
};
export const getVersion = () => {
  return Constants.expoConfig?.version;
};
export default {
  getBundleId,
  getVersion,
};
