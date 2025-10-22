 export const NETWORK_CONFIG = {
  // IP address của máy tính chạy backend
  // Lấy IP bằng cách chạy: ipconfig (Windows) hoặc ifconfig (Mac/Linux)
  IP_ADDRESS: '192.168.1.253',
  
  // Port của backend API
  HTTP_PORT: '5059',
  HTTPS_PORT: '7777',

    USE_HTTPS: false,
    REQUEST_TIMEOUT: 10000,
    DEBUG_MODE: false,
};

export const getBaseUrl = () => {
  const protocol = NETWORK_CONFIG.USE_HTTPS ? 'https' : 'http';
  const port = NETWORK_CONFIG.USE_HTTPS ? NETWORK_CONFIG.HTTPS_PORT : NETWORK_CONFIG.HTTP_PORT;
  return `${protocol}://${NETWORK_CONFIG.IP_ADDRESS}:${port}/api`;
};

if (NETWORK_CONFIG.DEBUG_MODE) {
}
