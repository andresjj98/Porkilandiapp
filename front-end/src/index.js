import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import App from "./App";
import { InventoryProvider } from './contexts/InventoryContext';

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <InventoryProvider>
      <App />
    </InventoryProvider>
  </StrictMode>
);