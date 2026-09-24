import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const pub = resolve(root, "public");
const tmp = resolve(root, "scripts", ".gen-tmp");
const ogDir = resolve(pub, "og");
const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";

mkdirSync(tmp, { recursive: true });
mkdirSync(ogDir, { recursive: true });

function shot(html, outFile, w, h) {
  const htmlFile = resolve(tmp, "page.html");
  writeFileSync(htmlFile, html, "utf8");
  execSync(`"${chrome}" --headless=new --disable-gpu --no-sandbox --hide-scrollbars --force-device-scale-factor=1 --window-size=${w},${h} --screenshot=${outFile} file:///${htmlFile.replace(/\\/g, "/")}`, {
    stdio: "ignore",
  });
  console.log("ok", outFile);
}

function banner(eyebrow, title, sub) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:1200px;height:630px;overflow:hidden;
      background:linear-gradient(135deg,#101216 0%,#171a20 55%,#1d212a 100%);
      font-family:'Segoe UI',system-ui,-apple-system,sans-serif;
      display:flex;flex-direction:column;justify-content:space-between;padding:56px 72px}
    .top{display:flex;align-items:center;gap:14px}
    .mark{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#4f7cff,#7b5bff);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:20px}
    .brand{color:#98a2b8;font-size:21px;font-weight:700;letter-spacing:2.5px}
    .body .eyebrow{color:#5b8cff;font-size:21px;font-weight:700;letter-spacing:4px;text-transform:uppercase;margin-bottom:16px}
    .body .title{color:#fff;font-size:78px;font-weight:800;letter-spacing:-1.5px;line-height:1.04}
    .body .sub{color:#aab2c5;font-size:26px;line-height:1.4;margin-top:20px;max-width:980px}
    .foot{display:flex;justify-content:space-between;align-items:center;color:#7d8598;font-size:20px;border-top:1px solid #262a33;padding-top:26px}
    .foot .right{color:#5b8cff;font-weight:700}
  </style></head><body>
    <div class="top"><div class="mark">OT</div><div class="brand">OFFICE TOOLKIT</div></div>
    <div class="body"><div class="eyebrow">${eyebrow}</div><div class="title">${title}</div><div class="sub">${sub}</div></div>
    <div class="foot"><span>officetoolkit.app</span><span class="right">FREE &middot; PRIVATE &middot; NO SIGNUP</span></div>
  </body></html>`;
}

const logos = { png: resolve(pub, "logo.png") };

function iconPage(size, bg) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0}
    body{width:${size}px;height:${size}px;overflow:hidden;background:${bg};display:flex;align-items:center;justify-content:center}
    img{width:${Math.round(size * 0.82)}px;height:${Math.round(size * 0.82)}px;object-fit:contain}
  </style></head><body><img src="file:///${logos.png.replace(/\\/g, "/")}"></body></html>`;
}

function pngToIco(files) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(files.length, 4);
  const entries = [];
  const chunks = [];
  let offset = 6 + files.length * 16;
  for (const { path, w, h } of files) {
    const png = readFileSync(path);
    const entry = Buffer.alloc(16);
    entry[0] = w >= 256 ? 0 : w;
    entry[1] = h >= 256 ? 0 : h;
    entry[2] = 0;
    entry[3] = 0;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    chunks.push(png);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...chunks]);
}

shot(banner("FREE ONLINE TOOL", "Sign PDF Online Free", "Draw, type, or upload your signature and sign any document in your browser."), resolve(ogDir, "e-signature.png"), 1200, 630);
shot(banner("FREE ONLINE TOOL", "Free GST Invoice Generator", "Line items, tax, and your logo — export a clean PDF in your browser."), resolve(ogDir, "invoice.png"), 1200, 630);
shot(banner("FREE &middot; PRIVATE &middot; NO SIGNUP", "Free E-signatures & GST Invoices", "Sign PDFs and build clean invoices entirely in your browser."), resolve(ogDir, "home.png"), 1200, 630);
shot(banner("OFFICE TOOLKIT", "Free office tools, made quietly useful", "E-signatures, invoices, and everyday paperwork — no account, no uploads."), resolve(ogDir, "default.png"), 1200, 630);

const pad = 32;
shot(iconPage(180, "#ffffff"), resolve(pub, "apple-touch-icon.png"), 180, 180);
shot(iconPage(32, "#ffffff"), resolve(tmp, "favicon-32.png"), 32, 32);
shot(iconPage(16, "#ffffff"), resolve(tmp, "favicon-16.png"), 16, 16);

const ico = pngToIco([
  { path: resolve(tmp, "favicon-16.png"), w: 16, h: 16 },
  { path: resolve(tmp, "favicon-32.png"), w: 32, h: 32 },
]);
writeFileSync(resolve(pub, "favicon.ico"), ico);
console.log("ok favicon.ico");