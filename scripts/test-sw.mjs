import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const listeners = new Map();
const deleted = [];
const stores = new Map();
const writes = [];
let fetched = 0;
let fetchImpl = async () => { throw new Error('offline'); };

const requestKey = request => typeof request === 'string' ? request : request.url;
const cacheFor = name => {
  if (!stores.has(name)) stores.set(name, new Map());
  const entries = stores.get(name);
  return {
    async addAll(files) { files.forEach(file => entries.set(file, { shell: true, url: file })); },
    async match(request) { return entries.get(requestKey(request)); },
    async put(request, response) {
      await new Promise(resolve => setTimeout(resolve, 5));
      entries.set(requestKey(request), response);
      writes.push({ cache: name, request: requestKey(request) });
    },
  };
};

const context = vm.createContext({
  URL,
  Response: { error: () => ({ type: 'error' }) },
  location: { origin: 'https://example.test' },
  setTimeout,
  fetch: async request => { fetched += 1; return fetchImpl(request); },
  caches: {
    async open(name) { return cacheFor(name); },
    async keys() { return ['other-app-v1', 'wuwa-planner-v14', 'wuwa-planner-v15', 'wuwa-planner-v16', 'wuwa-planner-v17', 'wuwa-planner-v18', 'wuwa-planner-images-v1']; },
    async delete(name) { deleted.push(name); stores.delete(name); return true; },
  },
  self: {
    addEventListener(type, listener) { listeners.set(type, listener); },
    async skipWaiting() {},
    clients: { async claim() {} },
  },
});

vm.runInContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), context, { filename: 'sw.js' });

async function dispatchLifecycle(type) {
  let pending;
  listeners.get(type)({ waitUntil(promise) { pending = promise; } });
  await pending;
}

async function dispatchFetch(request) {
  let response;
  listeners.get('fetch')({ request, respondWith(promise) { response = promise; } });
  return response ? response : null;
}

await dispatchLifecycle('install');
const shell = stores.get('wuwa-planner-v19');
assert(shell?.has('./index.html'), '설치 시 앱 셸을 캐시해야 합니다.');
assert(shell?.has('./js/app.js'), '설치 시 앱 로직을 캐시해야 합니다.');
assert(shell?.has('./manifest.webmanifest'), '설치 시 앱 매니페스트를 캐시해야 합니다.');

await dispatchLifecycle('activate');
assert.deepEqual(deleted, ['wuwa-planner-v14', 'wuwa-planner-v15', 'wuwa-planner-v16', 'wuwa-planner-v17', 'wuwa-planner-v18'], '자체 구버전 캐시만 삭제해야 합니다.');

const opaqueImage = { ok: false, type: 'opaque', clone() { return this; } };
fetchImpl = async () => opaqueImage;
const imageResponse = await dispatchFetch({
  url: 'https://cdn.example.test/character.png', method: 'GET', destination: 'image', mode: 'no-cors',
});
assert.equal(imageResponse, opaqueImage, '외부 이미지 응답을 반환해야 합니다.');
assert(writes.some(write => write.cache === 'wuwa-planner-images-v1'), 'opaque 외부 이미지를 전용 캐시에 저장해야 합니다.');

const networkCss = { ok: true, type: 'basic', clone() { return this; } };
fetchImpl = async () => networkCss;
const cssRequest = { url: 'https://example.test/css/style.css', method: 'GET', destination: 'style', mode: 'cors' };
assert.equal(await dispatchFetch(cssRequest), networkCss, '같은 출처 네트워크 응답을 반환해야 합니다.');
assert(writes.some(write => write.cache === 'wuwa-planner-v19' && write.request === cssRequest.url),
  '같은 출처 정상 응답을 현재 셸 캐시에 저장해야 합니다.');

const cachedJs = { ok: true, type: 'basic', cached: true };
stores.get('wuwa-planner-v19').set('https://example.test/js/app.js', cachedJs);
fetchImpl = async () => { throw new Error('offline'); };
const jsResponse = await dispatchFetch({
  url: 'https://example.test/js/app.js', method: 'GET', destination: 'script', mode: 'cors',
});
assert.equal(jsResponse, cachedJs, '오프라인에서는 현재 셸 캐시의 자산을 반환해야 합니다.');

const beforeNonImage = fetched;
const ignored = await dispatchFetch({
  url: 'https://api.example.test/data', method: 'GET', destination: '', mode: 'cors',
});
assert.equal(ignored, null, '외부 비이미지 요청을 가로채지 않아야 합니다.');
assert.equal(fetched, beforeNonImage, '외부 비이미지 요청에 서비스 워커 fetch를 호출하지 않아야 합니다.');

console.log('서비스 워커 테스트 통과: 캐시 격리, 저장 완료, 외부 이미지, 오프라인 폴백');
