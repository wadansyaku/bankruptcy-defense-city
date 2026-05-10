import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { installGameDebugHooks } from "./game/state/gameStore";
import "./styles/app.css";

installGameDebugHooks();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
