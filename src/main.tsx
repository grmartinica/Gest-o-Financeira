import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

alert('Script principal carregado!');
console.log('Main.tsx executing...');
const rootElement = document.getElementById('root');
if (rootElement) {
  rootElement.innerHTML = '<div style="padding: 20px; font-family: sans-serif;"><h1>React está tentando iniciar...</h1></div>';
}

function TestApp() {
  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#10b981' }}>Vite + React + Vercel</h1>
      <p>Se você vê isso, o React 18 está funcionando!</p>
      <div style={{ marginTop: '20px', padding: '20px', background: '#f4f4f5', borderRadius: '12px', fontSize: '12px' }}>
        <p>User Agent: {navigator.userAgent}</p>
      </div>
    </div>
  );
}

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <TestApp />
    </StrictMode>
  );
}
