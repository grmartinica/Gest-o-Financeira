import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('main.tsx: Starting React mount');

const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('main.tsx: Root element found, mounting...');
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('main.tsx: Render called');
  } catch (error) {
    console.error('main.tsx: Error during mount:', error);
    throw error;
  }
} else {
  console.error('main.tsx: Root element not found!');
}
