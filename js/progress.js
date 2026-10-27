/* Owned-character completion checklist. Load after app.js and recommendations.js. */
let characterProgressTargetId = '';
let characterProgressStructureKey = '';

function characterProgressFocusSnapshot(list) {
  const active = document.activeElement;
  if (!active || !list.contains?.(active)) return null;
  const cards = Array.from(list.querySelectorAll('[data-progress-card]'));
  const id = active.dataset?.progressCharacter || '';
  return { isProgressFocus: true, id, key: active.dataset?.progressField || '',
    index: Math.max(0, cards.findIndex(card => card.dataset.progressCard === id)) };
}

function restoreCharacterProgressFocus(list, snapshot) {
  if (!snapshot) return;
  const inputs = Array.from(list.querySelectorAll('input[data-progress-character][data-progress-field]'));
  let target = inputs.find(input => input.dataset.progressCharacter === snapshot.id && input.dataset.progressField === snapshot.key);
  if (!target && inputs.length) {
    const cards = Array.from(list.querySelectorAll('[data-progress-card]'));
    const nextId = cards[Math.min(snapshot.index, cards.length - 1)]?.dataset.progressCard;
    target = inputs.find(input => input.dataset.progressCharacter === nextId && input.dataset.progressField === snapshot.key)
      || inputs.find(input => input.dataset.progressCharacter === nextId) || inputs[0];
  }
  (target || document.getElementById('progress-filter') || document.getElementById('progress-search'))?.focus({ preventScroll: true });
}

function updateCharacterProgressBadges() {
  document.querySelectorAll('.char-progress-btn[data-progress-char]').forEach(button => {
    const id = button.dataset.progressChar;
    if (!charById(id)) return;
    const progress = getCharacterProgress(id);
    const count = CHARACTER_PROGRESS_FIELDS.filter(field => progress[field.key] === true).length;
    button.textContent = `육성 ${count}/${CHARACTER_PROGRESS_FIELDS.length}`;
  });
}

function renderCharacterProgress(focusHint) {
  const list = document.getElementById('progress-list');
  const summary = document.getElementById('progress-summary');
  if (!list || !summary) return;
  const snapshot = focusHint?.isProgressFocus === true ? focusHint : characterProgressFocusSnapshot(list);
  const fields = CHARACTER_PROGRESS_FIELDS;
  const query = document.getElementById('progress-search')?.value || '';
  const filterValue = document.getElementById('progress-filter')?.value || 'all';
  const filter = ['all', 'incomplete', 'complete'].includes(filterValue) ? filterValue : 'all';
  const owned = allChars().filter(character => isOwned(character.id)).map(character => {
    const progress = getCharacterProgress(character.id);
    const count = fields.filter(field => progress[field.key] === true).length;
    return { character, progress, count };
  });
  const visible = owned.filter(({ character, count }) =>
    (!characterProgressTargetId || character.id === characterProgressTargetId) &&
    characterMatchesSearch(character, query) &&
    (filter === 'all' || (filter === 'complete' ? count === fields.length : count < fields.length)));
  const completeCount = owned.filter(item => item.count === fields.length).length;
  summary.textContent = `보유 ${owned.length}명 · 모두 완료 ${completeCount}명 · 표시 ${visible.length}명`;
  const structureKey = JSON.stringify({ fields, characters: visible.map(({ character }) =>
    [character.id, character.name, character.img, character.element, character.rarity, character.role]) });
  const cards = Array.from(list.querySelectorAll('[data-progress-card]'));
  const inputs = Array.from(list.querySelectorAll('input[data-progress-character][data-progress-field]'));
  const canUpdate = visible.length > 0 && structureKey === characterProgressStructureKey &&
    cards.length === visible.length && inputs.length === visible.length * fields.length;
  let replaced = false;
  if (canUpdate) {
    const byId = new Map(visible.map(item => [item.character.id, item]));
    inputs.forEach(input => {
      const item = byId.get(input.dataset.progressCharacter);
      if (item) input.checked = item.progress[input.dataset.progressField] === true;
    });
    cards.forEach(card => {
      const item = byId.get(card.dataset.progressCard);
      if (!item) return;
      card.setAttribute('data-complete', String(item.count === fields.length));
      const count = card.querySelector('[data-progress-count]');
      if (count) count.textContent = `${item.count}/${fields.length} 완료`;
    });
  } else {
    const markup = visible.map(({ character, progress, count }, index) => `<article class="progress-card" data-progress-card="${esc(character.id)}" data-complete="${count === fields.length}" aria-labelledby="progress-character-${index}">
      <div class="progress-card-head">
        ${avatarHTML(character, { small: true })}
        <h3 id="progress-character-${index}">${esc(character.name)}</h3>
        <span class="progress-count" data-progress-count>${count}/${fields.length} 완료</span>
      </div>
      <fieldset class="progress-checks"><legend class="sr-only">${esc(character.name)} 육성 완료 항목</legend>
        ${fields.map(field => `<label class="progress-check"><input type="checkbox" data-progress-character="${esc(character.id)}" data-progress-field="${esc(field.key)}" aria-label="${esc(character.name)} · ${esc(field.label)}"${progress[field.key] === true ? ' checked' : ''}><span>${esc(field.label)}</span></label>`).join('')}
      </fieldset>
    </article>`).join('') || `<div class="progress-empty"><p>${!owned.length ? '보유한 캐릭터가 없습니다.'
      : characterProgressTargetId && !isOwned(characterProgressTargetId) ? '선택한 캐릭터를 먼저 보유로 등록해 주세요.'
      : '조건에 맞는 보유 캐릭터가 없습니다.'}</p><button type="button" class="icon-btn" data-progress-go-owned>보유 캐릭터 관리</button></div>`;
    if (list.innerHTML !== markup) {
      list.innerHTML = markup;
      replaced = true;
    }
  }
  characterProgressStructureKey = structureKey;
  updateCharacterProgressBadges();
  if (replaced) restoreCharacterProgressFocus(list, snapshot);
}

function openCharacterProgress(id) {
  const character = typeof id === 'string' ? charById(id) : null;
  characterProgressTargetId = character?.id || '';
  const search = document.getElementById('progress-search');
  const filter = document.getElementById('progress-filter');
  const feedback = document.getElementById('progress-feedback');
  if (search) search.value = character?.name || '';
  if (filter) filter.value = 'all';
  if (feedback) feedback.textContent = '';
  switchTab('roster', { focus: false });
  showRosterView('progress');
  renderCharacterProgress();
  const list = document.getElementById('progress-list');
  const first = character && isOwned(character.id)
    ? Array.from(list?.querySelectorAll('input[data-progress-character][data-progress-field]') || [])
      .find(input => input.dataset.progressCharacter === character.id)
    : null;
  (first || search)?.focus({ preventScroll: true });
}

document.getElementById('progress-list')?.addEventListener('change', event => {
  const input = event.target.closest?.('input[data-progress-character][data-progress-field]');
  if (!input) return;
  const list = document.getElementById('progress-list');
  const snapshot = characterProgressFocusSnapshot(list);
  const id = input.dataset.progressCharacter;
  const key = input.dataset.progressField;
  const field = CHARACTER_PROGRESS_FIELDS.find(item => item.key === key);
  const checked = input.checked === true;
  let result;
  try { result = setCharacterProgress(id, key, checked); }
  catch { result = { ok: false, message: '저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.' }; }
  // The state API owns persistence and rollback; always show its canonical value.
  input.checked = getCharacterProgress(id)[key] === true;
  renderCharacterProgress(snapshot);
  const feedback = document.getElementById('progress-feedback');
  if (feedback) {
    feedback.textContent = result?.ok
      ? `${charById(id)?.name || '캐릭터'} · ${field?.label || '육성 항목'} ${checked ? '저장했습니다.' : '해제했습니다.'}`
      : result?.message || '육성 상태를 저장하지 못했습니다.';
  }
});

document.getElementById('progress-search')?.addEventListener('input', () => {
  characterProgressTargetId = '';
  renderCharacterProgress();
});
document.getElementById('progress-filter')?.addEventListener('change', () => renderCharacterProgress());
document.addEventListener('click', event => {
  if (event.target.closest?.('[data-progress-go-owned]')) {
    switchTab('roster', { focus: false });
    showRosterView('owned', { focus: true });
    return;
  }
  const character = event.target.closest?.('[data-progress-char]');
  if (character) { openCharacterProgress(character.dataset.progressChar); return; }
  if (event.target.closest?.('[data-open-progress]')) openCharacterProgress();
});

renderCharacterProgress();
