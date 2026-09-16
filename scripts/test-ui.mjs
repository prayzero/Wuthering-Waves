import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

class FakeElement {
  constructor(id = '') {
    this.id = id;
    this.innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.hidden = false;
    this.open = false;
    this.style = {};
    this.dataset = {};
    this.attributes = {};
    this.listeners = {};
    this.scrollCalls = [];
    const classes = new Set();
    this.classList = {
      add: value => classes.add(value),
      remove: value => classes.delete(value),
      contains: value => classes.has(value),
      toggle(value, active) {
        if (active ?? !classes.has(value)) classes.add(value);
        else classes.delete(value);
      },
    };
  }
  addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  removeAttribute(name) { delete this.attributes[name]; }
  querySelector() { return new FakeElement(); }
  querySelectorAll() { return []; }
  focus() { documentStub.activeElement = this; }
  showModal() { this.open = true; }
  close() { this.open = false; }
  scrollIntoView(options) { this.scrollCalls.push(options); }
  getBoundingClientRect() { return { left: 0, top: 0, width: 720, height: 300 }; }
}

const elements = new Map();
const makeButtons = (key, values) => values.map(value => {
  const button = new FakeElement(value);
  button.dataset[key] = value;
  button.closest = () => button;
  return button;
});
const historyButtons = makeButtons('historyFilter', ['current', 'records', 'all']);
const rosterButtons = makeButtons('filter', ['all', 'limited', 'standard', 'four', 'owned']);
const documentStub = {
  activeElement: null,
  listeners: {},
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, new FakeElement(id));
    return elements.get(id);
  },
  querySelectorAll(selector) {
    if (selector === '#history-filter [data-history-filter]') return historyButtons;
    if (selector === '#roster-filter .chip') return rosterButtons;
    return [];
  },
  addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); },
};
const RealDate = Date;
class FixedDate extends RealDate {
  constructor(...args) { super(...(args.length ? args : ['2026-09-16T12:00:00+09:00'])); }
  static now() { return new RealDate('2026-09-16T12:00:00+09:00').getTime(); }
}
const storage = new Map();
const context = vm.createContext({
  console,
  Date: FixedDate,
  document: documentStub,
  localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  },
  navigator: {},
  window: { addEventListener() {}, scrollTo() {}, innerWidth: 1280, innerHeight: 720 },
  confirm: () => true,
  setTimeout: () => 1,
  clearTimeout() {},
});

const data = fs.readFileSync(path.join(root, 'js/data.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
vm.runInContext(`${data}\n${app}\n;globalThis.__ui = {
  characterMatchesSearch, charById, renderRoster, renderMatStrip, renderBannerCards,
  getState: () => state,
  bannerCount: () => BANNERS.length,
  getSelectedMaterial: () => selectedMatChar,
};`, context, { filename: 'ui-test-bundle.js' });
const ui = context.__ui;
const el = id => documentStub.getElementById(id);
const fire = (id, type, target = el(id)) => {
  const listeners = el(id).listeners[type] || [];
  assert.ok(listeners.length, `${id} ${type} 이벤트가 연결됨`);
  for (const handler of listeners) handler({ target, preventDefault() {} });
};
const search = (id, value) => { el(id).value = value; fire(id, 'input'); };
const chooseRosterFilter = value => fire('roster-filter', 'click', rosterButtons.find(button => button.dataset.filter === value));
const chooseHistoryFilter = value => fire('history-filter', 'click', historyButtons.find(button => button.dataset.historyFilter === value));

// Searches accept current names, old names, and common punctuation/spacing variants.
assert.equal(ui.characterMatchesSearch(ui.charById('verina'), '벨리나'), true);
assert.equal(ui.characterMatchesSearch(ui.charById('verina'), '  버디나 '), true);
assert.equal(ui.characterMatchesSearch(ui.charById('luukherssen'), '루크헤르센'), true);
assert.equal(ui.characterMatchesSearch(ui.charById('ciaccona'), '시아코나'), true);
assert.equal(ui.characterMatchesSearch(ui.charById('verina'), '파수인'), false);
assert.equal(ui.characterMatchesSearch({ name: 'ＡBC' }, 'abc'), true);
assert.equal(ui.characterMatchesSearch(ui.charById('verina'), ''), true);

ui.getState().owned = { verina: true, baizhi: true };
const stateBeforeSearch = JSON.stringify(ui.getState());
chooseRosterFilter('owned');
search('roster-search', '백지');
assert.match(el('roster-grid').innerHTML, /data-toggle-own="baizhi"/);
assert.doesNotMatch(el('roster-grid').innerHTML, /data-toggle-own="verina"/);
assert.match(el('own-summary').textContent, /현재 1명 표시/);
search('roster-search', '경연');
assert.match(el('roster-grid').innerHTML, /조건에 맞는 캐릭터가 없어요/);
chooseRosterFilter('all');
assert.match(el('roster-grid').innerHTML, /data-toggle-own="jingran"/);
search('roster-search', '<script>');
assert.doesNotMatch(el('roster-grid').innerHTML, /<script>/);
search('roster-search', '');
assert.match(el('roster-grid').innerHTML, /data-toggle-own="verina"/);
assert.equal(JSON.stringify(ui.getState()), stateBeforeSearch, '검색·필터는 저장된 보유 데이터를 변경하지 않음');

// Material search keeps the selected detail while narrowing the character list.
search('material-search', '천초');
assert.match(el('mat-char-strip').innerHTML, /data-mat-char="qingxiao"/);
assert.doesNotMatch(el('mat-char-strip').innerHTML, /data-mat-char="jingran"/);
const materialButton = new FakeElement();
materialButton.dataset.matChar = 'qingxiao';
materialButton.closest = () => materialButton;
fire('mat-char-strip', 'click', materialButton);
assert.equal(ui.getSelectedMaterial(), 'qingxiao');
assert.match(el('mat-char-strip').innerHTML, /selected[^]*?aria-pressed="true"/);
assert.match(el('mat-detail').innerHTML, /청초/);
assert.equal(el('mat-detail').scrollCalls.length, 1);
assert.deepEqual({ ...el('mat-detail').scrollCalls[0] }, { block: 'start', behavior: 'auto' }, '육성 결과로 즉시 이동하여 모션 선호를 존중');
const selectedDetail = el('mat-detail').innerHTML;
assert(selectedDetail.indexOf('mat-cost-summary') < selectedDetail.indexOf('material-breakdown'), '육성 비용 요약이 긴 재료 목록보다 먼저 표시됨');
assert.match(selectedDetail, /<details class="material-breakdown">/, '재료 상세는 기본 접기 제공');
search('material-search', '존재하지않는캐릭터');
assert.match(el('mat-char-strip').innerHTML, /검색 결과가 없어요/);
assert.equal(el('mat-detail').innerHTML, selectedDetail, '검색어 변경이 선택된 육성 결과를 지우지 않음');
el('mat-detail').scrollIntoView = undefined;
assert.doesNotThrow(() => fire('mat-char-strip', 'click', materialButton), 'scrollIntoView 없는 환경도 지원');

// Current starts compact; all history remains available without changing saved records.
assert.match(el('banner-cards').innerHTML, /data-banner="3\.6-후반"/);
assert.match(el('banner-cards').innerHTML, /Ver 3\.7/);
assert(el('banner-cards').innerHTML.indexOf('data-banner="3.6-후반"') < el('banner-cards').innerHTML.indexOf('Ver 3.7'), '현재 진행 픽업을 예고보다 먼저 표시');
assert.doesNotMatch(el('banner-cards').innerHTML, /data-banner="1\.0-전반"/);
assert.equal(historyButtons[0].attributes['aria-pressed'], 'true');
chooseHistoryFilter('records');
assert.match(el('banner-cards').innerHTML, /아직 저장한 픽업 기록이 없어요/);
assert.match(el('banner-filter-status').textContent, /내 기록 · 0개 픽업/);

ui.getState().records = [
  { id: 'legacy-alias-record', season: '샤코나 픽업', type: 'char', charId: 'ciaccona', copy: 0, pulls: 70 },
  { id: 'same-banner-record', season: '2.3-후반', type: 'weapon', weaponName: '전무', copy: 0, pulls: 65 },
  { id: 'current-record', season: '3.6-후반', type: 'char', charId: 'jingran', copy: 0, pulls: 75 },
  { id: 'custom-record', season: '사용자 직접 입력 시즌', type: 'char', charId: 'verina', copy: 0, pulls: 50 },
];
const recordsBeforeFilter = JSON.stringify(ui.getState().records);
ui.renderBannerCards();
assert.match(el('banner-cards').innerHTML, /data-banner="2\.3-후반"/);
assert.match(el('banner-cards').innerHTML, /data-banner="3\.6-후반"/);
assert.match(el('banner-cards').innerHTML, /data-del-record="legacy-alias-record"/);
assert.doesNotMatch(el('banner-cards').innerHTML, /Ver 3\.7/);
assert.match(el('banner-filter-status').textContent, /내 기록 · 2개 픽업/);
assert.equal((el('banner-cards').innerHTML.match(/data-del-record="legacy-alias-record"/g) || []).length, 1, '이전 이름 기록은 최초 배너에 한 번만 표시');
assert.equal(historyButtons[1].attributes['aria-pressed'], 'true');
assert.equal(historyButtons[0].attributes['aria-pressed'], 'false');
chooseHistoryFilter('all');
assert.equal((el('banner-cards').innerHTML.match(/<div class="bc-card /g) || []).length, ui.bannerCount(), '전체 필터는 예고를 포함해 모든 픽업 제공');
assert.match(el('banner-cards').innerHTML, /data-banner="1\.0-전반"/);
chooseHistoryFilter('current');
assert.doesNotMatch(el('banner-cards').innerHTML, /data-banner="2\.3-후반"/);
assert.equal(JSON.stringify(ui.getState().records), recordsBeforeFilter, '픽업 필터는 기존 기록을 변경하지 않음');

console.log('UI checks passed: character/alias searches, combined filters, material selection, accessible history filters, and saved-data preservation.');
