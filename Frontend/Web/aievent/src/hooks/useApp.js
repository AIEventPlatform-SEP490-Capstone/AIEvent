import { useSelector, useDispatch } from 'react-redux';
import {
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
  setFeature,
  selectGlobalLoading,
  selectSidebarCollapsed,
  selectModals,
  selectModalOpen,
  selectTheme,
  selectLanguage,
  selectIsOnline,
  selectGlobalError,
  selectNotifications,
  selectUnreadNotificationsCount,
  selectPageTitle,
  selectBreadcrumb,
  selectFeatures,
  selectFeature
} from '../store/slices/appSlice';

export const useApp = () => {
  const dispatch = useDispatch();

  // Selectors
  const globalLoading = useSelector(selectGlobalLoading);
  const sidebarCollapsed = useSelector(selectSidebarCollapsed);
  const modals = useSelector(selectModals);
  const theme = useSelector(selectTheme);
  const language = useSelector(selectLanguage);
  const isOnline = useSelector(selectIsOnline);
  const globalError = useSelector(selectGlobalError);
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadNotificationsCount);
  const pageTitle = useSelector(selectPageTitle);
  const breadcrumb = useSelector(selectBreadcrumb);
  const features = useSelector(selectFeatures);

  // Actions
  const showLoading = (loading = true) => dispatch(setGlobalLoading(loading));
  const hideLoading = () => dispatch(setGlobalLoading(false));

  const toggleSidebarCollapsed = () => dispatch(toggleSidebar());
  const setSidebarState = (collapsed) => dispatch(setSidebarCollapsed(collapsed));

  const showModal = (modalName) => dispatch(openModal(modalName));
  const hideModal = (modalName) => dispatch(closeModal(modalName));
  const hideAllModals = () => dispatch(closeAllModals());
  const isModalOpen = (modalName) => useSelector(state => selectModalOpen(state, modalName));

  const changeTheme = (newTheme) => dispatch(setTheme(newTheme));
  const switchTheme = () => dispatch(toggleTheme());

  const changeLanguage = (newLanguage) => dispatch(setLanguage(newLanguage));

  const updateOnlineStatus = (status) => dispatch(setOnlineStatus(status));

  const showError = (error) => dispatch(setGlobalError(error));
  const hideError = () => dispatch(clearGlobalError());

  const notify = (notification) => dispatch(addNotification(notification));
  const removeNotify = (id) => dispatch(removeNotification(id));
  const clearAllNotifications = () => dispatch(clearNotifications());
  const markAsRead = (id) => dispatch(markNotificationAsRead(id));
  const markAllAsRead = () => dispatch(markAllNotificationsAsRead());

  const updatePageTitle = (title) => dispatch(setPageTitle(title));
  const updateBreadcrumb = (breadcrumbItems) => dispatch(setBreadcrumb(breadcrumbItems));

  const toggleAppFeature = (featureName) => dispatch(toggleFeature(featureName));
  const setAppFeature = (feature, enabled) => dispatch(setFeature({ feature, enabled }));
  const isFeatureEnabled = (featureName) => useSelector(state => selectFeature(state, featureName));

  // Convenience methods
  const notifySuccess = (message, options = {}) => {
    notify({
      type: 'success',
      message,
      duration: 3000,
      ...options
    });
  };

  const notifyError = (message, options = {}) => {
    notify({
      type: 'error',
      message,
      duration: 5000,
      ...options
    });
  };

  const notifyInfo = (message, options = {}) => {
    notify({
      type: 'info',
      message,
      duration: 4000,
      ...options
    });
  };

  const notifyWarning = (message, options = {}) => {
    notify({
      type: 'warning',
      message,
      duration: 4000,
      ...options
    });
  };

  return {
    // State
    globalLoading,
    sidebarCollapsed,
    modals,
    theme,
    language,
    isOnline,
    globalError,
    notifications,
    unreadCount,
    pageTitle,
    breadcrumb,
    features,

    // Actions
    showLoading,
    hideLoading,
    toggleSidebarCollapsed,
    setSidebarState,
    showModal,
    hideModal,
    hideAllModals,
    isModalOpen,
    changeTheme,
    switchTheme,
    changeLanguage,
    updateOnlineStatus,
    showError,
    hideError,
    notify,
    removeNotify,
    clearAllNotifications,
    markAsRead,
    markAllAsRead,
    updatePageTitle,
    updateBreadcrumb,
    toggleAppFeature,
    setAppFeature,
    isFeatureEnabled,

    // Convenience methods
    notifySuccess,
    notifyError,
    notifyInfo,
    notifyWarning
  };
};

export default useApp;
