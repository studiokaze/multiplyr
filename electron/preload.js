"use strict";

const { contextBridge, ipcRenderer } = require("electron");

// Deliberately narrow: greeting name and API origin — nothing else. No
// filesystem, no shell, no node in the renderer.
contextBridge.exposeInMainWorld("multiplyer", {
  // OS account name, for the home-screen greeting. Read in main — the
  // renderer stays node-free.
  userName: () => ipcRenderer.invoke("user:name"),
  // Where agent requests go: the hosted API in production, "" in mock mode.
  apiBase: () => ipcRenderer.invoke("api:base"),
  // Title-bar menu labels pop the real native menus.
  menuPopup: (label, x) => ipcRenderer.invoke("menu:popup", label, x),
  platform: process.platform,
});
