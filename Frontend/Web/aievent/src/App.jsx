import { Provider } from 'react-redux'
import { store } from './store'
import { Toaster } from 'react-hot-toast'
import useRouterElement from './routes/useRouterElement'

function App() {
  const routerElement = useRouterElement();

  return (
    <Provider store={store}>
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
    </Provider>
  );
}

export default App