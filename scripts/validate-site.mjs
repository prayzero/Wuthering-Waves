import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const safeId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(value);
const validDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const required = [
  'index.html', 'css/style.css', 'js/data.js', 'js/app.js', 'sw.js',
  'manifest.webmanifest', 'icons/app-180.v2.png', 'icons/app-192.v2.png', 'icons/app-512.v2.png',
];
required.forEach(file => check(exists(file), `필수 파일 누락: ${file}`));

for (const file of ['js/data.js', 'js/app.js', 'sw.js']) {
  try { new vm.Script(read(file), { filename: file }); }
  catch (error) { errors.push(`${file} 구문 오류: ${error.message}`); }
}

let manifest = null;
try { manifest = JSON.parse(read('manifest.webmanifest')); }
catch (error) { errors.push(`manifest JSON 오류: ${error.message}`); }

if (manifest) {
  ['name', 'short_name', 'start_url', 'display', 'icons'].forEach(key =>
    check(manifest[key], `manifest 필수 키 누락: ${key}`));
  check(Array.isArray(manifest.icons) && manifest.icons.length > 0, 'manifest 아이콘이 없습니다.');
  const manifestUrl = new URL('https://example.test/manifest.webmanifest');
  const startUrl = new URL(manifest.start_url, manifestUrl);
  const scopeUrl = new URL(manifest.scope || './', manifestUrl);
  check(startUrl.href.startsWith(scopeUrl.href), 'manifest start_url이 scope 밖에 있습니다.');
  const startFile = startUrl.pathname.replace(/^\//, '') || 'index.html';
  check(exists(startFile), `manifest start_url 파일 누락: ${manifest.start_url}`);
  for (const icon of manifest.icons || []) {
    check(!String(icon.purpose || '').split(/\s+/).includes('maskable'), '전용 안전 여백 파일 없는 maskable 아이콘 선언이 있습니다.');
    check(exists(icon.src), `manifest 아이콘 파일 누락: ${icon.src}`);
    check(icon.type === 'image/png', `manifest 아이콘 MIME 오류: ${icon.src}`);
    if (!exists(icon.src) || icon.type !== 'image/png') continue;
    const png = fs.readFileSync(path.join(root, icon.src));
    const signature = png.subarray(0, 8).toString('hex');
    check(signature === '89504e470d0a1a0a', `PNG 서명 오류: ${icon.src}`);
    if (png.length >= 24) {
      const actual = `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`;
      check(icon.sizes === actual, `아이콘 크기 불일치: ${icon.src} (${icon.sizes} != ${actual})`);
    }
  }
}

const html = read('index.html');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
const seenIds = new Set();
ids.forEach(id => {
  check(!seenIds.has(id), `HTML 중복 id: ${id}`);
  seenIds.add(id);
});

const htmlLocalAssets = new Set();
for (const match of html.matchAll(/\b(?:src|href)=(['"])(.*?)\1/g)) {
  const value = match[2].split(/[?#]/)[0];
  if (!value || /^(?:https?:|data:|#)/.test(value)) continue;
  check(exists(value), `HTML 로컬 자산 누락: ${value}`);
  htmlLocalAssets.add(value.replace(/^\.\//, ''));
}
for (const match of html.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>/g)) {
  const forMatch = match[1].match(/\bfor=(['"])(.*?)\1/);
  if (forMatch) check(seenIds.has(forMatch[2]), `label for 대상 누락: ${forMatch[2]}`);
  else check(/<(?:input|select|textarea)\b/.test(match[2]), `입력과 연결되지 않은 label: ${match[2].replace(/<[^>]+>/g, '').trim()}`);
}
for (const match of read('css/style.css').matchAll(/url\((['"]?)([^)'"\s]+)\1\)/g)) {
  const value = match[2].split(/[?#]/)[0];
  if (/^(?:https?:|data:)/.test(value)) continue;
  check(exists(path.normalize(path.join('css', value))), `CSS 로컬 자산 누락: ${value}`);
}

const sw = read('sw.js');
const shellMatch = sw.match(/const APP_SHELL\s*=\s*\[([\s\S]*?)\];/);
check(shellMatch, '서비스 워커 APP_SHELL을 찾을 수 없습니다.');
const shellAssets = new Set();
for (const match of shellMatch?.[1].matchAll(/['"]\.\/([^'"]*)['"]/g) || []) {
  const relative = match[1] || 'index.html';
  check(exists(relative), `APP_SHELL 파일 누락: ${relative}`);
  shellAssets.add(relative);
}
htmlLocalAssets.forEach(asset => check(shellAssets.has(asset), `HTML 핵심 자산이 APP_SHELL에 없습니다: ${asset}`));
check(sw.includes("const CACHE_PREFIX = 'wuwa-planner-'"), '서비스 워커 캐시 접두사가 없습니다.');
check(sw.includes("k.startsWith(CACHE_PREFIX)"), '서비스 워커가 자체 캐시만 정리하지 않습니다.');
check(sw.includes("e.request.destination !== 'image'"), '외부 이미지 런타임 캐시가 없습니다.');
check(sw.includes("e.request.mode === 'navigate'"), 'HTML 폴백이 탐색 요청으로 제한되지 않았습니다.');

const cssWithoutComments = read('css/style.css').replace(/\/\*[\s\S]*?\*\//g, '');
let depth = 0;
for (const char of cssWithoutComments.replace(/(['"])(?:\\.|(?!\1).)*\1/g, '')) {
  if (char === '{') depth += 1;
  if (char === '}') depth -= 1;
  check(depth >= 0, 'CSS 닫는 중괄호가 더 많습니다.');
}
check(depth === 0, 'CSS 중괄호 짝이 맞지 않습니다.');

try {
  const context = vm.createContext({});
  vm.runInContext(`${read('js/data.js')}\n;globalThis.__qa = {
    CHARACTERS, BANNERS, CONTENT_DEFAULTS, ELEMENTS, WEAPONS, CHAR_MATS, ASC_MATS,
    SIG_WEAPONS, FORGE_FAMILIES, DROP_FAMILIES, WEEKLY_BOSS_MATS, LUNITE_PRICE_CHECKED,
    charPickupPmf, weaponPickupPmf
  };`, context, { filename: 'js/data.js' });
  const data = context.__qa;
  const charIds = new Set();
  const charNames = new Set();
  for (const character of data.CHARACTERS) {
    check(safeId(character.id), `잘못된 캐릭터 ID: ${character.id}`);
    check(!charIds.has(character.id), `중복 캐릭터 ID: ${character.id}`);
    check(!charNames.has(character.name), `중복 캐릭터 이름: ${character.name}`);
    check(Object.hasOwn(data.ELEMENTS, character.element), `${character.id}의 속성이 유효하지 않습니다.`);
    check(Object.hasOwn(data.WEAPONS, character.weapon), `${character.id}의 무기 유형이 유효하지 않습니다.`);
    charIds.add(character.id);
    charNames.add(character.name);
  }

  const bannerKeys = new Set();
  for (const banner of data.BANNERS) {
    const key = `${banner.ver}-${banner.phase}`;
    check(!bannerKeys.has(key), `중복 배너: ${key}`);
    bannerKeys.add(key);
    if (!banner.leaked) {
      check(validDate(banner.start) && validDate(banner.end) && banner.start <= banner.end, `배너 날짜 오류: ${key}`);
    }
    const refs = [...(banner.pickup || []), ...(banner.rerun || [])];
    check(new Set(refs).size === refs.length, `배너 내 캐릭터 중복: ${key}`);
    refs.forEach(id => check(charIds.has(id), `배너의 알 수 없는 캐릭터: ${key}/${id}`));
    if (banner.charPityGroup) check(safeId(banner.charPityGroup), `잘못된 캐릭터 천장 그룹: ${key}`);
    if (banner.weaponPityGroup) check(safeId(banner.weaponPityGroup), `잘못된 전무 천장 그룹: ${key}`);
  }

  const collab = data.BANNERS.find(b => b.ver === '3.4' && b.phase === '콜라보');
  const selection = data.BANNERS.find(b => b.ver === '3.5' && b.phase === '선택형');
  const currentBanner = data.BANNERS.find(b => b.ver === '3.5' && b.phase === '후반');
  const nextPreview = data.BANNERS.find(b => b.ver === '3.6' && b.phase === '공개 예정');
  check(collab?.charPityGroup && collab?.weaponPityGroup, '3.4 콜라보 별도 천장 그룹이 없습니다.');
  check(selection?.charPityGroup && selection?.weaponPityGroup, '3.5 선택형 별도 천장 그룹이 없습니다.');
  check(selection?.freePulls === 10, '3.5 선택형 무료 10뽑 데이터가 없습니다.');
  check(currentBanner?.start === '2026-07-30' && currentBanner?.end === '2026-08-19', '3.5 후반 공식 일정이 최신값이 아닙니다.');
  check(currentBanner?.pickup?.includes('suisui') && currentBanner?.rerun?.includes('aemeath'), '3.5 후반 픽업 구성이 최신값이 아닙니다.');
  check(nextPreview?.leaked === true && nextPreview?.leakNames?.some(name => name.includes('청초')) &&
    nextPreview?.leakNames?.some(name => name.includes('경연')), '3.6 공식 예고 데이터가 없습니다.');
  check(data.CHARACTERS.find(c => c.id === 'suisui')?.role.startsWith('힐러'), '수수 역할이 힐러로 분류되지 않았습니다.');
  check(data.CHARACTERS.find(c => c.id === 'rover')?.role.includes('전도'), '방랑자 전도 속성이 역할 설명에 없습니다.');

  for (const character of data.CHARACTERS) {
    check(Object.hasOwn(data.CHAR_MATS, character.id), `스킬 재료 누락: ${character.id}`);
    check(Object.hasOwn(data.ASC_MATS, character.id), `돌파 재료 누락: ${character.id}`);
    if (character.rarity === 5 && character.group === 'limited') {
      check(Object.hasOwn(data.SIG_WEAPONS, character.id), `한정 5성 전무 키 누락: ${character.id}`);
    }
    const mats = data.CHAR_MATS[character.id];
    if (mats) {
      check(Object.hasOwn(data.FORGE_FAMILIES, mats[0]), `단조 재료 참조 오류: ${character.id}/${mats[0]}`);
      check(Object.hasOwn(data.DROP_FAMILIES, mats[1]), `몹 재료 참조 오류: ${character.id}/${mats[1]}`);
      if (mats[2]) check(Object.hasOwn(data.WEEKLY_BOSS_MATS, mats[2]), `주간 재료 참조 오류: ${character.id}/${mats[2]}`);
    }
  }

  const contentIds = new Set();
  for (const content of data.CONTENT_DEFAULTS) {
    check(safeId(content.id) && !contentIds.has(content.id), `컨텐츠 ID 오류: ${content.id}`);
    check(validDate(content.start), `컨텐츠 시작일 오류: ${content.id}`);
    check(Number.isInteger(content.period) && content.period > 0 && content.period <= 999, `컨텐츠 주기 오류: ${content.id}`);
    check(Array.isArray(content.stages), `컨텐츠 단계 배열 오류: ${content.id}`);
    contentIds.add(content.id);
  }
  check(data.CONTENT_DEFAULTS.find(c => c.id === 'tower')?.start === '2026-07-20', '역경의 탑 38시즌 시작일이 아닙니다.');
  check(data.CONTENT_DEFAULTS.find(c => c.id === 'sea')?.start === '2026-08-03', '해역 20시즌 시작일이 아닙니다.');
  check(data.CONTENT_DEFAULTS.find(c => c.id === 'matrix')?.start === '2026-07-17', '종말 매트릭스 2주기 1단계 시작일이 아닙니다.');
  check(data.LUNITE_PRICE_CHECKED === '2026-08-06', '결제 가격 확인일이 최신값이 아닙니다.');

  for (const [label, pmf, expectedLength] of [['캐릭터', data.charPickupPmf(), 161], ['전무', data.weaponPickupPmf(), 81]]) {
    check(pmf.length === expectedLength, `${label} 확률 분포 길이 오류: ${pmf.length}`);
    pmf.forEach((value, index) => check(Number.isFinite(value) && value >= 0 && value <= 1,
      `${label} 확률 분포 값 오류: ${index}/${value}`));
    const total = pmf.reduce((sum, value) => sum + value, 0);
    check(Math.abs(total - 1) < 1e-9, `${label} 확률 분포 합 오류: ${total}`);
  }
} catch (error) {
  errors.push(`데이터 검증 실행 오류: ${error.message}`);
}

if (errors.length) {
  console.error(errors.map(error => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log('정적 사이트 검증 통과: 구문, PWA, 로컬 자산, 데이터 무결성');
