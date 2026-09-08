const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

// Disable GPU acceleration if old Windows or low capability to guarantee Windows 7+ stability
if (process.platform === "win32") {
  const release = os.release().split(".");
  const major = parseInt(release[0], 10);
  const minor = parseInt(release[1], 10);
  // Windows 7 is 6.1, Windows 8 is 6.2, Windows 8.1 is 6.3
  if (major === 6 && minor <= 3) {
    app.disableHardwareAcceleration();
    app.commandLine.appendSwitch("disable-gpu");
    app.commandLine.appendSwitch("no-sandbox");
  }
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    frame: true, // Native window frame or custom
    backgroundColor: "#0b1329",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    icon: path.join(__dirname, "../public/icon.png"),
    show: false,
  });

  // Load from dev server or production dist
  const isDev = !app.isPackaged && process.env.NODE_ENV !== "production";
  if (isDev && process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// ----------------------------------------------------
// IPC Handlers for Native Desktop Capabilities
// ----------------------------------------------------

ipcMain.handle("app:info", () => {
  return {
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    osRelease: os.release(),
    isWindows7: process.platform === "win32" && os.release().startsWith("6.1"),
    hostname: os.hostname(),
    isPackaged: app.isPackaged,
  };
});

ipcMain.handle("window:minimize", () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle("window:maximize", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle("window:close", () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle("print:silent", async (event, options = {}) => {
  if (!mainWindow) return { success: false, error: "No window" };
  return new Promise((resolve) => {
    mainWindow.webContents.print(
      {
        silent: options.silent ?? false,
        printBackground: true,
        deviceName: options.deviceName || "",
      },
      (success, failureReason) => {
        resolve({ success, error: failureReason });
      }
    );
  });
});

ipcMain.handle("print:pdf", async (event, options = {}) => {
  if (!mainWindow) return { success: false, error: "No window" };
  try {
    const data = await mainWindow.webContents.printToPDF({
      printBackground: true,
      landscape: options.landscape ?? false,
      pageSize: options.pageSize ?? "A4",
    });
    
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: "حفظ التقرير كملف PDF",
      defaultPath: options.defaultPath || "تقرير_محاسبي.pdf",
      filters: [{ name: "PDF Documents", extensions: ["pdf"] }],
    });

    if (filePath) {
      fs.writeFileSync(filePath, data);
      return { success: true, filePath };
    }
    return { success: false, canceled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("dialog:saveFile", async (event, { data, filename, filterName, extension }) => {
  if (!mainWindow) return { success: false };
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: "تصدير ملف",
      defaultPath: filename,
      filters: [{ name: filterName || "Files", extensions: [extension || "dat"] }],
    });

    if (filePath) {
      if (typeof data === "string") {
        fs.writeFileSync(filePath, data, "utf8");
      } else {
        fs.writeFileSync(filePath, Buffer.from(data));
      }
      return { success: true, filePath };
    }
    return { success: false, canceled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("dialog:openFile", async (event, { filterName, extension }) => {
  if (!mainWindow) return { success: false };
  try {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: "استيراد ملف",
      properties: ["openFile"],
      filters: [{ name: filterName || "Files", extensions: [extension || "json"] }],
    });

    if (filePaths && filePaths.length > 0) {
      const content = fs.readFileSync(filePaths[0], "utf8");
      return { success: true, content, filePath: filePaths[0] };
    }
    return { success: false, canceled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
