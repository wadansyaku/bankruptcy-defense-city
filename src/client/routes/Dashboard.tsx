import { useAppState } from "../state/appState";
import { Icon } from "../components/icons";

export function Dashboard() {
  const { snapshot, actions } = useAppState();
  const { city } = snapshot;

  return (
    <section className="dashboard" aria-labelledby="dashboard-title">
      <div className="dashboard-hero">
        <p className="screen-label">防衛本部</p>
        <h1 id="dashboard-title">{city.districtName}</h1>
        <p>DAY {city.day}。破産圧を抑えながら夜フェーズに備えてください。</p>
        <div className="hero-actions">
          <button className="primary-action" type="button" onClick={() => actions.navigate("map")} data-testid="new-game">
            <Icon name="map" />
            新しい地図
          </button>
          <button className="secondary-action" type="button" onClick={() => actions.navigate("game")}>
            都市へ戻る
          </button>
        </div>
      </div>
      <div className="status-grid">
        <article>
          <span>資金</span>
          <strong>{city.funds}</strong>
        </article>
        <article>
          <span>士気</span>
          <strong>{city.morale}</strong>
        </article>
        <article>
          <span>都市HP</span>
          <strong>{city.cityHp}</strong>
        </article>
        <article>
          <span>カード</span>
          <strong>{snapshot.cards.filter((card) => card.owned > 0).length}</strong>
        </article>
      </div>
    </section>
  );
}
