import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider } from './context/SettingsContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <SettingsProvider>
            <AppRoutes />
          </SettingsProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
