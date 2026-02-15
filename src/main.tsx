import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/ipad-optimizations.css"; // iPad & Tablet Optimierungen
import App from "./App.tsx";
import "./lib/sentry.ts"; // Initialize Sentry

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
