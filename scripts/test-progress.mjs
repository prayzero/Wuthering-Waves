import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const storeKey = 'wuwa-planner-v1';
const fieldKeys = ['level90', 'skills', 'echo', 'weapon'];
const emptyProgress = () => Object.fromEntries(fieldKeys.map(key => [key, false]));
const plain = value => JSON.parse(JSON.stringify(value));
const withoutProgress = state => {
  const result = plain(state);
  delete result.characterProgress;
  return result;
};

function createHarness(savedState) {
  let documentStub;
  class FakeElement {
    constructor(id = '') {
      Object.assign(this, { id, _html: '', textContent: '', value: '', hidden: false,
        checked: false, disabled: false, dataset: {}, attributes: {}, listeners: {},
        style: {}, focusCount: 0, selector: '', children: [], parentElement: null, tagName: '' });
      const classes = new Set();
      this.classList = {
        add: value => classes.add(value), remove: value => classes.delete(value),
        contains: value => classes.has(value),
        toggle: (value, active) => active ? classes.add(value) : classes.delete(value),
      };
    }
    addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    removeAttribute(name) { delete this.attributes[name]; }
    getAttribute(name) { return this.attributes[name] ?? null; }
    set innerHTML(value) {
      this._html = value;
      if (this.id === 'progress-list') parseMarkup(this, value);
    }
    get innerHTML() { return this._html; }
    querySelectorAll(selector) {
      return this.children.flatMap(child => [child, ...child.querySelectorAll('*')])
        .filter(child => child.matches(selector));
    }
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || (this.id === 'progress-list' || this.parentElement ? null : new FakeElement());
    }
    contains(node) { return node === this || this.children.some(child => child.contains(node)); }
    focus() { documentStub.activeElement = this; this.focusCount++; }
    scrollIntoView(options) { this.lastScroll = options; }
    showModal() { this.open = true; }
    close() { this.open = false; }
    click() { this.clicked = true; }
    reset() {}
    getBoundingClientRect() { return { left: 0, top: 0, width: 900, height: 500 }; }
    matches(selector) {
      if (selector === this.selector || selector === '*') return true;
      const tag = selector.match(/^[A-Za-z][\w-]*/)?.[0];
      if (tag && this.tagName.toLowerCase() !== tag.toLowerCase()) return false;
      const attrs = [...selector.matchAll(/\[([\w-]+)(?:=["']([^"']*)["'])?\]/g)];
      if (attrs.some(([, name, value]) => !Object.hasOwn(this.attributes, name) ||
          value !== undefined && this.attributes[name] !== value)) return false;
      const cssClass = selector.match(/\.([\w-]+)/)?.[1];
      if (cssClass && !this.classList.contains(cssClass)) return false;
      const id = selector.match(/^#([\w-]+)/)?.[1];
      if (id && this.id !== id) return false;
      if (selector.endsWith(':checked') && !this.checked) return false;
      return Boolean(tag || attrs.length || cssClass || id);
    }
    closest(selector) {
      if (this.matches(selector)) return this;
      return this.parentElement?.closest(selector) || null;
    }
  }
  function parseMarkup(parent, html) {
    parent.children = [];
    const stack = [parent];
    const voidTags = new Set(['input', 'img', 'br', 'hr', 'meta', 'link']);
    for (const match of html.matchAll(/<(\/?)([A-Za-z][\w-]*)([^>]*)>/g)) {
      const [, closing, name, attributes] = match;
      if (closing) {
        if (stack.length > 1 && stack.at(-1).tagName.toLowerCase() === name.toLowerCase()) stack.pop();
        continue;
      }
      const node = new FakeElement();
      node.tagName = name.toUpperCase();
      for (const attr of attributes.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
        const [, key, quoted, single, raw] = attr;
        const value = quoted ?? single ?? raw ?? '';
        node.attributes[key] = value;
        if (key.startsWith('data-')) node.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
        if (key === 'class') value.split(/\s+/).forEach(item => node.classList.add(item));
        if (['id', 'type', 'value'].includes(key)) node[key] = value;
        if (['checked', 'disabled', 'hidden'].includes(key)) node[key] = true;
      }
      node.parentElement = stack.at(-1);
      stack.at(-1).children.push(node);
      if (!voidTags.has(name.toLowerCase()) && !attributes.endsWith('/')) stack.push(node);
    }
  }
  const elements = new Map();
  const el = id => {
    if (!elements.has(id)) elements.set(id, new FakeElement(id));
    return elements.get(id);
  };
  const buttons = (key, values, selector) => values.map(value => {
    const button = new FakeElement();
    button.dataset[key] = value;
    button.selector = selector;
    return button;
  });
  const viewButtons = buttons('rosterView', ['owned', 'recommendations', 'progress'], '[data-roster-view]');
  const tabButtons = buttons('tab', ['planner', 'roster', 'contents', 'materials', 'history', 'rates'], '.tab-btn');
  documentStub = {
    activeElement: null, listeners: {}, createdElements: [], getElementById: el,
    createElement(tag) {
      const element = new FakeElement();
      element.tagName = tag.toUpperCase();
      this.createdElements.push(element);
      return element;
    },
    querySelectorAll(selector) {
      if (selector === '#roster-view-switch [data-roster-view]') return viewButtons;
      if (selector === '.tab-btn') return tabButtons;
      if (selector === '.tab-panel') return tabButtons.map(button => el(`tab-${button.dataset.tab}`));
      return [...elements.values()].flatMap(element =>
        [...(element.matches(selector) ? [element] : []), ...element.querySelectorAll(selector)]);
    },
    addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); },
  };
  const storage = new Map(savedState ? [[storeKey, JSON.stringify(savedState)]] : []);
  el('progress-filter').value = 'all';
  let failStorage = false;
  let exportedBlob;
  let confirmResult = true;
  class TestFileReader {
    readAsText(file) { this.result = file.text; this.onload?.(); }
  }
  const context = vm.createContext({
    console, Blob, FileReader: TestFileReader,
    URL: { createObjectURL(blob) { exportedBlob = blob; return 'blob:progress-test'; }, revokeObjectURL() {} },
    document: documentStub,
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem(key, value) {
        if (failStorage) throw new Error('QuotaExceededError');
        storage.set(key, String(value));
      },
    },
    navigator: {}, window: { addEventListener() {}, scrollTo() {}, innerWidth: 1280, innerHeight: 800 },
    confirm: () => confirmResult, setTimeout: () => 1, clearTimeout() {},
  });
  // Each source executes separately, matching classic browser script loading.
  for (const filename of ['data.js', 'teams.js', 'app.js', 'recommendations.js', 'progress.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'js', filename), 'utf8'), context, { filename });
  }
  vm.runInContext(`globalThis.__progressQA = {
    fields: CHARACTER_PROGRESS_FIELDS,
    getCharacterProgress, setCharacterProgress, renderCharacterProgress, openCharacterProgress,
    showRosterView, renderRoster, renderAll, save, charById,
    getState: () => state,
    setState: value => { state = normalizeStateData(JSON.parse(JSON.stringify(value))); },
    normalize: (value, strict = false) => normalizeStateData(JSON.parse(JSON.stringify(value)), { strict }),
    defaults: () => clone(defaultState()),
    prototypeIsClean: () => Object.prototype.level90 === undefined && Object.prototype.polluted === undefined,
  };`, context);
  const fire = (target, type, event = {}) => {
    const handlers = target.listeners[type] || [];
    assert(handlers.length > 0, `${target.id || 'document'} ${type} 이벤트가 연결됨`);
    const payload = { target, preventDefault() { this.defaultPrevented = true; }, ...event };
    for (const handler of handlers) handler(payload);
    return payload;
  };
  const target = (selector, dataset = {}) => {
    const node = new FakeElement();
    node.selector = selector;
    node.dataset = dataset;
    return node;
  };
  const importBackup = value => {
    const input = el('import-file');
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    input.files = [{ size: Buffer.byteLength(text), text }];
    input.value = 'backup.json';
    fire(input, 'change');
  };
  return { app: context.__progressQA, el, fire, target, storage, context, document: documentStub,
    viewButtons, tabButtons, importBackup,
    setFailStorage: value => { failStorage = value; },
    setConfirm: value => { confirmResult = value; },
    exportedBlob: () => exportedBlob };
}

const h = createHarness();
const { app, el, fire, target } = h;
const fixture = (overrides = {}) => ({ ...plain(app.defaults()), schemaVersion: 8,
  owned: { hsin: true, verina: true, rover: true },
  parties: [{ id: 'keep-party', name: '유지할 파티', members: ['hsin', 'verina', 'rover'], tag: 'tower' }],
  schedules: [{ id: 'keep-schedule', charId: 'hsin', name: '유지할 일정', start: '2026-10-01', end: '2026-11-01', saved: 80, goal: '명함', memo: '보존 검사' }],
  records: [{ id: 'keep-record', season: '검사', type: 'char', charId: 'hsin', copy: 0, pulls: 70, lost: false }],
  calc: { ...plain(app.defaults().calc), astrite: 12345, lunite: 600 },
  ...overrides });

assert.deepEqual(Array.from(app.fields, field => field.key), fieldKeys, '공개된 육성 항목은 네 종류');
assert(app.fields.every(field => typeof field.label === 'string' && field.label.trim()), '모든 항목에 표시 이름 제공');
assert.equal(app.getState().schemaVersion, 8);
assert.deepEqual(plain(app.getState().characterProgress), {});

const oldBackup = fixture({ schemaVersion: 7 });
delete oldBackup.characterProgress;
const oldBackupCopy = plain(oldBackup);
const migrated = app.normalize(oldBackup, true);
assert.equal(migrated.schemaVersion, 8);
assert.deepEqual(plain(migrated.characterProgress), {}, '구형 백업은 미체크 상태로 시작');
assert.deepEqual(oldBackup, oldBackupCopy, '마이그레이션은 입력 백업을 수정하지 않음');
assert.deepEqual(withoutProgress(migrated), withoutProgress(app.normalize(fixture(), true)), '기존 일정·기록·파티·콘텐츠를 보존');

app.setState(fixture());
const untouchedState = withoutProgress(app.getState());
const beforeRead = JSON.stringify(app.getState());
assert.deepEqual(plain(app.getCharacterProgress('hsin')), emptyProgress());
assert.deepEqual(plain(app.getCharacterProgress('not-a-character')), emptyProgress());
assert.equal(JSON.stringify(app.getState()), beforeRead, '진행 조회만으로 저장 상태를 변경하지 않음');
for (let index = 0; index < fieldKeys.length; index++) {
  const key = fieldKeys[index];
  assert.equal(app.setCharacterProgress('hsin', key, true).ok, true, `${key} 체크 가능`);
  assert.deepEqual(plain(app.getCharacterProgress('hsin')),
    Object.fromEntries(fieldKeys.map((field, i) => [field, i <= index])), '다른 항목을 자동 체크하지 않음');
  assert.deepEqual(withoutProgress(app.getState()), untouchedState, `${key} 변경은 기존 기록을 보존`);
  assert.equal(JSON.parse(h.storage.get(storeKey)).characterProgress.hsin[key], true, '체크 직후 저장');
}
const detached = app.getCharacterProgress('hsin');
detached.level90 = false;
assert.equal(app.getCharacterProgress('hsin').level90, true, '조회 결과는 저장된 객체의 사본');
for (const key of fieldKeys) assert.equal(app.setCharacterProgress('hsin', key, false).ok, true);
assert.deepEqual(plain(app.getCharacterProgress('hsin')), emptyProgress(), '네 항목 모두 해제 가능');

const beforeInvalid = JSON.stringify(app.getState());
const storedBeforeInvalid = h.storage.get(storeKey);
for (const args of [
  ['jiyan', 'level90', true], ['missing', 'skills', true], ['__proto__', 'echo', true],
  ['hsin', 'invalid', true], ['hsin', '__proto__', true], ['hsin', 'constructor', true],
  ['hsin', 'skills', 'true'], ['hsin', 'skills', 1], ['hsin', 'skills', null], ['hsin', 'skills', undefined],
]) {
  const result = app.setCharacterProgress(...args);
  assert.equal(result.ok, false, `${JSON.stringify(args)} 변경 거부`);
  assert.equal(typeof result.message, 'string');
  assert.equal(JSON.stringify(app.getState()), beforeInvalid, '잘못된 변경은 현재 상태 보존');
  assert.equal(h.storage.get(storeKey), storedBeforeInvalid, '잘못된 변경은 저장 상태 보존');
}

// Both a first entry and an existing entry must roll back after failed persistence.
for (const initial of [{}, { hsin: { level90: true, skills: false, echo: true, weapon: false } }]) {
  app.setState(fixture({ characterProgress: initial }));
  app.save();
  const before = JSON.stringify(app.getState());
  const stored = h.storage.get(storeKey);
  h.setFailStorage(true);
  assert.equal(app.setCharacterProgress('hsin', 'skills', true).ok, false);
  h.setFailStorage(false);
  assert.equal(JSON.stringify(app.getState()), before, '저장 실패 시 기존 진행 항목/부재 상태까지 복구');
  assert.equal(h.storage.get(storeKey), stored);
}

const savedProgress = { hsin: { level90: true, skills: false, echo: true, weapon: false },
  verina: { level90: true, skills: true, echo: true, weapon: true } };
app.setState(fixture({ characterProgress: savedProgress }));
app.save();
const reloaded = createHarness(JSON.parse(h.storage.get(storeKey)));
assert.deepEqual(plain(reloaded.app.getState()), plain(app.getState()), '새 앱 컨텍스트에서도 기록 전체 복원');
fire(el('export-btn'), 'click');
const exported = JSON.parse(await h.exportedBlob().text());
assert.deepEqual(exported, plain(app.getState()), '실제 내보내기 버튼은 육성 상태를 포함한 전체 백업 생성');
assert(h.document.createdElements.some(node => node.tagName === 'A' && node.clicked), '다운로드 링크 실행');
app.setState(fixture({ owned: {}, parties: [], characterProgress: {} }));
h.importBackup(exported);
assert.deepEqual(plain(app.getState()), plain(app.normalize(exported, true)), '실제 가져오기 핸들러로 전체 상태 왕복');
assert.deepEqual(JSON.parse(h.storage.get(storeKey)), plain(app.getState()));

for (const invalidProgress of [null, [], 'invalid', 5, { hsin: null }, { hsin: [] }, { hsin: false },
  ...fieldKeys.map(key => ({ hsin: { [key]: 'true' } })), { hsin: { skills: 1 } }, { hsin: { echo: null } }]) {
  const invalid = fixture({ characterProgress: invalidProgress });
  assert.throws(() => app.normalize(invalid, true), `잘못된 육성 백업 거부: ${JSON.stringify(invalidProgress)}`);
  const before = JSON.stringify(app.getState());
  const stored = h.storage.get(storeKey);
  h.importBackup(invalid);
  assert.equal(JSON.stringify(app.getState()), before, '잘못된 백업 가져오기로 현재 기록이 사라지지 않음');
  assert.equal(h.storage.get(storeKey), stored);
}
const unknown = app.normalize(fixture({ characterProgress: { absent: { level90: true }, hsin: { skills: true } } }), true);
assert.equal(Object.hasOwn(unknown.characterProgress, 'absent'), false, '알 수 없는 캐릭터 진행은 무시');
assert.equal(unknown.characterProgress.hsin.skills, true);
assert.deepEqual(plain(unknown.characterProgress.hsin), { ...emptyProgress(), skills: true }, '생략된 항목은 미체크로 복원');
assert.equal(Object.hasOwn(app.normalize(fixture({ characterProgress: { absent: null } }), true).characterProgress, 'absent'),
  false, '이미 삭제되거나 등록되지 않은 캐릭터 항목은 strict 모드에서도 무시');
const repaired = app.normalize(fixture({ characterProgress: { hsin: { level90: 'true', skills: true }, verina: null } }));
assert.deepEqual(plain(repaired.characterProgress.hsin), { ...emptyProgress(), skills: true }, '일반 저장 복구는 잘못된 필드만 미체크 처리');
assert.equal(Object.hasOwn(repaired.characterProgress, 'verina'), false, '잘못된 저장 항목은 정상 항목과 분리해 복구');
const dangerous = JSON.parse('{"__proto__":{"level90":true,"polluted":true},"constructor":{"skills":true},"hsin":{"echo":true,"__proto__":{"polluted":true}}}');
const sanitized = app.normalize(fixture({ characterProgress: dangerous }), true);
assert.equal(Object.hasOwn(sanitized.characterProgress, '__proto__'), false);
assert.equal(Object.hasOwn(sanitized.characterProgress, 'constructor'), false);
assert.equal(Object.hasOwn(sanitized.characterProgress.hsin, '__proto__'), false);
assert.equal(sanitized.characterProgress.hsin.echo, true);
assert.equal(app.prototypeIsClean(), true, '프로토타입 오염 없음');
assert.equal(Object.prototype.polluted, undefined);

// A failed or cancelled import leaves the previous in-memory and stored values intact.
for (const mode of ['storage-failure', 'cancel']) {
  const before = JSON.stringify(app.getState());
  const stored = h.storage.get(storeKey);
  h.setFailStorage(mode === 'storage-failure');
  h.setConfirm(mode !== 'cancel');
  h.importBackup(fixture({ characterProgress: { rover: { weapon: true } } }));
  h.setFailStorage(false);
  h.setConfirm(true);
  assert.equal(JSON.stringify(app.getState()), before, `${mode} 가져오기 시 기존 상태 유지`);
  assert.equal(h.storage.get(storeKey), stored);
}

app.setState(fixture({ characterProgress: savedProgress }));
const toggleOwn = id => fire(el('roster-grid'), 'click', { target: target('[data-toggle-own]', { toggleOwn: id }) });
toggleOwn('hsin');
assert.equal(app.getState().owned.hsin, undefined);
assert.equal(app.getState().parties[0].members[0], null, '기존 보유 해제 시 파티 멤버 정리 유지');
assert.deepEqual(plain(app.getCharacterProgress('hsin')), savedProgress.hsin, '보유 해제는 육성 기록을 지우지 않음');
assert.equal(app.setCharacterProgress('hsin', 'skills', true).ok, false, '미보유 상태의 기존 진행 변경도 거부');
toggleOwn('hsin');
assert.deepEqual(plain(app.getCharacterProgress('hsin')), savedProgress.hsin, '다시 보유하면 기존 진행 복원');
const custom = { id: 'custom-progress', name: '<img src=x onerror=1>', rarity: 4, element: 'fusion', role: '딜러' };
app.setState(fixture({ customChars: [custom], owned: { hsin: true, [custom.id]: true },
  characterProgress: { hsin: savedProgress.hsin, [custom.id]: { skills: true } } }));
assert.equal(app.setCharacterProgress(custom.id, 'weapon', true).ok, true, '사용자 캐릭터도 체크 가능');
app.renderCharacterProgress();
assert.doesNotMatch(el('progress-list').innerHTML, /<img src=x|onerror=1[ >]/, '사용자 캐릭터 이름을 HTML로 실행하지 않음');
assert.match(el('progress-list').innerHTML, /&lt;img src=x onerror=1&gt;/);
fire(el('roster-grid'), 'click', { target: target('[data-del-custom]', { delCustom: custom.id }) });
assert.equal(app.getState().customChars.length, 0);
assert.equal(Object.hasOwn(app.getState().characterProgress, custom.id), false, '사용자 캐릭터 삭제 시 해당 진행만 제거');
assert.deepEqual(plain(app.getCharacterProgress('hsin')), savedProgress.hsin);

// UI event and keyboard assertions are intentionally kept against the real module below.
app.setState(fixture({ characterProgress: savedProgress }));
const uiStateBefore = JSON.stringify(app.getState());
fire(h.document, 'click', { target: target('[data-progress-char]', { progressChar: 'hsin' }) });
assert.equal(el('tab-roster').hidden, false);
assert.equal(el('roster-progress-view').hidden, false);
assert.equal(el('roster-owned-view').hidden, true);
assert.equal(el('roster-recommendations-view').hidden, true);
assert.equal(el('progress-filter').value, 'all');
assert.equal(el('progress-search').value, app.charById('hsin').name);
assert.equal(h.document.activeElement?.dataset.progressCharacter, 'hsin', '캐릭터 육성 진입 후 첫 체크박스에 초점');
assert.equal(h.document.activeElement?.dataset.progressField, 'level90');
assert.equal(h.viewButtons[2].attributes['aria-pressed'], 'true');
assert.equal(h.viewButtons[2].attributes['aria-controls'], 'roster-progress-view');
assert.match(el('progress-list').innerHTML, /data-progress-card="hsin"/);
assert.doesNotMatch(el('progress-list').innerHTML, /data-progress-card="verina"/, '지정 캐릭터 진입은 해당 ID만 표시');
const search = query => { el('progress-search').value = query; fire(el('progress-search'), 'input'); };
const filter = value => { el('progress-filter').value = value; fire(el('progress-filter'), 'change'); };
search('  버디나 ');
assert.match(el('progress-list').innerHTML, /data-progress-card="verina"/, '이전 이름도 검색');
assert.doesNotMatch(el('progress-list').innerHTML, /data-progress-card="hsin"/);
search('<script>');
assert.doesNotMatch(el('progress-list').innerHTML, /<script>|data-progress-card=/);
search('');
filter('complete');
assert.match(el('progress-list').innerHTML, /data-progress-card="verina"/);
assert.doesNotMatch(el('progress-list').innerHTML, /data-progress-card="hsin"|data-progress-card="rover"/);
filter('incomplete');
assert.match(el('progress-list').innerHTML, /data-progress-card="hsin"/);
assert.match(el('progress-list').innerHTML, /data-progress-card="rover"/);
assert.doesNotMatch(el('progress-list').innerHTML, /data-progress-card="verina"/);
filter('all');
assert.equal(JSON.stringify(app.getState()), uiStateBefore, '화면 전환·검색·필터는 기록을 변경하지 않음');

const inputFor = (id, key) => {
  const input = el('progress-list').querySelector(`input[data-progress-character="${id}"][data-progress-field="${key}"]`);
  assert(input, `${id} ${key} 실제 체크박스 마크업 존재`);
  return input;
};
for (const key of fieldKeys) {
  const input = inputFor('hsin', key);
  assert.equal(input.type, 'checkbox');
  assert.equal(input.checked, savedProgress.hsin[key], '저장한 각 항목의 체크 표시 복원');
  assert(input.attributes['aria-label']?.trim(), '체크박스 접근성 이름 제공');
}
const badge = el('test-roster-progress-badge');
badge.classList.add('char-progress-btn');
badge.setAttribute('data-progress-char', 'hsin');
badge.dataset.progressChar = 'hsin';
const changeProgress = (id, key, checked) => {
  const input = inputFor(id, key);
  input.focus();
  input.checked = checked;
  fire(el('progress-list'), 'change', { target: input });
  return input;
};
const beforeUICheck = withoutProgress(app.getState());
const checkedInput = changeProgress('hsin', 'skills', true);
assert.equal(app.getCharacterProgress('hsin').skills, true, '위임 change 이벤트로 해당 필드 저장');
assert.equal(h.document.activeElement, checkedInput, '체크할 때 기존 키보드 초점을 유지');
assert.equal(inputFor('hsin', 'skills'), checkedInput, '전체 필터에서 체크박스 DOM 재생성 없이 유지');
assert.equal(el('progress-list').querySelector('[data-progress-card="hsin"]').querySelector('[data-progress-count]').textContent,
  '3/4 완료', '체크한 항목의 완료 수 갱신');
assert.equal(badge.textContent, '육성 3/4', '보유 카드 육성 배지도 갱신');
assert.deepEqual(withoutProgress(app.getState()), beforeUICheck);
assert.equal(JSON.parse(h.storage.get(storeKey)).characterProgress.hsin.skills, true);
changeProgress('hsin', 'skills', false);
assert.equal(app.getCharacterProgress('hsin').skills, false, '위임 이벤트로 체크 해제');
const beforeUIFailure = JSON.stringify(app.getState());
h.setFailStorage(true);
changeProgress('hsin', 'weapon', true);
h.setFailStorage(false);
assert.equal(JSON.stringify(app.getState()), beforeUIFailure);
assert.equal(inputFor('hsin', 'weapon').checked, false, '저장 실패 시 체크박스도 원래 상태 복원');
assert.match(el('progress-feedback').textContent, /저장.*못|실패/, '저장 실패를 화면에 알림');

filter('incomplete');
changeProgress('hsin', 'skills', true);
changeProgress('hsin', 'weapon', true);
assert.doesNotMatch(el('progress-list').innerHTML, /data-progress-card="hsin"/, '완료되면 미완료 필터에서 제외');
assert.equal(h.document.activeElement?.dataset.progressCharacter, 'rover', '필터에서 카드가 사라지면 남은 카드로 초점 복구');
assert.equal(h.document.activeElement?.dataset.progressField, 'weapon', '같은 육성 항목으로 키보드 조작 이어짐');
for (const key of fieldKeys) changeProgress('rover', key, true);
assert.equal(h.document.activeElement, el('progress-filter'), '마지막 카드까지 사라지면 필터로 초점 이동');

const keyEvent = fire(el('roster-view-switch'), 'keydown', { target: h.viewButtons[2], key: 'Home' });
assert.equal(keyEvent.defaultPrevented, true);
assert.equal(el('roster-owned-view').hidden, false);
assert.equal(el('roster-progress-view').hidden, true);
assert.equal(h.document.activeElement, h.viewButtons[0], '키보드로 보유 관리로 돌아갈 수 있음');
fire(el('roster-view-switch'), 'keydown', { target: h.viewButtons[0], key: 'End' });
assert.equal(el('roster-progress-view').hidden, false);
assert.equal(h.document.activeElement, h.viewButtons[2]);
fire(el('goto-roster'), 'click');
assert.equal(el('roster-owned-view').hidden, false, '기존 보유 관리 바로가기는 육성뷰에서도 보유 관리 표시');

app.setState(fixture({ owned: {}, parties: [], characterProgress: savedProgress }));
app.openCharacterProgress('hsin');
assert.equal(h.document.activeElement, el('progress-search'), '미보유 캐릭터 진입은 검색창에 초점');
assert.doesNotMatch(el('progress-list').innerHTML, /data-progress-card=/, '미보유 캐릭터는 육성 목록에 노출하지 않음');
fire(h.document, 'click', { target: target('[data-progress-go-owned]') });
assert.equal(el('roster-owned-view').hidden, false, '빈 화면에서 보유 관리로 이동');
app.openCharacterProgress('missing');
assert.equal(h.document.activeElement, el('progress-search'));
assert.deepEqual(plain(app.getState().characterProgress), plain(app.normalize(fixture({ characterProgress: savedProgress })).characterProgress));

console.log('육성 체크리스트 검사 통과: 네 항목 독립 저장·해제, schema 8 이전 백업, 새로고침·내보내기·가져오기, 기존 기록 보존, 보유 변경·사용자 캐릭터 삭제, 잘못된 입력·프로토타입·XSS, 저장 실패 복구, 검색·필터·위임 이벤트·키보드 초점.');
