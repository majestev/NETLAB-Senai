import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL("../out/", import.meta.url));
const PORTA = Number(process.argv[2] ?? 3100);

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

async function arquivo(p) {
  try {
    const s = await stat(p);
    return s.isFile() ? p : null;
  } catch {
    return null;
  }
}

async function resolver(caminho) {
  const base = join(RAIZ, normalize(caminho).replace(/^(\.\.[/\\])+/, ""));
  return (
    (await arquivo(base)) ??
    (await arquivo(`${base.replace(/\/$/, "")}.html`)) ??
    (await arquivo(join(base, "index.html")))
  );
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  const alvo = await resolver(decodeURIComponent(pathname));

  if (!alvo) {
    const notFound = await arquivo(join(RAIZ, "404.html"));
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    if (notFound) return createReadStream(notFound).pipe(res);
    return res.end("404");
  }

  res.writeHead(200, {
    "content-type": TIPOS[extname(alvo)] ?? "application/octet-stream",
  });
  createReadStream(alvo).pipe(res);
}).listen(PORTA, () => {
  console.log(`out/ em http://127.0.0.1:${PORTA}`);
});
