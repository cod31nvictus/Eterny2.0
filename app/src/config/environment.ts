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
  API_BASE_URL: 'http://eterny-app.ddns.net:3000/api',
  SYNC_BASE_URL: 'http://eterny-app.ddns.net:3000/sync',
  AUTH_BASE_URL: 'http://eterny-app.ddns.net:3000/auth',
  GOOGLE_WEB_CLIENT_ID: '231231514086-pu1c14nac04e4nhpo8e56ng5vc1gum42.apps.googleusercontent.com',
};

export const config: EnvironmentConfig = isDevelopment ? developmentConfig : productionConfig;

export default config; 