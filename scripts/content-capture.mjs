/**
 * Captura cruda de una web publicada, para la biblioteca de Content: la
 * interfaz real, sin mockup ni retoque. Usa el Chrome instalado por el
 * protocolo de DevTools (Node 22 trae WebSocket), asi emula un celular de
 * verdad: la ventana de Chrome de escritorio no baja de ~500px de ancho.
 *
 *   node scripts/content-capture.mjs <url> <salida.png> [--viewport mobile|tablet|desktop] [--full] [--wait 2500]
 *
 * Despues se sube con categoria capture y origen real (ver el aviso al final).
 * CHROME_PATH pisa la ruta de Chrome si no esta en el lugar de siempre.
 */

import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const VIEWPORTS = {
  mobile: { width: 390, height: 844, deviceScaleFactor: 3, mobile: true },
  tablet: { width: 820, height: 1180, deviceScaleFactor: 2, mobile: true },
  desktop: { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false },
};

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};
const [url, output] = args.filter((arg, index) => !arg.startsWith("--") && !args[index - 1]?.match(/^--(viewport|wait)$/));
const viewportName = option("viewport", "mobile");
const viewport = VIEWPORTS[viewportName];
const wait = Number(option("wait", "2500"));

if (!url || !output || !viewport) {
  console.error("Uso: node scripts/content-capture.mjs <url> <salida.png> [--viewport mobile|tablet|desktop] [--full] [--wait ms]");
  process.exit(1);
}

const chromePath = CHROME_PATHS.find((candidate) => candidate && existsSync(candidate));
if (!chromePath) throw new Error("No encontre Chrome; pasalo en CHROME_PATH.");

const profile = mkdtempSync(path.join(os.tmpdir(), "content-capture-"));
const chrome = spawn(chromePath, [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  "--disable-breakpad",
  "--disable-crash-reporter",
  "--remote-debugging-port=0",
  `--user-data-dir=${profile}`,
  "about:blank",
]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Chrome anota el puerto elegido en DevToolsActivePort dentro del perfil.
async function debuggingPort() {
  const file = path.join(profile, "DevToolsActivePort");
  for (let attempt = 0; attempt < 100; attempt++) {
    if (existsSync(file)) return readFileSync(file, "utf8").split("\n")[0].trim();
    await sleep(100);
  }
  throw new Error("Chrome no abrio el puerto de DevTools.");
}

function connect(socketUrl) {
  const socket = new WebSocket(socketUrl);
  const pending = new Map();
  const listeners = new Map();
  let nextId = 1;

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    } else if (message.method) {
      listeners.get(message.method)?.(message.params);
    }
  });

  return new Promise((resolve, reject) => {
    socket.addEventListener("error", reject);
    socket.addEventListener("open", () =>
      resolve({
        send: (method, params = {}) =>
          new Promise((done, fail) => {
            const id = nextId++;
            pending.set(id, { resolve: done, reject: fail });
            socket.send(JSON.stringify({ id, method, params }));
          }),
        once: (method) => new Promise((done) => listeners.set(method, done)),
        close: () => socket.close(),
      }),
    );
  });
}

try {
  const port = await debuggingPort();
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((target) => target.type === "page");
  const cdp = await connect(page.webSocketDebuggerUrl);

  await cdp.send("Page.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", viewport);
  if (viewport.mobile) {
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true });
    await cdp.send("Emulation.setUserAgentOverride", {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });
  }

  const loaded = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url });
  await loaded;
  // Fuentes, imagenes diferidas y animaciones de entrada.
  await sleep(wait);

  const { data } = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: flag("full") });
  writeFileSync(output, Buffer.from(data, "base64"));
  cdp.close();
  // Cierre ordenado: matar el proceso deja el perfil tomado en Windows.
  const browser = await connect((await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl);
  await browser.send("Browser.close").catch(() => {});

  const scale = viewport.deviceScaleFactor;
  console.log(`${output} (${viewportName}, ${viewport.width * scale}px de ancho)`);
  console.log(
    "Subir a la biblioteca como captura real:\n" +
      `  curl -F file=@${output} -F scope=portfolio -F kind=recurso -F category=capture -F origin=real -F viewport=${viewportName} ` +
      `-F projectSlug=<slug> -F "sourceUrl=${url}" -F "note=<que se ve>" -H "Authorization: Bearer $CONTENT_MCP_TOKEN" <origen>/api/content/library\n` +
      "  Agregar -F demoData=true si muestra cifras, precios o testimonios de demo.",
  );
} finally {
  const exited = new Promise((resolve) => chrome.once("exit", resolve));
  chrome.kill();
  await Promise.race([exited, sleep(3000)]);
  // En Windows Chrome suelta el perfil un rato despues; si sigue tomado, queda en temp.
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  } catch {
    console.warn(`No pude borrar el perfil temporal ${profile}; se puede borrar a mano.`);
  }
}
