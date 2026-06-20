import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress unhandled rejections thrown by browser wallet extensions (Backpack, Rabby, etc.)
// These extensions try to scan transactions and fail on cross-origin frames — not an app error.
window.addEventListener('unhandledrejection', (event) => {
  const stack = event.reason?.stack || '';
  const msg = event.reason?.message || '';
  if (stack.includes('chrome-extension://') || msg.includes('chrome-extension://')) {
    event.preventDefault();
  }
}, true);

createRoot(document.getElementById("root")!).render(<App />);
