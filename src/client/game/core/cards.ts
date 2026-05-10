import type { CardDefinition } from "../../../shared/gameTypes";

const promptBase = "2D semi-real deformed dark comedic Japanese management tower defense card art, sharp readable silhouette";

export const CARD_DEFINITIONS: CardDefinition[] = [
  card("tax-master", "節税の達人", "R", "税務リスク -10%。帳簿は白いが目は泳ぐ。", "risk", { taxRiskDelta: -10 }, "合法の範囲が今日だけ広い。"),
  card("illegal-wall-knowhow", "違法建築ノウハウ", "R", "壁コスト -20%、幸福度 -5。", "defense", { buildingCostMultiplier: { Wall: 0.8 }, happinessDelta: -5 }, "壁は高い。説明は低い。"),
  card("mass-line", "量産ライン最適化", "SR", "弾薬生産 +25%。", "logistics", { resourceMultiplier: { ammo: 1.25 } }, "現場猫は見なかったことにした。"),
  card("black-recruit", "ブラック求人広告", "R", "人口 +10%、幸福度 -10。", "economy", { resourceMultiplier: { population: 1.1 }, happinessDelta: -10 }, "やりがいは支給済みです。"),
  card("mystery-investor", "謎の投資家", "SR", "初期資金 +1000、利息 +0.5%。", "economy", { flatResourceDelta: { money: 1000 }, interestRateDelta: 0.005 }, "名刺の会社名が毎回違う。"),
  card("divine-conveyor", "神のようなコンベア", "UR", "物流速度 +30%。", "logistics", { logisticsSpeedMultiplier: 1.3 }, "宗教法人ではありません。たぶん。"),
  card("silent-residents", "住民沈黙パッケージ", "SR", "暴徒発生率 -15%、税務リスク +10。", "risk", { enemySpawnMultiplier: { Rioter: 0.85 }, taxRiskDelta: 10 }, "静かな街には理由がある。"),
  card("ammo-coupon", "弾薬まとめ買い券", "N", "弾薬 +40。", "defense", { flatResourceDelta: { ammo: 40 } }, "宛名はなぜか商店街。"),
  card("scrap-festival", "廃材まつり", "N", "廃材 +80。", "city", { flatResourceDelta: { scrap: 80 } }, "祭りの後に建材が残る。"),
  card("fuel-smell", "燃料のする土地", "R", "燃料 +60、幸福度 -3。", "economy", { flatResourceDelta: { fuel: 60 }, happinessDelta: -3 }, "地価だけは下がった。"),
  card("power-bribe", "送電のお願い", "R", "電力 +20、税務リスク +4。", "city", { flatResourceDelta: { power: 20 }, taxRiskDelta: 4 }, "お願いの封筒が厚い。"),
  card("laser-manual", "レーザー塔取扱説明書", "SR", "レーザー塔コスト -15%。", "defense", { buildingCostMultiplier: { LaserTurret: 0.85 } }, "最終ページだけ焦げている。"),
  card("fire-insurance", "火災保険の曲解", "SR", "火炎放射塔コスト -20%、税務リスク +6。", "defense", { buildingCostMultiplier: { FlameTurret: 0.8 }, taxRiskDelta: 6 }, "保険会社がこちらを見ています。"),
  card("resident-coupon", "住民満足クーポン", "N", "幸福度 +5。", "city", { happinessDelta: 5 }, "有効期限は昨日。"),
  card("audit-decoy", "監査おとり帳簿", "R", "税務調査官出現率 -20%。", "risk", { enemySpawnMultiplier: { TaxInspector: 0.8 } }, "おとりにしては作り込みが良い。"),
  card("spy-camera", "工場内カメラ増設", "R", "企業スパイ出現率 -15%。", "defense", { enemySpawnMultiplier: { CorporateSpy: 0.85 } }, "監視ではなく見守りです。"),
  card("complaint-script", "クレーム対応台本", "N", "重装クレーマーHP実質 -10%。", "risk", { enemySpawnMultiplier: { ArmoredComplainer: 0.9 } }, "謝罪の速度だけは一流。"),
  card("debt-refinance", "借金借り換え芸", "SR", "利息 -0.4%、借金 +300。", "economy", { flatResourceDelta: { debt: 300 }, interestRateDelta: -0.004 }, "穴を掘って橋をかける。"),
  card("tax-office-joke", "税務署ジョーク集", "N", "税務署コスト -10%、幸福度 -2。", "risk", { buildingCostMultiplier: { TaxOffice: 0.9 }, happinessDelta: -2 }, "笑ったら追徴。"),
  card("hq-renovation", "本社リノベ見積", "SR", "本社HPを実質強化。資金 +200。", "defense", { flatResourceDelta: { money: 200 } }, "耐震より耐債務。"),
  card("turret-overtime", "砲台残業命令", "R", "タワーダメージ +10%、幸福度 -4。", "defense", { towerDamageMultiplier: 1.1, happinessDelta: -4 }, "砲台にも労基はある。"),
  card("clean-ledger", "清廉な帳簿", "SR", "税務リスク -18%、資金 -120。", "risk", { taxRiskDelta: -18, flatResourceDelta: { money: -120 } }, "清廉は高い。"),
  card("oil-rumor", "石油跡地の噂", "R", "燃料生産 +20%。", "economy", { resourceMultiplier: { fuel: 1.2 } }, "噂でポンプは回る。"),
  card("miner-union", "採掘機労組", "N", "採掘機コスト -10%、維持費気分 +少々。", "city", { buildingCostMultiplier: { Miner: 0.9 } }, "機械にも昼休み。"),
  card("battery-cult", "蓄電池信仰", "R", "蓄電池コスト -25%。", "logistics", { buildingCostMultiplier: { Battery: 0.75 } }, "電気は貯めると落ち着く。"),
  card("loan-office-neon", "闇金融ネオン看板", "N", "闇金融オフィスコスト -15%、税務リスク +3。", "economy", { buildingCostMultiplier: { LoanOffice: 0.85 }, taxRiskDelta: 3 }, "夜だけ景気がいい。"),
  card("shop-pop", "商業施設ポップ術", "R", "商業収益 +20%、税務リスク +4。", "economy", { resourceMultiplier: { money: 1.2 }, taxRiskDelta: 4 }, "売れているものはだいたい怪しい。"),
  card("road-minimalism", "道路ミニマリズム", "N", "道路コスト -25%。", "logistics", { buildingCostMultiplier: { Road: 0.75 } }, "必要な道だけ作る。逃げ道は別。"),
  card("boss-memo", "破産管財人メモ", "UR", "ボス出現時の研究報酬 +大。", "risk", { resourceMultiplier: { research: 1.35 } }, "弱点ではなく性格が書いてある。"),
  card("miracle-budget", "奇跡の補正予算", "UR", "資金 +1800、税務リスク +12。", "economy", { flatResourceDelta: { money: 1800 }, taxRiskDelta: 12 }, "出所は聞かない方針。"),
];

function card(
  key: string,
  nameJa: string,
  rarity: CardDefinition["rarity"],
  descriptionJa: string,
  category: CardDefinition["category"],
  effects: CardDefinition["effects"],
  flavorTextJa: string,
): CardDefinition {
  return {
    key,
    nameJa,
    rarity,
    descriptionJa,
    category,
    effects,
    flavorTextJa,
    artPrompt: `${promptBase}, card named ${nameJa}, bankruptcy city, factories, debt documents, tactical UI frame`,
  };
}

export function cardsByRarity(rarity: CardDefinition["rarity"]): CardDefinition[] {
  return CARD_DEFINITIONS.filter((cardDefinition) => cardDefinition.rarity === rarity);
}
