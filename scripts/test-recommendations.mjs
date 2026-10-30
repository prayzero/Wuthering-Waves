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
let confirmAnswer = true;
const confirmations = [];
const storage = new Map();
const context = vm.createContext({ console, document: documentStub,
  localStorage: { getItem: key => storage.get(key) ?? null, setItem(key, value) {
    if (failStorage) throw new Error('QuotaExceededError'); storage.set(key, String(value));
  } }, navigator: {}, window: { addEventListener() {}, scrollTo() {}, innerWidth: 1280, innerHeight: 800 },
  confirm: message => { confirmations.push(message); return confirmAnswer; }, setTimeout: () => 1, clearTimeout() {} });

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
vm.runInContext(fs.readFileSync(path.join(root, 'js/optimizer.js'), 'utf8'), context, { filename: 'optimizer.js' });
vm.runInContext(fs.readFileSync(path.join(root, 'js/recommendations.js'), 'utf8'), context, { filename: 'recommendations.js' });
vm.runInContext(`globalThis.__recQA = {
  renderRecommendations, openRecommendations, showRosterView, addRecommendation,
  renderAutomaticParties, calculateAutomaticPartyPlan, saveAutomaticParties,
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
assert.equal(documentStub.activeElement, el('auto-party-scope'));
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
app.setState(stateFixture({ parties: [], owned: Object.fromEntries(Array.from(app.allCharacterIds(), id => [id, true])),
  characterProgress: { rover: { sequence: 4 } } }));
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

// End-to-end UI handlers with the actual optimizer, independent of example team order.
const autoEntries = [fixtures[0], fixtures[1], { ...fixtures[2], id: 'second-team',
  members: ['suoming', 'iuno', 'rover'], condition: '방랑자 인멸 속성' }];
const autoOwned = Object.fromEntries(['hsin', 'suoming', 'shorekeeper', 'verina', 'ciaccona', 'iuno', 'rover', 'jiyan'].map(id => [id, true]));
const autoState = overrides => stateFixture({ owned: autoOwned, parties: [], ...overrides });
const plain = value => JSON.parse(JSON.stringify(value));
const nonParties = value => { const copy = plain(value); delete copy.parties; return copy; };
function setAuto(overrides = {}) {
  app.setRecommendations(autoEntries);
  app.setState(autoState(overrides));
  el('auto-party-scope').value = 'all';
  el('auto-party-limit').value = '';
  confirmAnswer = true;
  failStorage = false;
  app.renderRecommendations();
}
setAuto();
assert.equal(app.calculateAutomaticPartyPlan().teams.length, 2, '전체 묶음은 먼저 보이는 1파티 대신 겹치지 않는 2파티를 선택');
assert(el('auto-party-summary').textContent.includes('2파티 / 6명'));
assert.match(el('auto-party-remaining').innerHTML, /다른 보유 조합 1개/);
assert.match(el('auto-party-list').innerHTML, /돌파 미입력/);
assert.equal(el('auto-party-save').disabled, false);
const beforeAuto = plain(app.getState());
fire(el('auto-party-save'), 'click');
assert.equal(app.getState().parties.length, 2, '실제 일괄저장 버튼 핸들러');
assert.equal(new Set(app.getState().parties.flatMap(p => p.members)).size, 6);
assert.deepEqual(nonParties(app.getState()), nonParties(beforeAuto), '파티 이외의 기록을 보존');
assert.equal(JSON.parse(storage.get('wuwa-planner-v1')).parties.length, 2, '브라우저 저장 반영');
assert.equal(app.saveAutomaticParties().code, 'already-applied', '동일조합 재적용 차단');
assert.equal(documentStub.activeElement, el('party-section'));
fire(el('auto-party-scope'), 'change', { target: Object.assign(el('auto-party-scope'), { value: 'available' }) });
assert.equal(app.calculateAutomaticPartyPlan().teams.length, 0, '저장한 캐릭터는 제외모드에서 재사용하지 않음');
assert.equal(el('auto-party-save').disabled, true);

setAuto({ parties: [{ id: 'old-general', name: '보존 확인', members: ['shorekeeper', null, null], tag: '' },
  { id: 'old-content', name: '탑 기록', members: ['jiyan', null, null], tag: 'tower' }] });
const beforeReplace = plain(app.getState());
confirmAnswer = false;
assert.equal(app.saveAutomaticParties().code, 'cancelled');
assert.deepEqual(plain(app.getState()), beforeReplace, '교체 취소는 기록을 변경하지 않음');
assert.match(confirmations.at(-1), /일반 파티 1개/);
confirmAnswer = true;
assert.equal(app.saveAutomaticParties().ok, true);
assert.deepEqual(plain(app.getState().parties.find(p => p.id === 'old-content')), beforeReplace.parties.find(p => p.id === 'old-content'));
assert.equal(app.getState().parties.some(p => p.id === 'old-general'), false);
assert.deepEqual(nonParties(app.getState()), nonParties(beforeReplace));

setAuto({ parties: [{ id: 'busy-content', name: '해역 파티', members: ['hsin', null, null], tag: 'sea' }] });
assert.equal(app.calculateAutomaticPartyPlan().teams.length, 2, '전체모드에서는 충돌해도 결과 미리보기 제공');
assert.equal(app.saveAutomaticParties().code, 'existing-conflict', '콘텐츠 파티와 겹치는 일반편성 저장 차단');
assert.match(el('auto-party-save-note').textContent, /콘텐츠 편성과 겹침/);
el('auto-party-scope').value = 'available';
fire(el('auto-party-scope'), 'change');
const beforeAppend = plain(app.getState());
assert.equal(app.calculateAutomaticPartyPlan().teams.length, 1);
assert.equal(app.saveAutomaticParties().ok, true);
assert.deepEqual(plain(app.getState().parties[0]), beforeAppend.parties[0], '제외모드는 기존파티를 보존하고 추가');

setAuto();
el('auto-party-limit').value = '1';
fire(el('auto-party-limit'), 'change');
assert.equal(app.calculateAutomaticPartyPlan().teams.length, 1, '파티수 선택 핸들러');
assert(el('auto-party-summary').textContent.includes('1파티 / 3명'));
setAuto();
delete app.getState().owned.hsin;
const afterOwnership = JSON.stringify(app.getState());
assert.equal(app.saveAutomaticParties().code, 'stale-plan', '미리보기 후 보유변경 감지');
assert.equal(JSON.stringify(app.getState()), afterOwnership);
setAuto();
app.getState().characterProgress.hsin = { sequence: 2, signatureWeapon: true };
assert.equal(app.saveAutomaticParties().code, 'stale-plan', '미리보기 후 세팅변경 감지');
setAuto();
app.setRecommendations([...autoEntries, { ...fixtures[0], id: 'new-source' }]);
assert.equal(app.saveAutomaticParties().code, 'stale-plan', '미리보기 후 후보변경 감지');

setAuto({ parties: [{ id: 'rollback', name: '남길 파티', members: ['shorekeeper', null, null], tag: '' }] });
const beforeQuota = plain(app.getState());
const storageBeforeQuota = storage.get('wuwa-planner-v1');
failStorage = true;
assert.equal(app.saveAutomaticParties().code, 'save-failed');
failStorage = false;
assert.deepEqual(plain(app.getState()), beforeQuota, '전체 일괄저장 실패 시 기존 배열 복구');
assert.equal(storage.get('wuwa-planner-v1'), storageBeforeQuota);
setAuto({ parties: [{ id: 'collision', name: 'ID충돌', members: ['jiyan', null, null], tag: 'tower' }] });
const beforeCollision = JSON.stringify(app.getState());
vm.runInContext('globalThis.savedUid = uid; uid = () => "collision";', context);
assert.equal(app.saveAutomaticParties().code, 'id-conflict');
vm.runInContext('uid = globalThis.savedUid;', context);
assert.equal(JSON.stringify(app.getState()), beforeCollision);
setAuto({ parties: Array.from({ length: 99 }, (_, i) => ({ id: 'full-' + i, name: '빈 탑', members: [null,null,null], tag: 'tower' })) });
assert.equal(app.saveAutomaticParties().code, 'party-limit');

setAuto();
app.setRecommendations([{ ...fixtures[0], id: 'conditional', requirements: [{ characterId: 'hsin', minSequence: 4, signatureWeapon: true }] }]);
app.renderRecommendations();
assert.match(el('auto-party-remaining').innerHTML, /입력·필수 조건 확인 1조합/);
assert.equal(app.calculateAutomaticPartyPlan().teams.length, 0);
assert.equal(app.issue('conditional', 'tower').code, 'requirements');
vm.runInContext("setCharacterBuild('hsin', 'sequence', 4); setCharacterBuild('hsin', 'signatureWeapon', true);", context);
app.renderRecommendations();
assert.equal(app.calculateAutomaticPartyPlan().teams.length, 1);
assert.equal(app.issue('conditional', 'tower'), null);
app.setRecommendations([{ ...fixtures[0], label: '<img src=x onerror=alert(1)>', reason: '<svg onload=x>',
  condition: '<script>unsafe</script>' }]);
app.renderRecommendations();
assert.match(el('auto-party-list').innerHTML, /&lt;img/);
assert.doesNotMatch(el('auto-party-list').innerHTML, /<script>|<svg onload|<img src=x/);
setAuto({ owned: {} });
assert.equal(el('auto-party-save').disabled, true);
assert.match(el('auto-party-list').innerHTML, /3명 이상/);
assert.equal(app.saveAutomaticParties().code, 'empty-plan');

console.log('자동편성 UI 통합 검사 통과: 전체최적화, 일괄저장·교체취소·콘텐츠보존·중복·stale·quota·ID·상한·조건·XSS.');
console.log(`추천 파티 검사 통과: 실제 ${realEntries.length}조합 연결, 검색·보유 정렬·키보드, 방랑자 조건, 보유·중복 규칙, 출처·XSS, 저장 및 기존 데이터 보존.`);
