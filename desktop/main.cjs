const { app, BrowserWindow, session, protocol, net } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

protocol.registerSchemesAsPrivileged([
  {
    scheme: "registromedia",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);
app.setAppUserModelId("it.registromedia.app");
// Preserve the data directory used before the visible rebrand.
const legacyData = path.join(app.getPath("appData"), "RegistroMedia");
require("node:fs").mkdirSync(legacyData, { recursive: true });
app.setPath("userData", legacyData);
const smokeTest = process.argv.includes("--smoke-test");
if (smokeTest)
  app.setPath(
    "userData",
    require("node:fs").mkdtempSync(
      path.join(app.getPath("temp"), "registromedia-desktop-test-"),
    ),
  );
if (!app.requestSingleInstanceLock()) app.quit();
else {
  let window;
  const root = path.join(__dirname, "..");
  const files = new Set([
    "index.html",
    "app.mjs",
    "model.mjs",
    "vault.mjs",
    "style.css",
    "icon.svg",
    "icon-192.png",
    "icon-512.png",
    "apple-touch-icon.png",
    "manifest.json",
    "theme.js",
  ]);
  async function createWindow() {
    window = new BrowserWindow({
      title: "Votiva · Voti e medie",
      icon: path.join(root, "icon-192.png"),
      width: 1280,
      height: 850,
      minWidth: 380,
      minHeight: 600,
      autoHideMenuBar: true,
      backgroundColor: "#f7f8fc",
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });
    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window.webContents.on("will-navigate", (event) => event.preventDefault());
    window.webContents.on("will-attach-webview", (event) =>
      event.preventDefault(),
    );
    window.on("closed", () => {
      window = null;
    });
    if (smokeTest) {
      window.webContents.once("did-finish-load", async () => {
        try {
          await window.webContents.executeJavaScript(
            `new Promise(resolve=>{const check=()=>{if(document.getElementById('loading-view').hidden)resolve();else setTimeout(check,25);};check();})`,
          );
          const result = await window.webContents.executeJavaScript(
            `({authReady:!document.getElementById('auth-view').hidden, cryptoReady:!!crypto.subtle, storageReady:!!indexedDB})`,
          );
          if (!result.authReady || !result.cryptoReady || !result.storageReady)
            throw Error(
              "Interfaccia non inizializzata: " + JSON.stringify(result),
            );
          console.log("DESKTOP_SMOKE_OK", JSON.stringify(result));
          app.exit(0);
        } catch (error) {
          console.error(error);
          if (process.env.CI)
            console.error(
              "::error title=Desktop smoke failed::" +
                String(error.message)
                  .replace(/%/g, "%25")
                  .replace(/\n/g, "%0A"),
            );
          app.exit(1);
        }
      });
      setTimeout(() => {
        console.error("Timeout avvio desktop");
        app.exit(1);
      }, 90000).unref();
    }
    try {
      await window.loadURL("registromedia://app/index.html");
    } catch (error) {
      console.error("Avvio non riuscito:", error.message);
      if (smokeTest) app.exit(1);
    }
  }
  app.whenReady().then(async () => {
    // The desktop renderer works entirely offline.
    session.defaultSession.webRequest.onBeforeRequest(
      { urls: ["http://*/*", "https://*/*"] },
      (_details, callback) => callback({ cancel: true }),
    );
    protocol.handle("registromedia", (request) => {
      const url = new URL(request.url),
        file = url.pathname.slice(1);
      if (url.host !== "app" || !files.has(file))
        return new Response("Not found", { status: 404 });
      return net.fetch(pathToFileURL(path.join(root, file)).href);
    });
    session.defaultSession.setPermissionRequestHandler(
      (_contents, _permission, callback) => callback(false),
    );
    session.defaultSession.setPermissionCheckHandler(() => false);
    session.defaultSession.on("will-download", (_event, item) => {
      item.setSaveDialogOptions({
        title: "Esporta backup cifrato",
        defaultPath: path.join(
          app.getPath("documents"),
          "registromedia-cifrato.json",
        ),
        filters: [{ name: "Backup RegistroMedia", extensions: ["json"] }],
      });
    });
    createWindow();
    app.on("activate", () => {
      if (!BrowserWindow.getAllWindows().length) createWindow();
    });
  });
  app.on("second-instance", () => {
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
