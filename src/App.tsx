import { BrowserRouter } from 'react-router-dom';
import { AiJobProvider } from './aiJobs/AiJobContext';
import { AuthProvider } from './auth/AuthContext';
import { NotificationProvider } from './notifications/NotificationContext';
import { Toaster } from '@/components/ui/sonner';
import AppRoutes from './routes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AiJobProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </AiJobProvider>
        <Toaster position="top-center" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
