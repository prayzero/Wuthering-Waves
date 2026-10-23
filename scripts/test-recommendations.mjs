import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
class FakeElement {
  constructor(id = '') {
    Object.assign(this, { id, innerHTML: '', textContent: '', value: '', hidden: false, checked: false, disabled: false,
      dataset: {}, attributes: {}, listeners: {}, style: {}, focusCount: 0 });
    const classes = new Set();
    this.classList = { add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value),
      toggle: (value, active) => active ? classes.add(value) : classes.delete(value) };
  }
  addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  removeAttribute(name) { delete this.attributes[name]; }
  querySelectorAll() { return []; }
  querySelector() { return new FakeElement(); }
  focus() { documentStub.activeElement = this; this.focusCount++; }
  scrollIntoView(value) { this.lastScroll = value; }
  showModal() { this.open = true; }
  close() { this.open = false; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 900, height: 500 }; }
  closest(selector) { return this.selector === selector ? this : null; }
}
const elements = new Map();
const el = id => { if (!elements.has(id)) elements.set(id, new FakeElement(id)); return elements.get(id); };
const viewButtons = ['owned', 'recommendations'].map(view => {
  const button = new FakeElement(); button.dataset.rosterView = view; button.selector = '[data-roster-view]'; return button;
});
const tabButtons = ['planner', 'roster', 'contents', 'materials', 'history', 'rates'].map(tab => {
  const button = new FakeElement(); button.dataset.tab = tab; button.selector = '.tab-btn'; return button;
});
const documentStub = {
  listeners: {}, activeElement: null,
  getElementById: el,
  querySelectorAll(selector) {
    if (selector === '#roster-view-switch [data-roster-view]') return viewButtons;
    if (selector === '.tab-btn') return tabButtons;
    if (selector === '.tab-panel') return tabButtons.map(button => el(`tab-${button.dataset.tab}`));
    return [];
  },
  addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); },
};
let failStorage = false;
const storage = new Map();
const context = vm.createContext({ console, document: documentStub,
  localStorage: { getItem: key => storage.get(key) ?? null, setItem(key, value) {
    if (failStorage) throw new Error('QuotaExceededError'); storage.set(key, String(value));
  } }, navigator: {}, window: { addEventListener() {}, scrollTo() {}, innerWidth: 1280, innerHeight: 800 },
  confirm: () => true, setTimeout: () => 1, clearTimeout() {} });

// Separate scripts match browser loading, avoiding cross-script function-hoisting artifacts.
vm.runInContext(fs.readFileSync(path.join(root, 'js/data.js'), 'utf8'), context, { filename: 'data.js' });
const fixtures = [
  { id: 'main-team', members: ['hsin', 'suoming', 'shorekeeper'], label: '기본 추천', reason: '검사 조합',
    sources: [{ label: '검사 자료', url: 'https://example.com/guide', kind: 'community' }], verifiedAt: '2026-10-23' },
  { id: 'alternate-team', members: ['hsin', 'verina', 'ciaccona'], label: '대체 추천', reason: '다른 검사 조합', sources: [] },
  { id: 'rover-team', members: ['rover', 'ciaccona', 'iuno'], label: '방랑자 조건부 추천', reason: '기류 조합',
    condition: '방랑자는 기류 속성으로 전환해야 합니다.', sources: [] },
  { id: 'rover-missing-condition', members: ['rover', 'hsin', 'iuno'], label: '조건 누락', reason: '추가 금지', sources: [] },
];
vm.runInContext(`const PARTY_RECOMMENDATIONS = ${JSON.stringify(fixtures)};`, context);
vm.runInContext(fs.readFileSync(path.join(root, 'js/app.js'), 'utf8'), context, { filename: 'app.js' });
vm.runInContext(fs.readFileSync(path.join(root, 'js/recommendations.js'), 'utf8'), context, { filename: 'recommendations.js' });
vm.runInContext(`globalThis.__recQA = {
  renderRecommendations, openRecommendations, showRosterView, addRecommendation,
  issue: (id, tag) => recommendationAddIssue(PARTY_RECOMMENDATIONS.find(entry => entry.id === id), tag),
  getState: () => state,
  setState: value => { state = normalizeStateData(JSON.parse(JSON.stringify(value))); },
  setRecommendations: value => { PARTY_RECOMMENDATIONS.splice(0, PARTY_RECOMMENDATIONS.length, ...JSON.parse(JSON.stringify(value))); },
  resetSelection: () => { recommendationSelectedCharacter = ''; },
  withoutHsin: () => { const index = CHARACTERS.findIndex(item => item.id === 'hsin'); return CHARACTERS.splice(index, 1)[0]; },
  restoreCharacter: character => { CHARACTERS.push(character); },
  placement: memberPlacementIssue, renderRoster,
  allCharacterIds: () => CHARACTERS.map(character => character.id),
};`, context);
const app = context.__recQA;
const fire = (target, type, event = {}) => {
  for (const handler of target.listeners[type] || []) handler({ target, preventDefault() {}, ...event });
};
const docClick = (selector, dataset = {}) => {
  const target = new FakeElement(); target.selector = selector; target.dataset = dataset;
  fire(documentStub, 'click', { target });
};
const search = value => { el('recommendation-search').value = value; fire(el('recommendation-search'), 'input'); };
const stateFixture = (overrides = {}) => ({ schemaVersion: 7,
  owned: { hsin: true, suoming: true, shorekeeper: true, rover: true, ciaccona: true, iuno: true },
  parties: [{ id: 'keep-party', name: '기존 파티', members: ['jiyan', null, null], tag: '' }],
  schedules: [{ id: 'keep-schedule', charId: 'hsin', name: '저장 일정', start: '2026-10-01', end: '2026-11-01', saved: 80, goal: '명함', memo: '남길 내용' }],
  records: [{ id: 'keep-record', season: '검사', type: 'char', charId: 'jiyan', copy: 0, pulls: 70, lost: false }],
  calc: { astrite: 12345, lunite: 600 }, ...overrides });

assert.equal(el('recommendation-character').value, 'hsin', '기본 선택은 최신 추천 캐릭터');
assert.equal(el('roster-owned-view').hidden, false);
assert.equal(el('roster-recommendations-view').hidden, true);
docClick('[data-open-recommendations]');
assert.equal(el('roster-recommendations-view').hidden, false);
assert.equal(el('roster-owned-view').hidden, true);
assert.equal(el('tab-roster').hidden, false);
assert.equal(documentStub.activeElement, el('recommendation-character'));
assert.equal(viewButtons[1].attributes['aria-pressed'], 'true');
fire(el('roster-view-switch'), 'keydown', { target: viewButtons[1], key: 'ArrowLeft' });
assert.equal(el('roster-owned-view').hidden, false);
assert.equal(documentStub.activeElement, viewButtons[0], '방향키로 뷰 전환 및 초점 이동');
fire(el('roster-view-switch'), 'click', { target: viewButtons[1] });

// Ownership-management shortcuts must not retain the recommendation subview.
docClick('[data-open-recommendations]');
docClick('[data-go-tab], [data-jump-section]', { goTab: 'planner' });
assert.equal(el('tab-planner').hidden, false);
fire(el('goto-roster'), 'click');
assert.equal(el('tab-roster').hidden, false);
assert.equal(el('roster-owned-view').hidden, false, '홈 보유 관리 버튼은 추천뷰에서 돌아와도 보유 목록을 표시');
assert.equal(el('roster-recommendations-view').hidden, true);
assert.equal(viewButtons[0].attributes['aria-pressed'], 'true');
docClick('[data-open-recommendations]');
assert.equal(el('roster-recommendations-view').hidden, false, '직접 추천 진입은 계속 추천뷰를 표시');
docClick('[data-go-tab], [data-jump-section]', { goTab: 'planner' });
docClick('[data-go-tab], [data-jump-section]', { goTab: 'roster' });
assert.equal(el('tab-roster').hidden, false);
assert.equal(el('roster-owned-view').hidden, false, '홈 대시보드 보유 관리 바로가기도 보유 목록을 표시');
assert.equal(el('roster-recommendations-view').hidden, true);
docClick('[data-recommend-char]', { recommendChar: 'hsin' });
assert.equal(el('roster-recommendations-view').hidden, false, '캐릭터별 추천 버튼은 추천뷰를 표시');
assert.equal(el('roster-owned-view').hidden, true);
assert.equal(el('recommendation-character').value, 'hsin');

// Returning through the main character tab refreshes conflicts changed on Home.
app.setState(stateFixture({ parties: [{ id: 'conflict-party', name: '충돌 파티', members: ['hsin', null, null], tag: '' }] }));
app.openRecommendations('hsin');
assert.match(el('recommendation-list').innerHTML, /data-add-recommendation="main-team" disabled/, '충돌 파티가 있으면 추천 추가 비활성');
fire(el('tabs'), 'click', { target: tabButtons.find(button => button.dataset.tab === 'planner') });
assert.equal(el('tab-planner').hidden, false);
const deleteConflictButton = new FakeElement();
deleteConflictButton.selector = '[data-del-party]';
deleteConflictButton.dataset.delParty = 'conflict-party';
fire(el('party-list'), 'click', { target: deleteConflictButton });
assert.equal(app.getState().parties.some(party => party.id === 'conflict-party'), false, '홈에서 실제 파티 삭제 핸들러 실행');
fire(el('tabs'), 'click', { target: tabButtons.find(button => button.dataset.tab === 'roster') });
assert.equal(el('roster-recommendations-view').hidden, false, '상단 캐릭터 탭 복귀는 선택한 추천뷰 유지');
assert.match(el('recommendation-list').innerHTML, /data-add-recommendation="main-team"/);
assert.doesNotMatch(el('recommendation-list').innerHTML, /data-add-recommendation="main-team" disabled/, '상단 탭 복귀 시 삭제된 충돌을 반영해 추가 버튼 활성화');
assert.equal(app.issue('main-team', ''), null);

app.setState(stateFixture());
app.renderRecommendations();
assert.match(el('recommendation-list').innerHTML, /data-add-recommendation="main-team"/);
assert.match(el('recommendation-list').innerHTML, /미보유: 벨리나/);
assert.match(el('recommendation-list').innerHTML, /aria-describedby="recommendation-issue-/);
app.setRecommendations([fixtures[1], fixtures[0], ...fixtures.slice(2)]);
app.renderRecommendations();
assert(el('recommendation-list').innerHTML.indexOf('data-add-recommendation="main-team"') <
  el('recommendation-list').innerHTML.indexOf('data-add-recommendation="alternate-team"'), '더 많이 보유한 조합을 먼저 표시');
delete app.getState().owned.suoming;
app.renderRoster();
assert(el('recommendation-list').innerHTML.indexOf('data-add-recommendation="alternate-team"') <
  el('recommendation-list').innerHTML.indexOf('data-add-recommendation="main-team"'), '보유 인원이 같으면 원래 데이터 순서 유지');
app.getState().owned.suoming = true;
app.setRecommendations(fixtures);
app.renderRoster();
el('recommendation-owned-only').checked = true;
fire(el('recommendation-owned-only'), 'change');
assert.match(el('recommendation-list').innerHTML, /data-add-recommendation="main-team"/);
assert.doesNotMatch(el('recommendation-list').innerHTML, /data-add-recommendation="alternate-team"/);
el('recommendation-owned-only').checked = false;
search('  버디나 ');
assert.equal(el('recommendation-character').value, 'verina', '이전 캐릭터 이름 검색');
assert.match(el('recommendation-list').innerHTML, /대체 추천/);
search('');
el('recommendation-character').value = 'hsin';
fire(el('recommendation-character'), 'change');
assert.match(el('recommendation-list').innerHTML, /기본 추천/, '캐릭터 선택 변경으로 추천 갱신');
search('<script>');
assert.equal(el('recommendation-character').disabled, true);
assert.match(el('recommendation-summary').textContent, /검색 결과가 없습니다/);
assert.doesNotMatch(el('recommendation-list').innerHTML, /<script>/);
docClick('[data-recommend-char]', { recommendChar: 'rover' });
assert.equal(el('recommendation-search').value, '');
assert.equal(el('recommendation-character').value, 'rover');
assert.match(el('recommendation-list').innerHTML, /<p class="recommendation-condition"><strong>편성 조건<\/strong> 방랑자는 기류 속성으로 전환해야 합니다/);
assert.equal(app.issue('rover-missing-condition', '').code, 'rover-condition');
assert.equal(app.addRecommendation('rover-missing-condition', 'tower').ok, false);

app.openRecommendations('hsin');
const beforeAdd = JSON.parse(JSON.stringify(app.getState()));
const added = app.addRecommendation('main-team', '');
assert.equal(added.ok, true);
assert.equal(app.getState().parties.length, beforeAdd.parties.length + 1);
assert.deepEqual(JSON.parse(JSON.stringify(app.getState().parties[0])), beforeAdd.parties[0], '기존 파티 덮어쓰기 금지');
for (const key of Object.keys(beforeAdd).filter(key => key !== 'parties')) {
  assert.equal(JSON.stringify(app.getState()[key]), JSON.stringify(beforeAdd[key]), `추가 시 ${key} 데이터 보존`);
}
assert.equal(JSON.parse(storage.get('wuwa-planner-v1')).parties.at(-1).id, added.party.id);
assert.equal(el('tab-planner').hidden, false, '추가 후 홈으로 이동');
assert.equal(documentStub.activeElement, el('party-section'));
assert.equal(el('party-section').lastScroll.block, 'start');
assert.match(el('party-list').innerHTML, /기본 추천/, '기존 파티 렌더와 연동');
assert.equal(app.addRecommendation('main-team', '').code, 'duplicate-party');
assert.equal(app.addRecommendation('main-team', 'tower').ok, true, '콘텐츠는 다른 파티와 중복 캐릭터 허용');
assert.equal(app.addRecommendation('main-team', 'tower').code, 'duplicate-party');
app.setRecommendations([...fixtures, { ...fixtures[0], id: 'reversed', members: [...fixtures[0].members].reverse() }]);
assert.equal(app.addRecommendation('reversed', 'tower').code, 'duplicate-party', '멤버 순서만 다른 중복 파티 차단');
assert.equal(app.addRecommendation('main-team', 'sea').ok, true, '다른 콘텐츠에는 같은 3인 조합 저장 가능');

app.setState(stateFixture({ parties: [{ id: 'existing-content', name: '기존 탑', members: ['hsin', null, null], tag: 'tower' }] }));
assert.equal(app.issue('main-team', '').code, 'general-conflict', '일반 파티는 기존 콘텐츠 파티 중복도 금지');
assert.equal(app.issue('main-team', 'sea'), null);
assert.equal(app.addRecommendation('main-team', 'unknown-tag').code, 'invalid-content');
delete app.getState().owned.suoming;
assert.equal(app.addRecommendation('main-team', 'sea').code, 'not-owned', '직접 이벤트 호출도 보유 여부 재검증');
app.renderRoster();
assert.match(el('recommendation-list').innerHTML, /미보유: 쇄명/, '보유 변경 후 추천 카드 갱신');
assert.equal(app.addRecommendation('missing-id', '').code, 'invalid-id');

app.setState(stateFixture({ parties: [] }));
app.setRecommendations([...fixtures,
  { ...fixtures[0], id: 'same-member', members: ['hsin', 'hsin', 'shorekeeper'] },
  { ...fixtures[0], id: 'unknown-member', members: ['hsin', 'unknown-character', 'shorekeeper'] },
  { ...fixtures[0], id: 'duplicate-id' }, { ...fixtures[0], id: 'duplicate-id' },
  { ...fixtures[0], id: 'unsafe"id' },
]);
assert.equal(app.addRecommendation('same-member', 'tower').code, 'invalid-members');
assert.equal(app.addRecommendation('unknown-member', 'tower').code, 'unknown-character');
assert.equal(app.addRecommendation('duplicate-id', 'tower').code, 'invalid-id');
assert.equal(app.addRecommendation('unsafe"id', 'tower').code, 'invalid-id');
assert.equal(app.getState().parties.length, 0, '잘못된 추천은 파티를 만들지 않음');

app.setRecommendations([{ ...fixtures[0], id: 'xss', label: '<b>표시 검사</b>', reason: '<svg onload=alert(1)>',
  condition: '<img src=x onerror=alert(1)>', sources: [
    { label: '<script>자료</script>', url: 'https://example.com/safe', kind: 'community' },
    { label: '금지 링크', url: 'javascript:alert(1)', kind: 'official' },
  ] }]);
app.openRecommendations('hsin');
const markup = el('recommendation-list').innerHTML;
assert.match(markup, /&lt;b&gt;표시 검사&lt;\/b&gt;/);
assert.match(markup, /&lt;svg onload=alert\(1\)&gt;/);
assert.match(markup, /&lt;img src=x onerror=alert\(1\)&gt;/);
assert.match(markup, /&lt;script&gt;자료&lt;\/script&gt;/);
assert.match(markup, /rel="noopener noreferrer"/);
assert.doesNotMatch(markup, /<svg onload|<script>|<img src=x|javascript:/);

app.setRecommendations(fixtures);
app.setState(stateFixture());
const beforeFailure = JSON.stringify(app.getState());
failStorage = true;
assert.equal(app.addRecommendation('main-team', '').code, 'save-failed');
failStorage = false;
assert.equal(JSON.stringify(app.getState()), beforeFailure, '저장 실패 시 새 항목만 되돌리고 기존 데이터 유지');
assert.match(el('recommendation-summary').textContent, /저장하지 못했습니다/);
app.setState(stateFixture({ parties: Array.from({ length: 100 }, (_, index) =>
  ({ id: `party-${index}`, name: `파티 ${index}`, members: [null, null, null], tag: '' })) }));
assert.equal(app.addRecommendation('main-team', '').code, 'party-limit', '백업 호환성을 위해 100개 제한 유지');

const hsin = app.withoutHsin();
app.resetSelection();
app.renderRecommendations();
assert.notEqual(el('recommendation-character').value, 'hsin');
assert.notEqual(el('recommendation-character').value, '', 'hsin이 없는 데이터에서도 첫 캐릭터 선택');
app.restoreCharacter(hsin);

const teamsContext = vm.createContext({ console });
vm.runInContext(fs.readFileSync(path.join(root, 'js/data.js'), 'utf8'), teamsContext);
vm.runInContext(fs.readFileSync(path.join(root, 'js/teams.js'), 'utf8'), teamsContext);
const realRecommendations = vm.runInContext('JSON.stringify(PARTY_RECOMMENDATIONS)', teamsContext);
const realEntries = JSON.parse(realRecommendations);
assert(realEntries.length > 0, '실제 추천 데이터가 존재함');
app.setRecommendations(realEntries);
app.setState(stateFixture({ parties: [], owned: Object.fromEntries(Array.from(app.allCharacterIds(), id => [id, true])) }));
for (const entry of realEntries) {
  assert.equal(app.issue(entry.id, 'tower'), null, `${entry.id} 실제 조합의 캐릭터·방랑자 조건·ID 검증`);
  assert(Array.isArray(entry.sources) && entry.sources.length > 0, `${entry.id} 추천 출처 있음`);
}
for (const id of app.allCharacterIds()) {
  assert(realEntries.some(entry => entry.members.includes(id)), `${id} 캐릭터에 추천 조합 제공`);
}
app.openRecommendations('hsin');
assert.equal((el('recommendation-list').innerHTML.match(/data-add-recommendation=/g) || []).length,
  realEntries.filter(entry => entry.members.includes('hsin')).length, '실제 최신 캐릭터 추천 조합 렌더');
const realAdd = app.addRecommendation(realEntries[0].id, 'tower');
assert.equal(realAdd.ok, true, '실제 추천 데이터로 파티 저장 성공');
assert.deepEqual(Array.from(realAdd.party.members), realEntries[0].members);

console.log(`추천 파티 검사 통과: 실제 ${realEntries.length}조합 연결, 검색·보유 정렬·키보드, 방랑자 조건, 보유·중복 규칙, 출처·XSS, 저장 및 기존 데이터 보존.`);
