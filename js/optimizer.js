/* Exact, local-only selection among the sourced party candidates in teams.js.
   The objective describes saved preparation, not simulated damage or a tier list.
   No DOM, storage, network, or mutation of the supplied state is used here. */
function optimizeOwnedParties(input = {}) {
  const options = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const own = (object, key) => !!object && typeof object === 'object' && !Array.isArray(object) &&
    Object.prototype.hasOwnProperty.call(object, key);
  const safeId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(value);
  const compareText = (left, right) => left < right ? -1 : left > right ? 1 : 0;
  const characterList = Array.isArray(options.characters) ? options.characters : [];
  const characterCounts = new Map();
  for (const character of characterList) {
    if (character && safeId(character.id)) characterCounts.set(character.id, (characterCounts.get(character.id) || 0) + 1);
  }
  const characters = new Map(characterList.filter(character => character && safeId(character.id) &&
    characterCounts.get(character.id) === 1).map(character => [character.id, character]));
  const ownedIds = [...characters.keys()].filter(id => own(options.owned, id) && options.owned[id] === true).sort(compareText);
  const owned = new Set(ownedIds);
  const excludedIds = [...new Set((Array.isArray(options.excludedIds) ? options.excludedIds : [])
    .filter(id => safeId(id) && owned.has(id)))].sort(compareText);
  const excluded = new Set(excludedIds);
  const availableIds = ownedIds.filter(id => !excluded.has(id));
  const available = new Set(availableIds);
  const progress = new Map(ownedIds.map(id => {
    const raw = own(options.progress, id) && options.progress[id] && typeof options.progress[id] === 'object' &&
      !Array.isArray(options.progress[id]) ? options.progress[id] : {};
    const sequence = own(raw, 'sequence') && Number.isInteger(raw.sequence) && raw.sequence >= 0 && raw.sequence <= 6
      ? raw.sequence : null;
    const signatureWeapon = own(raw, 'signatureWeapon') && typeof raw.signatureWeapon === 'boolean' ? raw.signatureWeapon : null;
    const readiness = ['level90', 'skills', 'echo', 'weapon'].filter(key => own(raw, key) && raw[key] === true).length;
    return [id, { readiness, sequence, signatureWeapon }];
  }));
  const recommendations = Array.isArray(options.recommendations) ? options.recommendations : [];
  const counts = new Map();
  for (const entry of recommendations) {
    if (entry && safeId(entry.id)) counts.set(entry.id, (counts.get(entry.id) || 0) + 1);
  }
  const copyEntry = entry => ({ ...entry, members: [...entry.members],
    ...(Array.isArray(entry.sources) ? { sources: entry.sources.map(source => source && typeof source === 'object' ? { ...source } : source) } : {}),
    ...(Array.isArray(entry.requirements) ? { requirements: entry.requirements.map(requirement => ({ ...requirement })) } : {}) });
  const candidates = [], blockedTeams = [], invalidIds = [];
  for (const entry of recommendations) {
    const id = entry?.id;
    let valid = !!entry && !Array.isArray(entry) && safeId(id) && counts.get(id) === 1 &&
      Array.isArray(entry.members) && entry.members.length === 3 && new Set(entry.members).size === 3 &&
      entry.members.every(member => safeId(member) && characters.has(member)) &&
      (!entry.members.includes('rover') || typeof entry.condition === 'string' && /방랑자.*(?:회절|인멸|기류|전도)/.test(entry.condition));
    const requirements = own(entry, 'requirements') ? entry.requirements : [];
    if (!Array.isArray(requirements)) valid = false;
    if (valid) {
      const seen = new Set();
      for (const requirement of requirements) {
        if (!requirement || typeof requirement !== 'object' || Array.isArray(requirement) ||
          !own(requirement, 'characterId') || !safeId(requirement.characterId) || !entry.members.includes(requirement.characterId) || seen.has(requirement.characterId) ||
          Object.keys(requirement).some(key => !['characterId', 'minSequence', 'signatureWeapon'].includes(key)) ||
          (!own(requirement, 'minSequence') && !own(requirement, 'signatureWeapon')) ||
          (own(requirement, 'minSequence') && (!Number.isInteger(requirement.minSequence) || requirement.minSequence < 0 || requirement.minSequence > 6)) ||
          (own(requirement, 'signatureWeapon') && requirement.signatureWeapon !== true)) {
          valid = false;
          break;
        }
        seen.add(requirement.characterId);
      }
    }
    if (!valid) { if (typeof id === 'string') invalidIds.push(id); continue; }
    if (!entry.members.every(member => available.has(member))) continue;
    const reasons = [];
    for (const requirement of requirements) {
      const member = progress.get(requirement.characterId);
      const name = characters.get(requirement.characterId).name || requirement.characterId;
      if (own(requirement, 'minSequence') && (member.sequence === null || member.sequence < requirement.minSequence)) {
        reasons.push(`${name}: ${requirement.minSequence}돌 이상 필요 (현재 ${member.sequence === null ? '미입력' : member.sequence === 0 ? '명함' : `${member.sequence}돌`})`);
      }
      if (own(requirement, 'signatureWeapon') && member.signatureWeapon !== requirement.signatureWeapon) {
        reasons.push(`${name}: 전용무기 ${requirement.signatureWeapon ? '보유' : '미보유'} 조건 (현재 ${member.signatureWeapon === null ? '미입력' : member.signatureWeapon ? '보유' : '미보유'})`);
      }
    }
    if (reasons.length) { blockedTeams.push({ entry: copyEntry(entry), reasons }); continue; }
    candidates.push({ entry: copyEntry(entry), readiness: entry.members.reduce((sum, member) => sum + progress.get(member).readiness, 0),
      sequence: entry.members.reduce((sum, member) => sum + (progress.get(member).sequence ?? 0), 0),
      signature: entry.members.filter(member => progress.get(member).signatureWeapon === true).length });
  }
  candidates.sort((left, right) => compareText(left.entry.id, right.entry.id));
  blockedTeams.sort((left, right) => compareText(left.entry.id, right.entry.id));
  const maxPossible = Math.floor(availableIds.length / 3);
  const maxTeams = options.maxTeams === null || options.maxTeams === undefined ? maxPossible
    : Number.isInteger(options.maxTeams) && options.maxTeams >= 0 ? Math.min(options.maxTeams, maxPossible) : 0;

  // A mixed-radix integer preserves the entire lexicographic objective exactly.
  // The final bit field prefers the lexicographically smallest sorted ID list.
  // Upper bounds therefore prune equal-score ties too, without losing exactness.
  const tieBase = 1n << BigInt(candidates.length);
  const readinessBase = BigInt(availableIds.length * 4 + 1);
  const sequenceBase = BigInt(availableIds.length * 6 + 1);
  const signatureBase = BigInt(availableIds.length + 1);
  candidates.forEach((candidate, index) => {
    candidate.weight = (((readinessBase + BigInt(candidate.readiness)) * sequenceBase + BigInt(candidate.sequence)) *
      signatureBase + BigInt(candidate.signature)) * tieBase + (1n << BigInt(candidates.length - index - 1));
  });
  // Heavy vertices first improves the initial bound; the tie bit keeps the result
  // deterministic regardless of input order or search order.
  const vertices = [...candidates].sort((left, right) => left.weight > right.weight ? -1 : left.weight < right.weight ? 1 : 0);
  const bits = vertices.map((_, index) => 1n << BigInt(index));
  const bitIndex = new Map(bits.map((bit, index) => [bit, index]));
  const neighbors = vertices.map((vertex, index) => vertices.reduce((mask, other, otherIndex) =>
    index !== otherIndex && !vertex.entry.members.some(member => other.entry.members.includes(member)) ? mask | bits[otherIndex] : mask, 0n));
  let bestWeight = 0n, best = [], visitedNodes = 0;
  const memo = new Map();

  // A color class contains pairwise conflicting teams, so at most one of its
  // weights can enter any completion. Summing the largest class maxima gives a
  // valid weighted upper bound, including when the user caps the party count.
  function colorBound(mask, slots) {
    const order = [], bounds = [], previousMaxima = [];
    const colors = [];
    let remaining = mask;
    while (remaining) {
      // Grouping by the most contested character yields tighter bounds than
      // arbitrary graph coloring when many damage dealers share a few supports.
      const incidence = new Map();
      let scan = remaining;
      while (scan) {
        const bit = scan & -scan;
        const index = bitIndex.get(bit);
        for (const member of vertices[index].entry.members) {
          if (!incidence.has(member)) incidence.set(member, []);
          incidence.get(member).push(index);
        }
        scan &= ~bit;
      }
      let color = [];
      for (const indices of incidence.values()) if (indices.length > color.length) color = indices;
      for (const index of color) remaining &= ~bits[index];
      color.sort((left, right) => vertices[left].weight < vertices[right].weight ? -1 : vertices[left].weight > vertices[right].weight ? 1 : 0);
      colors.push(color);
    }
    colors.sort((left, right) => vertices[left[left.length - 1]].weight < vertices[right[right.length - 1]].weight ? -1 : 1);
    for (const color of colors) {
      for (const index of color) {
        const maxima = [...previousMaxima, vertices[index].weight]
          .sort((left, right) => left > right ? -1 : left < right ? 1 : 0);
        order.push(index);
        bounds.push(maxima.slice(0, slots).reduce((sum, weight) => sum + weight, 0n));
      }
      previousMaxima.push(vertices[color[color.length - 1]].weight);
    }
    return { order, bounds };
  }
  function search(mask, selected, weight) {
    visitedNodes++;
    if (weight > bestWeight) { bestWeight = weight; best = [...selected]; }
    const slots = maxTeams - selected.length;
    if (!mask || !slots) return;
    const memoKey = `${slots}:${mask}`;
    const previous = memo.get(memoKey);
    if (previous !== undefined && previous >= weight) return;
    // A memory limit only disables caching; the exact search still continues.
    if (memo.size < 100000) memo.set(memoKey, weight);
    const { order, bounds } = colorBound(mask, slots);
    for (let offset = order.length - 1; offset >= 0; offset--) {
      if (weight + bounds[offset] <= bestWeight) return;
      const index = order[offset];
      search(mask & neighbors[index], [...selected, index], weight + vertices[index].weight);
      mask &= ~bits[index];
    }
  }
  if (vertices.length && maxTeams) search((1n << BigInt(vertices.length)) - 1n, [], 0n);
  const chosen = best.map(index => vertices[index]).sort((left, right) => compareText(left.entry.id, right.entry.id));
  const usedIds = chosen.flatMap(candidate => candidate.entry.members).sort(compareText);
  const used = new Set(usedIds);
  const objective = { teamCount: chosen.length,
    readiness: chosen.reduce((sum, candidate) => sum + candidate.readiness, 0),
    sequence: chosen.reduce((sum, candidate) => sum + candidate.sequence, 0),
    signature: chosen.reduce((sum, candidate) => sum + candidate.signature, 0) };
  return {
    teams: chosen.map(candidate => copyEntry(candidate.entry)),
    eligibleTeams: candidates.map(candidate => copyEntry(candidate.entry)),
    eligibleCount: candidates.length, ownedCount: ownedIds.length, availableCount: availableIds.length,
    usedIds, remainingIds: availableIds.filter(id => !used.has(id)), excludedIds, blockedTeams,
    invalidIds: [...new Set(invalidIds)].sort(compareText), objective, maxTeams,
    inputSummary: {
      sequenceKnown: usedIds.filter(id => progress.get(id).sequence !== null).length,
      sequenceUnknown: usedIds.filter(id => progress.get(id).sequence === null).length,
      signatureKnown: usedIds.filter(id => progress.get(id).signatureWeapon !== null).length,
      signatureUnknown: usedIds.filter(id => progress.get(id).signatureWeapon === null).length,
    },
    search: { exact: true, visitedNodes },
  };
}
