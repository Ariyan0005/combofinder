import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
    const serviceWorkerUrl = new URL("sw.js", baseUrl);
    navigator.serviceWorker
      .register(serviceWorkerUrl, { scope: import.meta.env.BASE_URL })
      .catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(<App />);
