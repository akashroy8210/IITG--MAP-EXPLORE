import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.jsx'
// document.addEventListener("contextmenu", (e) => {
//   e.preventDefault();
// });

// // ===============================
// // BLOCK COMMON DEVTOOLS SHORTCUTS
// // ===============================

// document.addEventListener("keydown", (e) => {
//   const key = e.key.toLowerCase();

//   // F12
//   if (e.key === "F12") {
//     e.preventDefault();
//     return;
//   }

//   // Ctrl + Shift + I
//   // Ctrl + Shift + J
//   // Ctrl + Shift + C
//   if (
//     e.ctrlKey &&
//     e.shiftKey &&
//     ["i", "j", "c"].includes(key)
//   ) {
//     e.preventDefault();
//     return;
//   }

//   // Ctrl + U
//   if (e.ctrlKey && key === "u") {
//     e.preventDefault();
//     return;
//   }
// });

// ===============================
// START REACT APP
// ===============================

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
