import { createSlice } from '@reduxjs/toolkit';

const appSlice = createSlice({
  name: 'app',
  initialState: {
    // Global loading states
    globalLoading: false,
    
    // UI States  
    sidebarCollapsed: JSON.parse(localStorage.getItem('sidebarCollapsed') || 'false'),
    
    // Modal states for various components
    modals: {
      createEvent: false,
      editEvent: false,
      deleteConfirm: false,
      tagCreator: false,
      tagEditor: false,
      refundRuleCreator: false,
      refundRuleEditor: false,
      categoryCreator: false,
      imagePreview: false,
      eventPreview: false
    },
    
    // Theme settings
    theme: localStorage.getItem('theme') || 'light',
    
    // Language settings
    language: localStorage.getItem('language') || 'vi',
    
    // Network status
    isOnline: navigator.onLine,
    
    // Global error state (for error boundary)
    globalError: null,
    
    // Notification system
    notifications: [],
    
    // Page metadata
    pageTitle: 'AIEvent',
    breadcrumb: [],
    
    // Feature flags
    features: {
      realTimeNotifications: true,
      advancedAnalytics: true,
      multiLanguage: true,
      darkMode: true
    }
  },
  reducers: {
    // Loading states
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },
    
    // Sidebar
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', JSON.stringify(state.sidebarCollapsed));
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
      localStorage.setItem('sidebarCollapsed', JSON.stringify(action.payload));
    },
    
    // Modal management
    openModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = true;
      }
    },
    closeModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = false;
      }
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modal => {
        state.modals[modal] = false;
      });
    },
    
    // Theme
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
      document.documentElement.setAttribute('data-theme', action.payload);
    },
    toggleTheme: (state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      state.theme = newTheme;
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    },
    
    // Language
    setLanguage: (state, action) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
      document.documentElement.setAttribute('lang', action.payload);
    },
    
    // Network status
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    
    // Global error
    setGlobalError: (state, action) => {
      state.globalError = action.payload;
    },
    clearGlobalError: (state) => {
      state.globalError = null;
    },
    
    // Notifications
    addNotification: (state, action) => {
      const notification = {
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
        ...action.payload
      };
      state.notifications.unshift(notification);
      
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notif => notif.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    markNotificationAsRead: (state, action) => {
      const notification = state.notifications.find(notif => notif.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notif => {
        notif.read = true;
      });
    },
    
    // Page metadata
    setPageTitle: (state, action) => {
      state.pageTitle = action.payload;
      document.title = `${action.payload} - AIEvent`;
    },
    setBreadcrumb: (state, action) => {
      state.breadcrumb = action.payload;
    },
    
    // Feature flags
    toggleFeature: (state, action) => {
      const featureName = action.payload;
      if (state.features.hasOwnProperty(featureName)) {
        state.features[featureName] = !state.features[featureName];
      }
    },
    setFeature: (state, action) => {
      const { feature, enabled } = action.payload;
      if (state.features.hasOwnProperty(feature)) {
        state.features[feature] = enabled;
      }
    }
  }
});

export const {
  setGlobalLoading,
  toggleSidebar,
  setSidebarCollapsed,
  openModal,
  closeModal,
  closeAllModals,
  setTheme,
  toggleTheme,
  setLanguage,
  setOnlineStatus,
  setGlobalError,
  clearGlobalError,
  addNotification,
  removeNotification,
  clearNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  setPageTitle,
  setBreadcrumb,
  toggleFeature,
  setFeature
} = appSlice.actions;

// Selectors
export const selectGlobalLoading = (state) => state.app.globalLoading;
export const selectSidebarCollapsed = (state) => state.app.sidebarCollapsed;
export const selectModals = (state) => state.app.modals;
export const selectModalOpen = (state, modalName) => state.app.modals[modalName] || false;
export const selectTheme = (state) => state.app.theme;
export const selectLanguage = (state) => state.app.language;
export const selectIsOnline = (state) => state.app.isOnline;
export const selectGlobalError = (state) => state.app.globalError;
export const selectNotifications = (state) => state.app.notifications;
export const selectUnreadNotificationsCount = (state) => 
  state.app.notifications.filter(notif => !notif.read).length;
export const selectPageTitle = (state) => state.app.pageTitle;
export const selectBreadcrumb = (state) => state.app.breadcrumb;
export const selectFeatures = (state) => state.app.features;
export const selectFeature = (state, featureName) => state.app.features[featureName] || false;

export default appSlice.reducer;
