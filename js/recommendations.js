/* Character-based party suggestions. Load after teams.js and app.js. */
let recommendationSelectedCharacter = '';
let recommendationActiveView = 'owned';
let automaticPartyPreview = null;

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
  const requirementIssue = recommendationRequirementsIssue(entry);
  if (requirementIssue) return requirementIssue;
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

function recommendationRequirementsIssue(entry) {
  if (!Object.prototype.hasOwnProperty.call(entry, 'requirements')) return null;
  if (!Array.isArray(entry.requirements)) return { code: 'invalid-requirements', message: '편성 조건 자료를 확인해 주세요.' };
  const seen = new Set();
  for (const requirement of entry.requirements) {
    const sequenceRequired = requirement && Object.prototype.hasOwnProperty.call(requirement, 'minSequence');
    const signatureRequired = requirement && Object.prototype.hasOwnProperty.call(requirement, 'signatureWeapon');
    if (!requirement || typeof requirement !== 'object' || Array.isArray(requirement) ||
      !recommendationSafeId(requirement.characterId) || !entry.members.includes(requirement.characterId) || seen.has(requirement.characterId) ||
      Object.keys(requirement).some(key => !['characterId', 'minSequence', 'signatureWeapon'].includes(key)) ||
      (!sequenceRequired && !signatureRequired) ||
      (sequenceRequired && (!Number.isInteger(requirement.minSequence) || requirement.minSequence < 0 || requirement.minSequence > 6)) ||
      (signatureRequired && requirement.signatureWeapon !== true)) {
      return { code: 'invalid-requirements', message: '편성 조건 자료를 확인해 주세요.' };
    }
    seen.add(requirement.characterId);
    const name = charById(requirement.characterId)?.name || requirement.characterId;
    const build = typeof getCharacterBuild === 'function' ? getCharacterBuild(requirement.characterId) : {};
    if (sequenceRequired && (!Number.isInteger(build.sequence) || build.sequence < requirement.minSequence)) {
      return { code: 'requirements', message: `${name} ${requirement.minSequence}돌 이상 입력이 필요합니다.` };
    }
    if (signatureRequired && build.signatureWeapon !== true) {
      return { code: 'requirements', message: `${name} 전무 보유 입력이 필요합니다.` };
    }
  }
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

function automaticPartySettings() {
  const scope = document.getElementById('auto-party-scope')?.value || 'all';
  const rawLimit = document.getElementById('auto-party-limit')?.value || '';
  return { scope, maxTeams: rawLimit === '' ? null : Number(rawLimit) };
}

function automaticPartySettingsIssue(settings) {
  return !['all', 'available'].includes(settings.scope) ||
    (settings.maxTeams !== null && (!Number.isInteger(settings.maxTeams) || settings.maxTeams < 1 || settings.maxTeams > 100));
}

function automaticPartyFingerprint(settings) {
  return JSON.stringify({ settings, characters: allChars(), owned: state.owned,
    progress: state.characterProgress, parties: state.parties, recommendations: recommendationData() });
}

function calculateAutomaticPartyPlan(settings = automaticPartySettings()) {
  if (typeof optimizeOwnedParties !== 'function' || automaticPartySettingsIssue(settings)) return null;
  const excludedIds = settings.scope === 'available'
    ? [...new Set(state.parties.flatMap(party => party.members).filter(Boolean))] : [];
  const result = optimizeOwnedParties({ characters: allChars(), owned: state.owned,
    progress: state.characterProgress, recommendations: recommendationData(), excludedIds, maxTeams: settings.maxTeams });
  return { ...result, settings: { ...settings }, fingerprint: automaticPartyFingerprint(settings) };
}

function automaticPartySaveIssue(plan) {
  if (!plan || !Array.isArray(plan.teams) || !plan.teams.length) return { code: 'empty-plan', message: '편성할 수 있는 파티가 없습니다.' };
  const seen = new Set();
  for (const entry of plan.teams) {
    const invalid = recommendationEntryIssue(entry);
    if (invalid) return invalid;
    const requirementIssue = recommendationRequirementsIssue(entry);
    if (requirementIssue) return requirementIssue;
    for (const id of entry.members) {
      if (!isOwned(id)) return { code: 'not-owned', message: '보유 상태가 변경되었습니다. 추천을 다시 확인해 주세요.' };
      if (seen.has(id)) return { code: 'plan-conflict', message: '추천 파티의 캐릭터가 중복됩니다.' };
      seen.add(id);
    }
  }
  const retained = plan.settings.scope === 'all' ? state.parties.filter(party => party.tag) : state.parties;
  const conflicts = [...seen].filter(id => retained.some(party => party.members.includes(id)));
  if (conflicts.length) return { code: 'existing-conflict', message: `${plan.settings.scope === 'all' ? '콘텐츠' : '기존'} 편성과 겹침: ${conflicts.map(id => charById(id)?.name || id).join(' · ')}. ‘기존 편성 캐릭터 제외’를 선택해 주세요.` };
  if (retained.length + plan.teams.length > 100) return { code: 'party-limit', message: '저장할 파티가 100개를 넘습니다. 기존 파티를 정리해 주세요.' };
  if (plan.settings.scope === 'all') {
    const current = state.parties.filter(party => !party.tag).map(party => [...party.members].sort().join('|')).sort();
    const proposed = plan.teams.map(entry => [...entry.members].sort().join('|')).sort();
    if (JSON.stringify(current) === JSON.stringify(proposed)) return { code: 'already-applied', message: '현재 일반 파티에 같은 조합이 적용되어 있습니다.' };
  }
  return null;
}

function automaticPartyBuildMarkup(id) {
  const milestones = typeof getCharacterProgress === 'function' ? getCharacterProgress(id) : {};
  const completed = ['level90', 'skills', 'echo', 'weapon'].filter(key => milestones[key] === true).length;
  const build = typeof getCharacterBuild === 'function' ? getCharacterBuild(id) : {};
  const sequence = Number.isInteger(build.sequence) && build.sequence >= 0 && build.sequence <= 6
    ? build.sequence === 0 ? '명함' : `${build.sequence}돌` : '돌파 미입력';
  const signature = build.signatureWeapon === true ? '전무 보유' : build.signatureWeapon === false ? '전무 미보유' : '전무 미입력';
  return `<small>육성 ${completed}/4</small><span class="auto-party-build">${sequence}<br>${signature}</span>`;
}

function automaticPartyNames(ids) {
  return ids.map(id => esc(charById(id)?.name || id)).join(' · ');
}

function renderAutomaticParties() {
  const list = document.getElementById('auto-party-list');
  const summary = document.getElementById('auto-party-summary');
  const button = document.getElementById('auto-party-save');
  if (!list || !summary || !button || typeof optimizeOwnedParties !== 'function') return;
  const limit = document.getElementById('auto-party-limit');
  const previousLimit = limit?.value || '';
  const ownedIds = allChars().filter(character => isOwned(character.id)).map(character => character.id);
  if (limit) {
    const max = Math.floor(ownedIds.length / 3);
    limit.innerHTML = '<option value="">가능한 전부</option>' + Array.from({ length: max }, (_, i) => `<option value="${i + 1}">${i + 1}개</option>`).join('');
    limit.value = /^\d+$/.test(previousLimit) && Number(previousLimit) >= 1 && Number(previousLimit) <= max ? previousLimit : '';
  }
  const settings = automaticPartySettings();
  const fingerprint = automaticPartyFingerprint(settings);
  if (automaticPartyPreview?.fingerprint !== fingerprint) automaticPartyPreview = calculateAutomaticPartyPlan(settings);
  const plan = automaticPartyPreview;
  if (!plan) {
    summary.textContent = '편성 설정을 확인해 주세요.';
    list.innerHTML = '';
    button.disabled = true;
    return;
  }
  const usedIds = plan.teams.flatMap(entry => entry.members);
  const excludedIds = settings.scope === 'available' ? ownedIds.filter(id => state.parties.some(party => party.members.includes(id))) : [];
  const remainingIds = ownedIds.filter(id => !usedIds.includes(id) && !excludedIds.includes(id));
  summary.textContent = `보유 ${ownedIds.length}명 · ${plan.teams.length}파티 / ${usedIds.length}명 편성${excludedIds.length ? ` · 기존 편성 ${excludedIds.length}명 제외` : ''}`;
  list.innerHTML = plan.teams.map((entry, index) => `<article class="recommendation-card auto-party-card" aria-labelledby="auto-party-title-${index}">
    <h4 id="auto-party-title-${index}"><span>${index + 1}파티</span> ${esc(recommendationText(entry.label, 120) || '추천 조합')}</h4>
    <ul class="recommendation-members">${entry.members.map(id => {
      const member = charById(id);
      return `<li class="owned">${avatarHTML(member, { small: true })}<span class="recommendation-member-name">${esc(member.name)}</span>${automaticPartyBuildMarkup(id)}<button type="button" class="auto-party-edit" data-open-progress="${esc(id)}" data-progress-char="${esc(id)}" aria-label="${esc(member.name)} 육성 수정">수정</button></li>`;
    }).join('')}</ul>
    ${recommendationText(entry.condition) ? `<p class="recommendation-condition"><strong>편성 조건</strong> ${esc(recommendationText(entry.condition))}</p>` : ''}
    <details class="auto-party-reason"><summary>조합 이유</summary><p>${esc(recommendationText(entry.reason) || '추천 자료를 확인해 주세요.')}</p></details>
    ${recommendationSourceMarkup(entry)}
  </article>`).join('') || `<div class="recommendation-empty">${ownedIds.length < 3 ? '보유 캐릭터를 3명 이상 등록해 주세요.' : '이 범위에서 조건을 충족하는 3인 추천 조합이 없습니다. 보유 목록과 육성 입력을 확인해 주세요.'}</div>`;
  const remaining = document.getElementById('auto-party-remaining');
  if (remaining) {
    const blocked = Array.isArray(plan.blockedTeams) ? plan.blockedTeams : [];
    const selectedIds = new Set(plan.teams.map(entry => entry.id));
    const alternatives = (Array.isArray(plan.eligibleTeams) ? plan.eligibleTeams : []).filter(entry => !selectedIds.has(entry.id));
    remaining.innerHTML = `${remainingIds.length ? `<details class="auto-party-leftover"><summary>남은 캐릭터 ${remainingIds.length}명</summary><p>${automaticPartyNames(remainingIds)}</p><p>선택한 파티 수, 다른 파티와의 중복, 조합 자료 또는 필수 조건 때문에 이번 편성에서 제외됐습니다.</p></details>` : ''}
      ${excludedIds.length ? `<details class="auto-party-leftover"><summary>기존 편성에서 사용 중 ${excludedIds.length}명</summary><p>${automaticPartyNames(excludedIds)}</p></details>` : ''}
      ${blocked.length ? `<details class="auto-party-leftover"><summary>입력·필수 조건 확인 ${blocked.length}조합</summary><ul>${blocked.map(item => `<li><strong>${esc(recommendationText(item.entry?.label, 120) || '추천 조합')}</strong> · ${(Array.isArray(item.reasons) ? item.reasons : []).map(reason => esc(recommendationText(reason))).join(' · ')}</li>`).join('')}</ul></details>` : ''}
      ${alternatives.length ? `<details class="auto-party-leftover auto-party-alternatives"><summary>다른 보유 조합 ${alternatives.length}개</summary><p>각각 가능한 대안입니다. 위 편성이나 다른 대안과 캐릭터가 겹칠 수 있습니다.</p><div class="auto-party-alternative-list">${alternatives.map(entry => `<article><h4>${esc(recommendationText(entry.label, 120) || '추천 조합')}</h4><p>${automaticPartyNames(entry.members)}</p>${recommendationText(entry.condition) ? `<p class="auto-party-alternative-condition">${esc(recommendationText(entry.condition))}</p>` : ''}${recommendationSourceMarkup(entry)}<button type="button" class="auto-party-edit" data-recommend-char="${esc(entry.members[0])}">캐릭터별 조합 보기</button></article>`).join('')}</div></details>` : ''}`;
  }
  const issue = automaticPartySaveIssue(plan);
  button.textContent = settings.scope === 'all' ? '일반 파티에 적용' : `${plan.teams.length}개 파티 한 번에 추가`;
  button.disabled = !!issue;
  const note = document.getElementById('auto-party-save-note');
  if (note) {
    const generalCount = state.parties.filter(party => !party.tag).length;
    note.textContent = issue?.message || (settings.scope === 'all'
      ? generalCount ? `기존 일반 파티 ${generalCount}개를 교체합니다. 콘텐츠 파티는 유지됩니다.` : '새 일반 파티로 저장합니다. 콘텐츠 파티는 유지됩니다.'
      : '기존 파티를 유지하고 새 일반 파티를 추가합니다.');
  }
}

function saveAutomaticParties() {
  const feedback = document.getElementById('auto-party-feedback');
  const report = (code, message) => {
    if (feedback) feedback.textContent = message;
    return { ok: false, code, message };
  };
  const settings = automaticPartySettings();
  if (automaticPartySettingsIssue(settings)) return report('invalid-settings', '편성 설정을 확인해 주세요.');
  if (!automaticPartyPreview || automaticPartyPreview.fingerprint !== automaticPartyFingerprint(settings)) {
    renderAutomaticParties();
    return report('stale-plan', '입력 정보가 바뀌어 추천을 갱신했습니다. 확인한 뒤 다시 적용해 주세요.');
  }
  const plan = calculateAutomaticPartyPlan(settings);
  if (!plan || JSON.stringify(plan.teams.map(entry => entry.id)) !== JSON.stringify(automaticPartyPreview.teams.map(entry => entry.id))) {
    renderAutomaticParties();
    return report('stale-plan', '추천 결과가 바뀌었습니다. 확인한 뒤 다시 적용해 주세요.');
  }
  const issue = automaticPartySaveIssue(plan);
  if (issue) { renderAutomaticParties(); return report(issue.code, issue.message); }
  const previous = state.parties;
  const replaceCount = settings.scope === 'all' ? previous.filter(party => !party.tag).length : 0;
  if (replaceCount && !confirm(`기존 일반 파티 ${replaceCount}개를 추천 ${plan.teams.length}개로 교체하시겠습니까?\n콘텐츠 파티와 보유·육성 기록은 유지됩니다.`)) {
    return report('cancelled', '파티 교체를 취소했습니다.');
  }
  if (plan.fingerprint !== automaticPartyFingerprint(settings)) {
    renderAutomaticParties();
    return report('stale-plan', '입력 정보가 바뀌었습니다. 갱신된 추천을 확인해 주세요.');
  }
  const retained = settings.scope === 'all' ? previous.filter(party => party.tag) : [...previous];
  const usedPartyIds = new Set(previous.map(party => party.id));
  const additions = [];
  for (const entry of plan.teams) {
    let id;
    for (let attempt = 0; attempt < 6; attempt++) {
      const candidate = uid();
      if (recommendationSafeId(candidate) && !usedPartyIds.has(candidate)) { id = candidate; break; }
    }
    if (!id) return report('id-conflict', '파티 ID를 만들지 못했습니다. 다시 시도해 주세요.');
    usedPartyIds.add(id);
    additions.push({ id, name: recommendationText(entry.label, 16) || '자동 편성', members: [...entry.members], tag: '' });
  }
  state.parties = [...retained, ...additions];
  try { save(); }
  catch {
    state.parties = previous;
    renderPlannerOverview();
    return report('save-failed', '저장하지 못했습니다. 기존 파티는 유지됩니다. 브라우저 저장 공간을 확인해 주세요.');
  }
  renderParties();
  renderContents();
  renderPlannerOverview();
  renderRecommendations();
  if (feedback) feedback.textContent = `${additions.length}개 파티를 저장했습니다.`;
  switchTab('planner', { scroll: false });
  const section = document.getElementById('party-section');
  section?.focus({ preventScroll: true });
  section?.scrollIntoView?.({ block: 'start', behavior: 'auto' });
  return { ok: true, parties: additions };
}

function renderRecommendations() {
  renderAutomaticParties();
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
  const library = document.getElementById('recommendation-library');
  if (charId && library) library.open = true;
  document.getElementById(charId || typeof optimizeOwnedParties !== 'function' ? 'recommendation-character' : 'auto-party-scope')?.focus();
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

document.getElementById('auto-party-scope')?.addEventListener('change', () => {
  const feedback = document.getElementById('auto-party-feedback');
  if (feedback) feedback.textContent = '';
  renderAutomaticParties();
});
document.getElementById('auto-party-limit')?.addEventListener('change', () => {
  const feedback = document.getElementById('auto-party-feedback');
  if (feedback) feedback.textContent = '';
  renderAutomaticParties();
});
document.getElementById('auto-party-save')?.addEventListener('click', saveAutomaticParties);
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
  if (event.target.closest('[data-auto-go-owned]')) { showRosterView('owned', { focus: true }); return; }
  const add = event.target.closest('[data-add-recommendation]');
  if (add) { addRecommendation(add.dataset.addRecommendation); return; }
  const character = event.target.closest('[data-recommend-char]');
  if (character) { openRecommendations(character.dataset.recommendChar); return; }
  if (event.target.closest('[data-open-recommendations]')) openRecommendations();
});

showRosterView(recommendationActiveView);
renderRecommendations();
