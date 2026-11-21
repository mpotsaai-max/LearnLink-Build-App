import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// One-time cleanup: older versions kept sample data, fake logins and simulated
// records in each visitor's own browser. Remove them so only real data is used.
try {
  if (!localStorage.getItem('learnlink_v2_clean')) {
    Object.keys(localStorage)
      .filter(k => k.startsWith('learnlink_'))
      .forEach(k => localStorage.removeItem(k));
    localStorage.setItem('learnlink_v2_clean', '1');
  }
} catch {
  // storage unavailable: nothing to clean
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
