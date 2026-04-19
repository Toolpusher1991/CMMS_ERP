import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/hp-tokens.css"; // H&P Design Tokens
import "./index.css";
import "./styles/ipad-optimizations.css"; // iPad & Tablet Optimierungen
import App from "./App.tsx";
import "./lib/sentry.ts"; // Initialize Sentry

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
