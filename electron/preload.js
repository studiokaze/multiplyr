"use strict";

const { contextBridge, ipcRenderer } = require("electron");

// Deliberately narrow: the onboarding page can save a key (validated in the
// main process), read a masked hint, and dismiss itself — nothing else. No
// filesystem, no shell, no node in the renderer.
contextBridge.exposeInMainWorld("multiplyr", {
  getKeyHint: () => ipcRenderer.invoke("key:get"),
  saveKey: (key) => ipcRenderer.invoke("key:save", key),
  skip: () => ipcRenderer.invoke("onboarding:skip"),
  platform: process.platform,
});
