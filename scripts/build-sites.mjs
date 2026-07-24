import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const client = path.join(dist, 'client');
const server = path.join(dist, 'server');

if (path.dirname(dist) !== root || path.basename(dist) !== 'dist') {
  throw new Error('안전하지 않은 빌드 경로입니다.');
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(client, { recursive: true });
fs.mkdirSync(server, { recursive: true });

function copyTree(source, target) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) copyTree(sourcePath, targetPath);
    else if (entry.isFile()) fs.copyFileSync(sourcePath, targetPath);
  }
}

for (const file of ['index.html', 'manifest.webmanifest', 'sw.js', '.nojekyll']) {
  fs.copyFileSync(path.join(root, file), path.join(client, file));
}
for (const directory of ['css', 'icons', 'js']) {
  copyTree(path.join(root, directory), path.join(client, directory));
}

const worker = `const worker = {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || request.method !== 'GET') return response;

    const acceptsHtml = request.headers.get('accept')?.includes('text/html');
    if (!acceptsHtml) return response;

    const fallbackUrl = new URL('/index.html', request.url);
    return env.ASSETS.fetch(new Request(fallbackUrl, request));
  },
};

export default worker;
`;

fs.writeFileSync(path.join(server, 'index.js'), worker, 'utf8');
console.log('Sites 배포 빌드 완료: 정적 자산과 Worker 엔트리 생성');
