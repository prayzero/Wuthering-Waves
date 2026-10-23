/* 2026-10-23 · 공략 기반 대표 조합. 공식 추천/순위가 아닙니다.
   출처와 조건: 각 항목 및 docs/party-sources-2026-10-23.md */
const PARTY_RECOMMENDATIONS = [
  {
    "id": "aemeath-tune-rupture",
    "members": [
      "aemeath",
      "lynae",
      "mornye"
    ],
    "label": "에이메스 조화 계열",
    "reason": "린네의 조화 계열 지원과 모니에의 피해 증폭이 에이메스의 공명 해방 중심 공격을 보조합니다.",
    "condition": "에이메스: Tune Rupture 모드",
    "sources": [
      {
        "label": "Prydwen · 에이메스 조합·시너지",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/aemeath",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "aemeath-fusion-burst",
    "members": [
      "aemeath",
      "denia",
      "chisa"
    ],
    "label": "에이메스 용융 상태 이상",
    "reason": "데니아의 용융 상태 이상 부여·몹몰이와 치사의 상태 이상 지원으로 에이메스의 범위 피해를 강화합니다.",
    "condition": "에이메스: Fusion Burst 모드",
    "sources": [
      {
        "label": "Prydwen · 에이메스 조합·시너지",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/aemeath",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "luukherssen-tune-strain",
    "members": [
      "luukherssen",
      "denia",
      "mornye"
    ],
    "label": "루크 조화 밀집",
    "reason": "데니아의 조화 밀집 부여와 몹몰이, 모니에의 조화 응답 지원이 루크의 일반 공격 중심 피해를 보조합니다.",
    "sources": [
      {
        "label": "Prydwen · 루크 조합·시너지",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/luuk-herssen",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "sigrika-echo",
    "members": [
      "sigrika",
      "qiuyuan",
      "shorekeeper"
    ],
    "label": "시그리카 에코 스킬",
    "reason": "구원의 반복 에코 스킬과 피해 지원이 시그리카의 에코 기반 공격을 강화하고 파수인이 회복과 크리티컬 지원을 제공합니다.",
    "sources": [
      {
        "label": "Prydwen · 시그리카 조합·시너지",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/sigrika",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "hiyuki-glacio-chafe",
    "members": [
      "hiyuki",
      "lucilla",
      "suisui"
    ],
    "label": "히유키 응결 상태 이상",
    "reason": "루실라와 수수의 응결 상태 이상 부여·지원이 히유키의 추가 피해 조건과 맞물립니다.",
    "sources": [
      {
        "label": "Prydwen · 히유키 조합·시너지",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/hiyuki",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "lucy-hack",
    "members": [
      "lucy",
      "rebecca",
      "mornye"
    ],
    "label": "루시 해킹",
    "reason": "레베카의 루시 전용 시너지와 모니에의 조화도 누적 지원을 결합해 해킹 피해를 보조합니다.",
    "condition": "레베카 반주 → 루시",
    "sources": [
      {
        "label": "Prydwen · 루시 조합·시너지",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/lucy",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "lucy-hack-multiwave",
    "members": [
      "lucy",
      "rebecca",
      "shorekeeper"
    ],
    "label": "루시 해역 대안",
    "reason": "레베카의 전용 시너지를 유지하면서 파수인의 회복과 크리티컬 지원을 받습니다.",
    "condition": "해역처럼 적이 자주 교체되는 전투의 대안",
    "sources": [
      {
        "label": "Prydwen · 루시 해역 조합 대안",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/lucy",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "xuanling-havoc-bane",
    "members": [
      "xuanling",
      "chisa",
      "suisui"
    ],
    "label": "현령 인멸 상태 이상",
    "reason": "치사의 인멸 상태 이상 중첩 지원과 수수의 버프가 현령의 상태 이상 소비 공격을 보조합니다.",
    "condition": "치사 반주 → 현령",
    "sources": [
      {
        "label": "Prydwen · 현령 조합·시너지",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/yangyang-xuanling",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "qingxiao-tune-strain",
    "members": [
      "qingxiao",
      "denia",
      "mornye"
    ],
    "label": "청초 조화 밀집",
    "reason": "데니아와 모니에의 조화 밀집 부여·응답 지원이 청초의 공격 조건을 함께 충족합니다.",
    "condition": "데니아를 쓸 때 모니에 동시 편성",
    "sources": [
      {
        "label": "Prydwen · 청초 조합·시너지",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/qingxiao",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "jingran-shield-heavy",
    "members": [
      "jingran",
      "iuno",
      "shorekeeper"
    ],
    "label": "경연 실드·강공격",
    "reason": "유노의 실드와 강공격 지원을 경연이 활용하고 파수인이 회복과 크리티컬 지원을 제공합니다.",
    "condition": "유노 실드 후 경연의 강공격으로 연결",
    "sources": [
      {
        "label": "Prydwen · 경연 조합·시너지",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/jingran",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "hsin-suoming-unison",
    "members": [
      "hsin",
      "suoming",
      "shorekeeper"
    ],
    "label": "여우·쇄명 Unison",
    "reason": "쇄명의 전도·Unison 지원이 여우의 별자리와 맞물리고 파수인이 회복과 크리티컬 지원을 제공합니다.",
    "condition": "여우의 별자리: 합일(Unison) 모드",
    "sources": [
      {
        "label": "Prydwen · 쇄명 출시 후 Unison 조합",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/suoming",
        "kind": "community"
      },
      {
        "label": "Prydwen · 여우의 별자리 조합·시너지",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/hsin",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "hsin-electro-flare",
    "members": [
      "hsin",
      "rover",
      "suisui"
    ],
    "label": "여우 전도 상태 이상",
    "reason": "전도 방랑자의 상태 이상 부여와 수수의 지원으로 여우의 별자리의 Electro Flare 운용을 보조합니다.",
    "condition": "방랑자: 전도 속성 / 여우의 별자리: Electro Flare 모드",
    "sources": [
      {
        "label": "Prydwen · 여우의 별자리 Electro Flare 조합",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/hsin",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "suoming-main-dps",
    "members": [
      "suoming",
      "lynae",
      "mornye"
    ],
    "label": "쇄명 메인 딜러",
    "reason": "린네와 모니에의 범용 피해 지원을 결합해 쇄명이 직접 공격하는 시간을 강화합니다.",
    "condition": "쇄명을 메인 딜러로 쓰는 대안",
    "sources": [
      {
        "label": "Prydwen · 쇄명 메인 딜러 조합",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/suoming",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "jiyan-mortefi-verina",
    "members": [
      "jiyan",
      "mortefi",
      "verina"
    ],
    "label": "기염 · 강공격 지원",
    "reason": "모르테피의 강공격 피해 지원과 협동 공격을 기염에게 연결하고 벨리나가 치유와 파티 버프를 담당합니다.",
    "sources": [
      {
        "label": "Prydwen · 기염 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/jiyan",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "xiangliyao-yinlin-shorekeeper",
    "members": [
      "xiangliyao",
      "yinlin",
      "shorekeeper"
    ],
    "label": "상리요 · 전도·해방 지원",
    "reason": "음림이 전도·공명 해방 피해를 높이고 협동 공격을 보태며 파수인이 치유와 치명타 버프를 제공합니다.",
    "sources": [
      {
        "label": "Prydwen · 상리요 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/xiangli-yao",
        "kind": "community"
      },
      {
        "label": "Prydwen · 음림 반주 조건",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/yinlin",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23",
    "condition": "음림 반주 → 상리요. 버프는 최대 14초이며 상리요 교대 시 종료됩니다."
  },
  {
    "id": "jinhsi-zhezhi-verina",
    "members": [
      "jinhsi",
      "zhezhi",
      "verina"
    ],
    "label": "금희 · 협동 공격 지원",
    "reason": "절지의 협동 공격과 공명 스킬 피해 지원으로 금희의 회로 운용을 돕고 벨리나가 협동 공격과 치유를 보탭니다.",
    "sources": [
      {
        "label": "Prydwen · 금희 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/jinhsi",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "changli-brant-lupa",
    "members": [
      "changli",
      "brant",
      "lupa"
    ],
    "label": "장리·브렌트 · 용융 3인",
    "reason": "루파의 용융 파티 버프를 활용하면서 브렌트가 장리의 용융·공명 스킬 피해를 지원하고 치유를 담당합니다.",
    "condition": "용융 3인 편성을 유지하며 루파의 일반 공격 지원은 브렌트에게, 브렌트의 반주는 장리에게 연결합니다.",
    "sources": [
      {
        "label": "Prydwen · 장리 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/changli",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "camellya-roccia-shorekeeper",
    "members": [
      "camellya",
      "roccia",
      "shorekeeper"
    ],
    "label": "카멜리아 · 일반 공격 지원",
    "reason": "로코코의 인멸·일반 공격 피해 지원을 카멜리아에게 적용하고 파수인이 치유와 치명타 버프를 제공합니다.",
    "sources": [
      {
        "label": "Prydwen · 카멜리아 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/camellya",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "carlotta-zhezhi-shorekeeper",
    "members": [
      "carlotta",
      "zhezhi",
      "shorekeeper"
    ],
    "label": "카를로타 · 응결 스킬 지원",
    "reason": "절지의 응결·공명 스킬 피해 지원과 에너지 보충을 활용하고 파수인이 카를로타의 생존과 치명타를 보조합니다.",
    "sources": [
      {
        "label": "Prydwen · 카를로타 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/carlotta",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "zani-phoebe-shorekeeper",
    "members": [
      "zani",
      "phoebe",
      "shorekeeper"
    ],
    "label": "젠니 · 회절 이상 효과",
    "reason": "페비가 회절 이상 효과를 공급해 젠니의 강화 공격 자원을 채우고 파수인이 치유와 파티 버프를 제공합니다.",
    "condition": "페비는 지원 모드(Confession)로 운용합니다.",
    "sources": [
      {
        "label": "Prydwen · 젠니 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/zani",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "cartethyia-ciaccona-rover-aero",
    "members": [
      "cartethyia",
      "ciaccona",
      "rover"
    ],
    "label": "카르티시아 · 기류 방랑자",
    "reason": "샤콘의 지속적인 기류 이상 효과 공급과 기류 방랑자의 최대 중첩 증가를 카르티시아가 활용합니다.",
    "condition": "방랑자는 기류 속성이어야 합니다.",
    "sources": [
      {
        "label": "Prydwen · 카르티시아 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/cartethyia",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "cartethyia-ciaccona-chisa",
    "members": [
      "cartethyia",
      "ciaccona",
      "chisa"
    ],
    "label": "카르티시아 · 치사 지원",
    "reason": "샤콘이 기류 이상 효과를 공급하고 치사가 최대 중첩을 늘려 카르티시아의 공격을 지원합니다.",
    "condition": "치사 전용무기 보유 시 추가 버프를 활용하는 편성입니다.",
    "sources": [
      {
        "label": "Prydwen · 카르티시아 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/cartethyia",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "phrolova-cantarella-qiuyuan",
    "members": [
      "phrolova",
      "cantarella",
      "qiuyuan"
    ],
    "label": "플로로 · 에코 피해 지원",
    "reason": "칸타렐라의 에코 발동과 반주 지원에 구원의 파티 에코 피해 버프를 더해 플로로의 피해를 보조합니다.",
    "sources": [
      {
        "label": "Prydwen · 플로로 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/phrolova",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "augusta-iuno-shorekeeper",
    "members": [
      "augusta",
      "iuno",
      "shorekeeper"
    ],
    "label": "아우구스타 · 유노 지원",
    "reason": "유노가 아우구스타의 강공격 중심 피해를 지원하며 파수인이 치유와 치명타 버프를 보탭니다.",
    "sources": [
      {
        "label": "Prydwen · 아우구스타 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/augusta",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "galbrena-qiuyuan-shorekeeper",
    "members": [
      "galbrena",
      "qiuyuan",
      "shorekeeper"
    ],
    "label": "갈브레나 · 에코 운용",
    "reason": "구원의 여러 에코 발동과 에코 피해 지원으로 갈브레나의 자원과 피해를 돕고 파수인이 치유와 버프를 제공합니다.",
    "sources": [
      {
        "label": "Prydwen · 갈브레나 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/galbrena",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "calcharo-yinlin-youhu",
    "members": [
      "calcharo",
      "yinlin",
      "youhu"
    ],
    "label": "카카루 · 협동 공격 보강",
    "reason": "유호가 음림의 협동 공격을 강화하고 음림이 카카루의 전도·공명 해방 피해를 지원합니다.",
    "condition": "유호 → 음림 → 카카루로 반주 전달. 음림 버프는 최대 14초이며 카카루 교대 시 종료됩니다.",
    "sources": [
      {
        "label": "Prydwen · 유호 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/youhu",
        "kind": "community"
      },
      {
        "label": "Prydwen · 카카루 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/calcharo",
        "kind": "community"
      },
      {
        "label": "Prydwen · 음림 반주 조건",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/yinlin",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "lingyang-sanhua-verina",
    "members": [
      "lingyang",
      "sanhua",
      "verina"
    ],
    "label": "능양 · 일반 공격 지원",
    "reason": "산화의 짧은 출전과 일반 공격 피해 지원으로 능양의 공격 시간을 확보하고 벨리나가 치유와 버프를 제공합니다.",
    "sources": [
      {
        "label": "Prydwen · 능양 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/lingyang",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "encore-sanhua-verina",
    "members": [
      "encore",
      "sanhua",
      "verina"
    ],
    "label": "앙코 · 일반 공격 지원",
    "reason": "산화가 앙코의 일반 공격 피해를 지원하며 벨리나의 짧은 지원 운용으로 앙코의 출전 시간을 확보합니다.",
    "sources": [
      {
        "label": "Prydwen · 앙코 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/encore",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "xiangliyao-jianxin-verina",
    "members": [
      "xiangliyao",
      "jianxin",
      "verina"
    ],
    "label": "상리요 · 감심 대체 지원",
    "reason": "감심의 공명 해방 피해 지원을 상리요에게 전달하고 벨리나가 치유와 파티 버프를 제공합니다.",
    "condition": "음림 등 전용 지원을 쓰기 어려울 때의 대체안으로, 감심의 긴 출전과 상리요의 에너지 충전을 고려해야 합니다.",
    "sources": [
      {
        "label": "Prydwen · 감심 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/jianxin",
        "kind": "community"
      },
      {
        "label": "Prydwen · 상리요 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/xiangli-yao",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "carlotta-yangyang-verina",
    "members": [
      "carlotta",
      "yangyang",
      "verina"
    ],
    "label": "카를로타 · 양양 에너지 지원",
    "reason": "양양의 짧은 출전과 반주 에너지 회복으로 카를로타의 순환을 돕고 벨리나가 치유와 버프를 제공합니다.",
    "sources": [
      {
        "label": "Prydwen · 양양 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/yangyang",
        "kind": "community"
      },
      {
        "label": "Prydwen · 카를로타 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/carlotta",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "carlotta-taoqi-verina",
    "members": [
      "carlotta",
      "taoqi",
      "verina"
    ],
    "label": "카를로타 · 도기 대체 지원",
    "reason": "도기의 공명 스킬 피해 지원으로 카를로타의 집중 피해를 높이고 벨리나가 치유와 파티 버프를 제공합니다.",
    "condition": "도기의 협주 충전에 시간이 걸리므로 빠른 순환보다 집중 피해를 노리는 대체 조합입니다.",
    "sources": [
      {
        "label": "Prydwen · 도기 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/taoqi",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "chixia-brant-lupa",
    "members": [
      "chixia",
      "brant",
      "lupa"
    ],
    "label": "치샤·브렌트 · 용융 3인",
    "reason": "루파의 용융 파티 버프와 브렌트의 용융·공명 스킬 피해 지원을 치샤에게 연결합니다.",
    "condition": "용융 3인 편성을 유지하고 루파의 반주는 브렌트에게, 브렌트의 반주는 치샤에게 연결합니다.",
    "sources": [
      {
        "label": "Prydwen · 치샤 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/chixia",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "jinhsi-yuanwu-verina",
    "members": [
      "jinhsi",
      "yuanwu",
      "verina"
    ],
    "label": "금희 · 연무 협동 공격",
    "reason": "연무의 잦은 협동 공격으로 금희의 회로 자원을 채우고 벨리나가 치유와 파티 버프를 담당합니다.",
    "condition": "연무의 공격 범위를 유지하며 짧게 출전시키는 대체 조합입니다.",
    "sources": [
      {
        "label": "Prydwen · 연무 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/yuanwu",
        "kind": "community"
      },
      {
        "label": "Prydwen · 금희 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/jinhsi",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "jinhsi-lumi-verina",
    "members": [
      "jinhsi",
      "lumi",
      "verina"
    ],
    "label": "금희 · 루미 스킬 지원",
    "reason": "루미의 공명 스킬 피해 지원을 금희에게 적용하고 벨리나의 협동 공격으로 금희의 자원 수급을 보완합니다.",
    "condition": "루미의 짧은 반주 지속시간 안에 금희의 핵심 스킬을 사용하며 협동 공격을 담당하는 벨리나를 유지합니다.",
    "sources": [
      {
        "label": "Prydwen · 루미 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/lumi",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "carlotta-zhezhi-buling",
    "members": [
      "carlotta",
      "zhezhi",
      "buling"
    ],
    "label": "카를로타 · 복링 지원",
    "reason": "절지의 응결·공명 스킬 지원에 복링의 공명 스킬 피해 버프를 더해 카를로타를 보조합니다.",
    "condition": "복링 6돌에서는 공명 스킬 피해 지원이 추가로 강화되며, 파수인·벨리나를 다른 파티에 쓰는 경우의 대체안입니다.",
    "sources": [
      {
        "label": "Prydwen · 복링 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/buling",
        "kind": "community"
      },
      {
        "label": "Prydwen · 카를로타 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/carlotta",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "rover-havoc-danjin-baizhi",
    "members": [
      "rover",
      "danjin",
      "baizhi"
    ],
    "label": "인멸 방랑자 · 단근 지원",
    "reason": "단근의 인멸 피해 지원을 방랑자에게 연결하고 설지가 치유와 단일 대상 피해 지원을 제공합니다.",
    "condition": "방랑자는 인멸 속성이어야 하며 단근은 짧은 반주 지원 위주로 운용합니다.",
    "sources": [
      {
        "label": "Prydwen · 인멸 방랑자 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/rover-havoc",
        "kind": "community"
      },
      {
        "label": "Prydwen · 설지 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/baizhi",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "zani-phoebe-rover-spectro",
    "members": [
      "zani",
      "phoebe",
      "rover"
    ],
    "label": "젠니 · 회절 방랑자 교대",
    "reason": "페비와 회절 방랑자가 이상 효과를 계속 공급해 젠니의 강화 공격 자원을 보충합니다.",
    "condition": "방랑자는 회절 속성으로 4돌 치유·6돌 내성 감소를 활용하며, 페비는 지원 모드(Confession)와 빠른 교대 운용을 사용합니다.",
    "sources": [
      {
        "label": "Prydwen · 회절 방랑자 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/rover-spectro",
        "kind": "community"
      },
      {
        "label": "Prydwen · 젠니 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/zani",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  },
  {
    "id": "aalto-ciaccona-rover-aero",
    "members": [
      "aalto",
      "ciaccona",
      "rover"
    ],
    "label": "알토 · 기류 딜러 운용",
    "reason": "샤콘의 기류 피해 지원과 기류 방랑자의 이상 효과 중첩 증가를 활용해 알토를 주력 딜러로 운용합니다.",
    "condition": "방랑자는 기류 속성이어야 하며 알토를 주력 딜러로 사용하는 대체 편성입니다.",
    "sources": [
      {
        "label": "Prydwen · 알토 공략",
        "url": "https://www.prydwen.gg/wuthering-waves/characters/aalto",
        "kind": "community"
      }
    ],
    "verifiedAt": "2026-10-23"
  }
];
