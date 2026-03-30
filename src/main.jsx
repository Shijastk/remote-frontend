import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// queueMicrotask Polyfill for older TVs (pre-Chrome 71)
if (!window.queueMicrotask) {
  window.queueMicrotask = function(cb) {
    Promise.resolve().then(cb);
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

