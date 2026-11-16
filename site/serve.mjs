import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, isAbsolute, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(fileURLToPath(new URL('./dist/', import.meta.url)));
const port = Number(process.env.PORT ?? 4173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT inválida.');

createServer(async (req, res) => {
  const fail = (status) => res.writeHead(status).end();
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD');
    return fail(405);
  }
  let pathname;
  try {
    pathname = decodeURIComponent(req.url.split('?')[0]);
  } catch {
    return fail(400);
  }
  if (!pathname.startsWith('/') || /[\\:\x00-\x1f]/.test(pathname) ||
      pathname.split('/').some(segment => segment === '..')) return fail(403);

  try {
    const file = await realpath(join(root, pathname === '/' ? 'index.html' : pathname));
    const local = relative(root, file);
    if (local === '..' || local.startsWith('..' + sep) || isAbsolute(local)) return fail(403);
    if (!(await stat(file)).isFile()) return fail(404);

    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': types[extname(file).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': body.length,
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (err) {
    fail(['ENOENT', 'ENOTDIR'].includes(err.code) ? 404 : 500);
  }
}).listen(port, '127.0.0.1', function () {
  console.log(`Trilhas da Psicologia em http://127.0.0.1:${this.address().port}/`);
});
