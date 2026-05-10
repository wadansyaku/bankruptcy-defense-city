import { useAppState } from "../../state/appState";

export function InventoryScreen() {
  const { snapshot } = useAppState();

  return (
    <section className="inventory-screen" aria-labelledby="inventory-title">
      <div className="section-head">
        <p className="screen-label">保管庫</p>
        <h1 id="inventory-title">カード一覧</h1>
      </div>
      <div className="card-grid" data-testid="inventory-cards">
        {snapshot.cards.map((card) => (
          <article key={card.id} className={`inventory-card rarity-${card.rarity}`}>
            <span>{card.rarity}</span>
            <h2>{card.name}</h2>
            <p>{card.effect}</p>
            <strong>所持 {card.owned}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
