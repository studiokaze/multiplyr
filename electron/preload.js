"use strict";

const { contextBridge, ipcRenderer } = require("electron");

// Deliberately narrow: the onboarding page can save a key (validated in the
// main process), read a masked hint, and dismiss itself — nothing else. No
// filesystem, no shell, no node in the renderer.
contextBridge.exposeInMainWorld("multiplyer", {
  getKeyHint: () => ipcRenderer.invoke("key:get"),
  saveKey: (key) => ipcRenderer.invoke("key:save", key),
  skip: () => ipcRenderer.invoke("onboarding:skip"),
  // OS account name, for the home-screen greeting. Read in main — the
  // renderer stays node-free.
  userName: () => ipcRenderer.invoke("user:name"),
  // Where agent requests go: the hosted API in production, "" in mock mode.
  apiBase: () => ipcRenderer.invoke("api:base"),
  platform: process.platform,
});
