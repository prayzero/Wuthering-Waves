# 보유 캐릭터 자동 편성 후보 보강

확인일: 2026-10-30 (Asia/Seoul)

기존 대표 조합 38개에 대체 조합 60개를 더해 총 98개를 사용합니다. 아래 자료는 모두 **커뮤니티 분석**이며 공식 추천이 아닙니다. 기존 자료 전체의 재검증이나 전체 캐릭터 성능 순위 갱신은 아닙니다.

새 후보는 각 공략의 `Synergies`에 명시된 주력·보조 캐릭터와 지원 슬롯 선택지를 조합했습니다. 따라서 3인 조합의 편성 후보화는 해당 설명에 근거한 편집 판단이며, 원문이 98개 전체를 하나의 순위로 비교했다는 뜻이 아닙니다. 전투 피해량·적 저항·이번 주기 버프를 계산하지 않습니다. 입력한 육성·돌파·전무는 같은 편성 수에서 사용자의 투자 현황을 우선하는 기준이며, 캐릭터별 실제 피해 증가량을 의미하지 않습니다.

| 확인한 원문 | 이번 반영 범위 |
| --- | --- |
| [Prydwen · 기염](https://www.prydwen.gg/wuthering-waves/characters/jiyan) | 모르테피·유노·레베카와 일반 지원, 샤콘 교대 운용, 린네·모니에 대안 |
| [Prydwen · 앙코](https://www.prydwen.gg/wuthering-waves/characters/encore) | 산화·브렌트와 일반 지원, 루파·모니에, 브렌트·루파 반주 순서 |
| [Prydwen · 카카루](https://www.prydwen.gg/wuthering-waves/characters/calcharo) | 음림과 일반 지원, 린네·모니에 대안 |
| [Prydwen · 능양](https://www.prydwen.gg/wuthering-waves/characters/lingyang) | 산화·절지와 일반 지원, 린네·모니에 대안 |
| [Prydwen · 카멜리아](https://www.prydwen.gg/wuthering-waves/characters/camellya) | 산화·단근·로코코와 일반 지원, 린네·모니에 대안 |
| [Prydwen · 금희](https://www.prydwen.gg/wuthering-waves/characters/jinhsi) | 절지·연무·음림과 벨리나·파수인 선택지 |
| [Prydwen · 인멸 방랑자](https://www.prydwen.gg/wuthering-waves/characters/rover-havoc) | 단근·산화·로코코와 일반 지원, 인멸 속성 조건 |
| [Prydwen · 상리요](https://www.prydwen.gg/wuthering-waves/characters/xiangli-yao) | 음림·감심과 일반 지원, 린네·모니에 대안 |
| [Prydwen · 카를로타](https://www.prydwen.gg/wuthering-waves/characters/carlotta) | 절지·양양·도기와 지원 선택지, 린네·모니에, 복링 대안 |
| [Prydwen · 자니](https://www.prydwen.gg/wuthering-waves/characters/zani) | 지원 모드 페비와 벨리나, 회절 방랑자로 페비를 대체할 때의 한계 |
| [Prydwen · 카르티시아](https://www.prydwen.gg/wuthering-waves/characters/cartethyia) | 샤콘·파수인의 다수 웨이브 대안, 산화·기류 방랑자, 치사 전무 조건 정정 |
| [Prydwen · 설지](https://www.prydwen.gg/wuthering-waves/characters/baizhi) | 산화·단근 조합의 회복 대안과 주력에게 버프를 주는 운용 |
| [Prydwen · 회절 방랑자](https://www.prydwen.gg/wuthering-waves/characters/rover-spectro) | 자니·페비 편성의 4돌 회복 조건, 6돌 추가 내성 감소 |
| [Prydwen · 음림](https://www.prydwen.gg/wuthering-waves/characters/yinlin) | 반주 버프의 최대 14초·지원받은 캐릭터 교대 시 종료 조건 |

설지 공략은 협동 공격 보조 캐릭터에게 버프를 함께 주기 어렵다고 설명합니다. 이에 모르테피·음림·절지를 넣은 설지 대안은 이번 후보 보강에서 제외했습니다. 산화·단근 대안도 벨리나·파수인과 동일한 성능으로 취급한다는 뜻은 아닙니다.

자니·페비·회절 방랑자 후보는 방랑자가 회복을 맡는 구성입니다. `requirements: [{ characterId: 'rover', minSequence: 4 }]`로 회복 능력의 실제 개방 조건을 기록합니다. 6돌의 내성 감소는 추가 효과로 설명합니다. 방랑자 속성은 사용자가 해당 파티의 표시 조건에 맞춰야 하며, 저장된 방랑자 돌파 수도 그 속성에 맞는 값이어야 합니다.

치사 전무는 카르티시아 파티에서 기류 방랑자보다 높은 버프를 주기 위한 조건이며, 편성 자체의 필수 요건은 아닙니다. 기존 문구를 그 의미로 명확하게 고쳤고 전무 보유를 강제하지 않습니다.

기존 38개 중 이번에 문구·조건을 재확인한 두 항목만 확인일을 갱신했습니다. 다른 기존 항목의 확인일과 출처는 유지했습니다. 새 항목마다 원문 링크와 `community` 구분을 저장하며, 설지 대안에는 설지의 제약 설명 원문도 함께 연결합니다.

기존 후보별 근거는 [2026-10-23 추천 자료](party-sources-2026-10-23.md)에 기록되어 있습니다.
