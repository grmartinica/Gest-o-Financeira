import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('main.tsx: Script loaded');

const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('main.tsx: Root element found, creating root...');
  try {
    const root = createRoot(rootElement);
    console.log('main.tsx: Rendering App component...');
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('main.tsx: App component rendered');
  } catch (error) {
    console.error('main.tsx: Error rendering app:', error);
  }
} else {
  console.error('main.tsx: Root element not found!');
}
