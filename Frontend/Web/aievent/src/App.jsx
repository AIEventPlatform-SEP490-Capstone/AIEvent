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
            style: {
              background: '#ffffff',
              color: '#000000',
            },
          }}
        />
      </div>
    </Provider>
  );
}

export default App