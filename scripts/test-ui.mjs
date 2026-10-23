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
vm.runInContext(`${data}\nBANNERS.push({ ver: '99.0', phase: '예고 검사', start: '2099-01-01', end: '2099-01-28', pickup: [], rerun: [], leaked: true, note: '예고 필터 검사 fixture' });\n${app}\n;globalThis.__ui = {
  characterMatchesSearch, charById, renderRoster, renderMatStrip, renderBannerCards, renderContents,
  getState: () => state,
  bannerCount: () => BANNERS.length,
  getSelectedMaterial: () => selectedMatChar,
  setContentFixture: value => {
    const content = clone(value);
    const index = CONTENT_DEFAULTS.findIndex(item => item.id === content.id);
    CONTENT_DEFAULTS[index] = clone(content);
    state.contents = [content];
    return content;
  },
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
assert.match(el('banner-cards').innerHTML, /Ver 99\.0/);
assert(el('banner-cards').innerHTML.indexOf('data-banner="3.6-후반"') < el('banner-cards').innerHTML.indexOf('Ver 99.0'), '현재 진행 픽업을 예고보다 먼저 표시');
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
assert.doesNotMatch(el('banner-cards').innerHTML, /Ver 99\.0/);
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

// The editor keeps unchanged official metadata, but never certifies newly edited text.
const contentFixture = ui.setContentFixture({ id: 'tower', icon: '🗼', name: '검사 탑', start: '2026-09-10', period: 28,
  rules: '검사 규칙', buff: '공식 검사 버프', stages: [{ name: '1층', mobs: '검사 적' }],
  dataStart: '2026-09-10', dataEnd: '2026-10-08', verifiedAt: '2026-09-10',
  sourceUrl: 'https://wutheringwaves.kurogames.com/kr/main/news/detail/fixture', dataStatus: 'official', sources: [] });
ui.renderContents();
assert.match(el('content-grid').innerHTML, /현재 주기 공식 자료/);
assert.match(el('content-grid').innerHTML, /현재 주기 버프/);
assert.match(el('content-grid').innerHTML, /rel="noopener noreferrer"/);
const editContentButton = new FakeElement();
editContentButton.dataset.editContent = 'tower';
editContentButton.closest = () => editContentButton;
fire('content-grid', 'click', editContentButton);
assert.equal(el('content-modal').open, true);
el('ct-name').value = '내 탑 이름';
fire('content-form', 'submit');
assert.equal(contentFixture.dataStatus, 'official', '이름만 수정하면 공식 자료의 적용 기간 유지');
assert.equal(contentFixture.dataEnd, '2026-10-08');
fire('content-grid', 'click', editContentButton);
const beforeInvalidSubmit = JSON.stringify(contentFixture);
el('ct-start').value = '2026-02-30';
fire('content-form', 'submit');
assert.equal(JSON.stringify(contentFixture), beforeInvalidSubmit, '유효하지 않은 날짜 저장 시 기존 값 보존');
assert.equal(el('content-modal').open, true, '유효하지 않은 입력은 수정창을 닫지 않음');
assert.match(el('toast').textContent, /올바른 시작일/);
el('ct-start').value = '2026-09-10';
el('ct-period').value = '0';
fire('content-form', 'submit');
assert.equal(JSON.stringify(contentFixture), beforeInvalidSubmit, '0일 주기는 저장하지 않음');
el('ct-period').value = '28';
el('ct-buff').value = '직접 입력한 버프 <img src=x onerror=alert(1)>';
fire('content-form', 'submit');
assert.equal(contentFixture.dataStatus, 'custom');
assert.equal(contentFixture.verifiedAt, '');
assert.equal(contentFixture.sourceUrl, '');
assert.match(el('content-grid').innerHTML, /사용자 입력 자료/);
assert.match(el('content-grid').innerHTML, /&lt;img src=x onerror=alert\(1\)&gt;/);
assert.doesNotMatch(el('content-grid').innerHTML, /현재 주기 버프|현재 주기 공식 자료|<img src=x/);
assert.equal(JSON.parse(storage.get('wuwa-planner-v1')).contents[0].dataStatus, 'custom', '사용자 입력 상태도 저장');
Object.assign(contentFixture, { dataStart: '2026-08-01', dataEnd: '2026-08-29' });
ui.renderContents();
assert.match(el('content-grid').innerHTML, /이전 주기 사용자 자료/);
assert.match(el('content-grid').innerHTML, /<details class="ct-archive">/);
assert.match(el('content-grid').innerHTML, /직접 입력한 버프/, '기간이 지난 사용자 원문도 유지');
Object.assign(contentFixture, { start: '2026-10-01', dataStart: '2026-10-01', dataEnd: '2026-10-29' });
ui.renderContents();
assert.match(el('content-grid').innerHTML, /예정 주기 10\/1 ~ 10\/29/, '예정 날짜 헤더는 시작 전 주기를 표시하지 않음');
assert.match(el('content-grid').innerHTML, /예정 주기 사용자 자료/);
Object.assign(contentFixture, { start: 'bad-date', dataStart: 'bad-date' });
ui.renderContents();
assert.match(el('content-grid').innerHTML, /주기 날짜 확인 필요/);
assert.doesNotMatch(el('content-grid').innerHTML, /NaN|Invalid Date|현재 주기 버프/);

const crossCheckedFixture = ui.setContentFixture({ id: 'tower', icon: '🗼', name: '교차 확인 탑', start: '2026-09-10', period: 28,
  rules: '공식 일정과 비공식 전투 자료를 구분합니다.', buff: '검사 교차 버프', stages: [{ name: '검사 층', mobs: '검사 몹' }],
  dataStart: '2026-09-10', dataEnd: '2026-10-08', verifiedAt: '2026-09-10', dataStatus: 'corroborated',
  sourceUrl: 'https://example.com/official', sources: [
    { label: '게임 공지', url: 'https://example.com/official', kind: 'official', scope: '일정만 확인' },
    { label: '자료 A <img src=x>', url: 'https://example.com/community-a', kind: 'community', scope: '버프·등장 몹 <script>검사</script>' },
    { label: '자료 B', url: 'https://example.org/community-b', kind: 'community', scope: '버프 교차 확인' },
  ] });
ui.renderContents();
assert.match(el('content-grid').innerHTML, /교차 확인 자료 · 비공식/);
assert.match(el('content-grid').innerHTML, /현재 주기 버프 · 비공식/);
assert.match(el('content-grid').innerHTML, /현재 주기 등장 몹 · 비공식/);
assert.doesNotMatch(el('content-grid').innerHTML, /현재 주기 공식 자료/);
assert.match(el('content-grid').innerHTML, /공식 출처 · 게임 공지/);
assert.match(el('content-grid').innerHTML, /확인 범위: 일정만 확인/);
assert.match(el('content-grid').innerHTML, /비공식 출처 · 자료 A &lt;img src=x&gt;/);
assert.match(el('content-grid').innerHTML, /버프·등장 몹 &lt;script&gt;검사&lt;\/script&gt;/);
assert.doesNotMatch(el('content-grid').innerHTML, /<script>|<img src=x>/);
assert.equal((el('content-grid').innerHTML.match(/href="https:\/\/example.com\/official"/g) || []).length, 1,
  '기존 sourceUrl과 sources의 동일한 링크는 한 번만 표시');
assert.equal((el('content-grid').innerHTML.match(/rel="noopener noreferrer"/g) || []).length, 3);
fire('content-grid', 'click', editContentButton);
fire('content-form', 'submit');
assert.equal(crossCheckedFixture.dataStatus, 'corroborated', '내용 변경 없는 저장은 교차 확인 상태 보존');
fire('content-grid', 'click', editContentButton);
el('ct-buff').value = '다시 쓴 내 버프';
fire('content-form', 'submit');
assert.equal(crossCheckedFixture.dataStatus, 'custom');
assert.equal(crossCheckedFixture.sources.length, 0, '직접 수정한 버프에 관리 출처를 인증처럼 붙이지 않음');
assert.doesNotMatch(el('content-grid').innerHTML, /교차 확인 자료 · 비공식/);
const pastCrossChecked = { ...JSON.parse(JSON.stringify(crossCheckedFixture)), start: '2026-08-01',
  dataStart: '2026-08-01', dataEnd: '2026-08-29', dataStatus: 'corroborated', verifiedAt: '2026-08-01',
  sources: [{ label: '과거 검사 자료', url: 'https://example.com/past', kind: 'community', scope: '과거 버프 확인' }] };
ui.setContentFixture(pastCrossChecked);
ui.renderContents();
assert.match(el('content-grid').innerHTML, /이전 주기 교차 확인 자료 · 비공식/);
assert.match(el('content-grid').innerHTML, /<details class="ct-archive">/);
assert.doesNotMatch(el('content-grid').innerHTML, /현재 주기 버프/);

console.log('UI checks passed: searches, filters, materials, history, expired and corroborated content, scoped source links, content editing, and saved-data preservation.');
