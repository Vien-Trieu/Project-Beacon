import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from "@azure/msal-react";

import './index.css'
import "./styles/globals.css";

import App from './App.tsx'
import { msalConfig } from "./auth/msalConfig.ts";

async function bootstrap() {
  const msalInstance = new PublicClientApplication(msalConfig);

  await msalInstance.initialize();

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </StrictMode>
  );
}

bootstrap();