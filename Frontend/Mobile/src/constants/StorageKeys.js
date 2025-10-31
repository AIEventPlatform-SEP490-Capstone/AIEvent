const StorageKeys = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    USER_DATA: 'userData',
    IS_LOGGED_IN: 'isLoggedIn',
    TOKEN_EXPIRES_AT: 'tokenExpiresAt',
    PAYMENT_DATA_PREFIX: 'payment_', // Will be used as payment_${orderCode}
};

export default StorageKeys;