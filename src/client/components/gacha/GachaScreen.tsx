import { useAppState } from "../../state/appState";
import { Icon } from "../icons";

export function GachaScreen() {
  const { snapshot, actions } = useAppState();
  const latest = [...snapshot.cards].reverse().find((card) => card.owned > 0);

  return (
    <section className="gacha-screen" aria-labelledby="gacha-title">
      <div className="gacha-machine">
        <p className="screen-label">支援要請</p>
        <h1 id="gacha-title">復興カード抽選</h1>
        <p>PR1では端末内抽選にフォールバックします。API接続後はサーバー抽選へ切り替わります。</p>
        <button className="primary-action" type="button" onClick={actions.pullGacha} data-testid="pull-gacha">
          <Icon name="card" />
          1回引く
        </button>
      </div>
      {latest && (
        <article className={`card-prize rarity-${latest.rarity}`} data-testid="gacha-result">
          <span>{latest.rarity}</span>
          <h2>{latest.name}</h2>
          <p>{latest.effect}</p>
          <strong>所持 {latest.owned}</strong>
        </article>
      )}
    </section>
  );
}
