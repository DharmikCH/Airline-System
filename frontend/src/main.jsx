// Global styles are imported first, before any component. Vite injects CSS in
// import order, and page styles (like .narrow) must come after the base rules
// they refine (like .container), or the base rules silently win.
import './styles/tokens.css';
import './styles/global.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import { ToastProvider } from './components/Toaster.jsx';

// Order matters: AuthProvider uses both the router (to redirect when a session
// expires) and toasts (to say so), so it sits inside both.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);
