import { createRoot } from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './hooks/useTheme'
import { LichessAuthProvider } from './hooks/useLichessAuth'
import { ErrorBoundary } from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
    <ErrorBoundary>
      <LichessAuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </LichessAuthProvider>
    </ErrorBoundary>
)
