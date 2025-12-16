export const ENV = {
  LOCAL: 'local',
  PROD: 'prod',
};

// lấy IP : ipconfig 
export const CURRENT_ENV = ENV.LOCAL;
// export const CURRENT_ENV = ENV.PROD;

export const NETWORK_CONFIG = {
  [ENV.LOCAL]: {
    IP_ADDRESS: '192.168.101.10', // IP máy backend local
    HTTP_PORT: '5059',
    HTTPS_PORT: '7777',
    USE_HTTPS: false,
    REQUEST_TIMEOUT: 10000,
    DEBUG_MODE: true,
  },

  [ENV.PROD]: {
    HOST: 'https://aievent.duckdns.org', // domain prod
    USE_HTTPS: true,
    REQUEST_TIMEOUT: 10000,
    DEBUG_MODE: false,
  },
};

export const CURRENT_CONFIG = NETWORK_CONFIG[CURRENT_ENV];

export const getBaseUrl = () => {
  if (CURRENT_ENV === ENV.PROD) {
    return `${CURRENT_CONFIG.HOST}/api`;
  }

  const protocol = CURRENT_CONFIG.USE_HTTPS ? 'https' : 'http';
  const port = CURRENT_CONFIG.USE_HTTPS
    ? CURRENT_CONFIG.HTTPS_PORT
    : CURRENT_CONFIG.HTTP_PORT;

  return `${protocol}://${CURRENT_CONFIG.IP_ADDRESS}:${port}/api`;
};

export const getSignalRBaseUrl = () => {
  if (CURRENT_ENV === ENV.PROD) {
    return CURRENT_CONFIG.HOST;
  }

  const protocol = CURRENT_CONFIG.USE_HTTPS ? 'https' : 'http';
  const port = CURRENT_CONFIG.USE_HTTPS
    ? CURRENT_CONFIG.HTTPS_PORT
    : CURRENT_CONFIG.HTTP_PORT;

  return `${protocol}://${CURRENT_CONFIG.IP_ADDRESS}:${port}`;
};
