import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'

console.log("App initialization started...");

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error("Root element not found");

  createRoot(rootElement).render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>,
  );
  console.log("React render cycle initiated.");
} catch (error) {
  console.error("Critical error during app mount:", error);
  document.body.innerHTML = `<div style="padding: 20px; color: red;">アプリケーションの起動に失敗しました。詳細: ${error}</div>`;
}
