import { createRoot } from 'react-dom/client'
import { StreamlitProvider } from 'streamlit-component-lib-react-hooks'
import MyComponent from './MyComponent'
import './index.css'

createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
  <StreamlitProvider>
    <MyComponent />
  </StreamlitProvider>,
  // </React.StrictMode>,
)
