import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./lib/auth-context";
import { ThemeProvider } from "./lib/theme-context";
import { TimerProvider } from "./lib/timer-context";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><AuthProvider><ThemeProvider><TimerProvider><App /></TimerProvider></ThemeProvider></AuthProvider></React.StrictMode>);
