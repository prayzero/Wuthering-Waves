/* Character-based party suggestions. Load after teams.js and app.js. */
let recommendationSelectedCharacter = '';
let recommendationActiveView = 'owned';

function recommendationData() {
  return typeof PARTY_RECOMMENDATIONS !== 'undefined' && Array.isArray(PARTY_RECOMMENDATIONS)
    ? PARTY_RECOMMENDATIONS : [];
}

function recommendationText(value, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function recommendationSafeId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(value);
}

function recommendationSourceUrl(value) {
  return typeof value === 'string' && value.length <= 2000 &&
    /^https:\/\/[a-z0-9.-]+(?::\d+)?(?:[/?#][^\s<>"']*)?$/i.test(value) ? value : '';
}

function recommendationValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function recommendationEntryIssue(entry) {
  if (!entry || !recommendationSafeId(entry.id) || recommendationData().filter(item => item?.id === entry.id).length !== 1) {
    return { code: 'invalid-id', message: '추천 정보 확인 필요' };
  }
  if (!Array.isArray(entry.members) || entry.members.length !== 3 || new Set(entry.members).size !== 3) {
    return { code: 'invalid-members', message: '서로 다른 공명자 3명이 필요합니다.' };
  }
  if (entry.members.some(id => !recommendationSafeId(id) || !charById(id))) {
    return { code: 'unknown-character', message: '등록되지 않은 캐릭터가 있습니다.' };
  }
  if (entry.members.includes('rover') && !recommendationText(entry.condition)) {
    return { code: 'rover-condition', message: '방랑자 속성 조건 확인 필요' };
  }
  return null;
}

function recommendationAddIssue(entry, tag = '') {
  const invalid = recommendationEntryIssue(entry);
  if (invalid) return invalid;
  if (typeof tag !== 'string' || (tag !== '' && !state.contents.some(content => content.id === tag))) {
    return { code: 'invalid-content', message: '콘텐츠 선택을 확인해 주세요.' };
  }
  const missing = entry.members.filter(id => !isOwned(id));
  if (missing.length) return { code: 'not-owned', message: `미보유: ${missing.map(id => charById(id).name).join(' · ')}` };
  const memberKey = [...entry.members].sort().join('|');
  const duplicate = state.parties.find(party => (party.tag || '') === tag &&
    Array.isArray(party.members) && party.members.length === 3 && [...party.members].sort().join('|') === memberKey);
  if (duplicate) return { code: 'duplicate-party', message: `이미 추가됨: ${duplicate.name}` };
  if (!tag) {
    const used = entry.members.filter(id => state.parties.some(party => party.members.includes(id)));
    if (used.length) return { code: 'general-conflict', message: `기존 편성: ${used.map(id => charById(id).name).join(' · ')}` };
  }
  if (state.parties.length >= 100) return { code: 'party-limit', message: '파티는 최대 100개까지 저장할 수 있습니다.' };
  return null;
}

function recommendationSourceMarkup(entry) {
  const seen = new Set();
  const links = (Array.isArray(entry.sources) ? entry.sources : []).slice(0, 12).flatMap(source => {
    if (!source || !recommendationSourceUrl(source.url) || !['official', 'community'].includes(source.kind) || seen.has(source.url)) return [];
    seen.add(source.url);
    const label = recommendationText(source.label, 120) || '추천 자료';
    return [`<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${source.kind === 'official' ? '공식 설명' : '커뮤니티 분석'} · ${esc(label)}</a></li>`];
  });
  return `<details class="recommendation-sources"><summary>추천 근거·출처</summary>
    ${recommendationValidDate(entry.verifiedAt) ? `<p>확인일 ${esc(entry.verifiedAt)}</p>` : ''}
    ${links.length ? `<ul>${links.join('')}</ul>` : '<p>확인 가능한 출처가 아직 없습니다.</p>'}
  </details>`;
}

function renderRecommendations() {
  const list = document.getElementById('recommendation-list');
  const select = document.getElementById('recommendation-character');
  const summary = document.getElementById('recommendation-summary');
  if (!list || !select || !summary) return;
  const characters = allChars();
  if (!characters.some(character => character.id === recommendationSelectedCharacter)) {
    recommendationSelectedCharacter = characters.find(character => character.id === 'hsin')?.id || characters[0]?.id || '';
  }
  const query = document.getElementById('recommendation-search')?.value || '';
  const matches = characters.filter(character => characterMatchesSearch(character, query));
  if (matches.length && !matches.some(character => character.id === recommendationSelectedCharacter)) {
    recommendationSelectedCharacter = matches[0].id;
  }
  select.innerHTML = matches.length ? matches.map(character =>
    `<option value="${esc(character.id)}"${character.id === recommendationSelectedCharacter ? ' selected' : ''}>${esc(character.name)}</option>`).join('')
    : '<option value="">검색 결과 없음</option>';
  select.disabled = !matches.length;
  select.value = matches.length ? recommendationSelectedCharacter : '';
  summary.setAttribute('aria-live', 'polite');
  if (!matches.length) {
    summary.textContent = '검색 결과가 없습니다.';
    list.innerHTML = '<p class="recommendation-empty">공명자 이름이나 이전 이름으로 검색해 주세요.</p>';
    return;
  }
  const character = charById(recommendationSelectedCharacter);
  const ownedOnly = document.getElementById('recommendation-owned-only')?.checked === true;
  const tag = document.getElementById('recommendation-content')?.value || '';
  const recommendations = recommendationData().filter(entry => Array.isArray(entry?.members) && entry.members.includes(character.id));
  const visible = recommendations.map((entry, order) => ({ entry, order, owned: entry.members.filter(id => isOwned(id)).length }))
    .filter(({ entry }) => !ownedOnly || entry.members.length === 3 && entry.members.every(id => isOwned(id)))
    .sort((left, right) => right.owned - left.owned || left.order - right.order)
    .map(({ entry }) => entry);
  summary.textContent = `${character.name} 추천 ${visible.length}개${ownedOnly ? ' · 3명 모두 보유한 조합' : ''} · ${tag ? '콘텐츠 파티' : '일반 파티'}`;
  list.innerHTML = visible.map((entry, index) => {
    const issue = recommendationAddIssue(entry, tag);
    const condition = recommendationText(entry.condition) || (entry.members.includes('rover') ? '방랑자 속성 조건 확인 필요' : '');
    const label = recommendationText(entry.label, 120) || '추천 파티';
    return `<article class="recommendation-card" aria-labelledby="recommendation-title-${index}">
      <h3 id="recommendation-title-${index}">${esc(label)}</h3>
      <ul class="recommendation-members">${entry.members.slice(0, 3).map(id => {
        const member = charById(id);
        const owned = member && isOwned(id);
        return `<li class="${owned ? 'owned' : 'not-owned'}">
          ${member ? avatarHTML(member, { small: true, gray: !owned }) : '<span class="recommendation-unknown" aria-hidden="true">?</span>'}
          <span class="recommendation-member-name">${esc(member?.name || '등록되지 않은 캐릭터')}</span>
          <small>${owned ? '보유' : '미보유'}</small>
        </li>`;
      }).join('')}</ul>
      <p class="recommendation-reason">${esc(recommendationText(entry.reason) || '추천 이유 확인 필요')}</p>
      ${condition ? `<p class="recommendation-condition"><strong>편성 조건</strong> ${esc(condition)}</p>` : ''}
      ${recommendationSourceMarkup(entry)}
      <div class="recommendation-action">
        <button type="button" class="primary-btn" data-add-recommendation="${esc(entry.id)}"${issue ? ` disabled aria-describedby="recommendation-issue-${index}"` : ''} aria-label="${esc(label)} 파티로 추가">파티로 추가</button>
        ${issue ? `<p id="recommendation-issue-${index}">${esc(issue.message)}</p>` : '<p>새 파티로 저장합니다.</p>'}
      </div>
    </article>`;
  }).join('') || `<p class="recommendation-empty">${ownedOnly && recommendations.length
    ? '3명 모두 보유한 추천 조합이 없습니다. 보유 전용 필터를 해제하면 필요한 캐릭터를 볼 수 있습니다.'
    : '이 공명자는 확인된 추천 조합이 아직 없습니다.'}</p>`;
}

function showRosterView(view, { focus = false } = {}) {
  if (!['owned', 'recommendations', 'progress'].includes(view)) return false;
  recommendationActiveView = view;
  const owned = document.getElementById('roster-owned-view');
  const recommendations = document.getElementById('roster-recommendations-view');
  const progress = document.getElementById('roster-progress-view');
  if (owned) owned.hidden = view !== 'owned';
  if (recommendations) recommendations.hidden = view !== 'recommendations';
  if (progress) progress.hidden = view !== 'progress';
  document.querySelectorAll('#roster-view-switch [data-roster-view]').forEach(button => {
    const active = button.dataset.rosterView === view;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-controls', `roster-${button.dataset.rosterView}-view`);
    if (active && focus) button.focus();
  });
  if (view === 'recommendations') renderRecommendations();
  if (view === 'progress' && typeof renderCharacterProgress === 'function') renderCharacterProgress();
  return true;
}

function openRecommendations(charId) {
  if (charId && charById(charId)) recommendationSelectedCharacter = charId;
  const search = document.getElementById('recommendation-search');
  if (search) search.value = '';
  switchTab('roster', { focus: false });
  showRosterView('recommendations');
  document.getElementById('recommendation-character')?.focus();
}

function addRecommendation(id, tag = document.getElementById('recommendation-content')?.value || '') {
  const entry = recommendationData().find(item => item?.id === id);
  const issue = recommendationAddIssue(entry, tag);
  if (issue) {
    renderRecommendations();
    const summary = document.getElementById('recommendation-summary');
    if (summary) summary.textContent = issue.message;
    return { ok: false, ...issue };
  }
  let partyId = uid();
  for (let attempt = 0; state.parties.some(party => party.id === partyId) && attempt < 5; attempt++) partyId = uid();
  if (!recommendationSafeId(partyId) || state.parties.some(party => party.id === partyId)) {
    const summary = document.getElementById('recommendation-summary');
    if (summary) summary.textContent = '파티 ID를 만들지 못했습니다. 다시 시도해 주세요.';
    return { ok: false, code: 'id-conflict', message: '파티 ID를 만들지 못했습니다. 다시 시도해 주세요.' };
  }
  const party = { id: partyId, name: (recommendationText(entry.label, 16) || '추천 파티'), members: [...entry.members], tag };
  state.parties.push(party);
  try { save(); }
  catch {
    state.parties.splice(state.parties.indexOf(party), 1);
    const summary = document.getElementById('recommendation-summary');
    if (summary) summary.textContent = '파티를 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.';
    return { ok: false, code: 'save-failed', message: '브라우저에 파티를 저장하지 못했습니다.' };
  }
  renderParties();
  renderContents();
  renderPlannerOverview();
  renderRecommendations();
  switchTab('planner', { scroll: false });
  const section = document.getElementById('party-section');
  section?.focus({ preventScroll: true });
  section?.scrollIntoView?.({ block: 'start', behavior: 'auto' });
  return { ok: true, party };
}

document.getElementById('recommendation-search')?.addEventListener('input', renderRecommendations);
document.getElementById('recommendation-character')?.addEventListener('change', event => {
  if (charById(event.target.value)) recommendationSelectedCharacter = event.target.value;
  renderRecommendations();
});
document.getElementById('recommendation-owned-only')?.addEventListener('change', renderRecommendations);
document.getElementById('recommendation-content')?.addEventListener('change', renderRecommendations);
document.getElementById('roster-view-switch')?.addEventListener('click', event => {
  const button = event.target.closest('[data-roster-view]');
  if (button) showRosterView(button.dataset.rosterView);
});
document.getElementById('roster-view-switch')?.addEventListener('keydown', event => {
  const current = event.target.closest('[data-roster-view]');
  if (!current || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  const buttons = Array.from(document.querySelectorAll('#roster-view-switch [data-roster-view]'));
  const currentIndex = buttons.indexOf(current);
  if (currentIndex === -1 || !buttons.length) return;
  event.preventDefault();
  const index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
    : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
  showRosterView(buttons[index].dataset.rosterView, { focus: true });
});
document.addEventListener('click', event => {
  const add = event.target.closest('[data-add-recommendation]');
  if (add) { addRecommendation(add.dataset.addRecommendation); return; }
  const character = event.target.closest('[data-recommend-char]');
  if (character) { openRecommendations(character.dataset.recommendChar); return; }
  if (event.target.closest('[data-open-recommendations]')) openRecommendations();
});

showRosterView(recommendationActiveView);
renderRecommendations();
