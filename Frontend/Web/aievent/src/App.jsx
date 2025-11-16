import { Provider } from 'react-redux'
import { store } from './store'
import { Toaster } from 'react-hot-toast'
import useRouterElement from './routes/useRouterElement'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchUnreadCount } from './store/slices/notificationsSlice'

// Function to refresh unread count periodically
const useNotificationRefresh = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    console.log('useNotificationRefresh effect triggered, isAuthenticated:', isAuthenticated);
    let intervalId;
    
    if (isAuthenticated) {
      console.log('User is authenticated, setting up notification refresh');
      // Fetch unread count immediately
      console.log('Fetching initial unread count');
      dispatch(fetchUnreadCount());
      
      // Refresh every 30 seconds
      intervalId = setInterval(() => {
        console.log('Fetching periodic unread count');
        dispatch(fetchUnreadCount());
      }, 30000);
    }
    
    return () => {
      console.log('Cleaning up notification refresh interval');
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAuthenticated, dispatch]);
};

function App() {
  const routerElement = useRouterElement();
  
  // Refresh notification count periodically
  useNotificationRefresh();

  return (
    <div className="App">
      {routerElement}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          success: {
            style: {
              background: '#10b981',
              color: '#ffffff',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
              color: '#ffffff',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#ef4444',
            },
          },
        }}
      />
    </div>
  );
}

// Wrap the App component with the Redux Provider
export default function AppWrapper() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}