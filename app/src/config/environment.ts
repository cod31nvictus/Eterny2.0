interface EnvironmentConfig {
  API_BASE_URL: string;
  SYNC_BASE_URL: string;
  AUTH_BASE_URL: string;
  GOOGLE_WEB_CLIENT_ID: string;
}

const isDevelopment = __DEV__;

const developmentConfig: EnvironmentConfig = {
  API_BASE_URL: 'http://10.0.2.2:5001/api',
  SYNC_BASE_URL: 'http://10.0.2.2:5001/sync',
  AUTH_BASE_URL: 'http://10.0.2.2:5001/auth',
  GOOGLE_WEB_CLIENT_ID: '231231514086-1ltso6j58bnd6t8510tuf32j3jmbd0dk.apps.googleusercontent.com',
};

const productionConfig: EnvironmentConfig = {
  API_BASE_URL: process.env.REACT_APP_API_URL || 'https://api.eterny.com/api',
  SYNC_BASE_URL: process.env.REACT_APP_API_URL?.replace('/api', '/sync') || 'https://api.eterny.com/sync',
  AUTH_BASE_URL: process.env.REACT_APP_API_URL?.replace('/api', '/auth') || 'https://api.eterny.com/auth',
  GOOGLE_WEB_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || '231231514086-1ltso6j58bnd6t8510tuf32j3jmbd0dk.apps.googleusercontent.com',
};

export const config: EnvironmentConfig = isDevelopment ? developmentConfig : productionConfig;

export default config; 