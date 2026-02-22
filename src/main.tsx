import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.onerror = function(message, source, lineno, colno, error) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; color: red; font-family: sans-serif;">
        <h1>Erro de Inicialização</h1>
        <p>${message}</p>
        <pre>${error?.stack || ''}</pre>
      </div>
    `;
  }
  return false;
};

console.log('Main.tsx executing...');
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
