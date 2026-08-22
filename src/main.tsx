import { createRoot } from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './hooks/useTheme'
import { LichessAuthProvider } from './hooks/useLichessAuth'

createRoot(document.getElementById('root')!).render(
    <LichessAuthProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </LichessAuthProvider>
)
