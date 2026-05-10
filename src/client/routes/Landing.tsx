import { useAppState } from "../state/appState";
import { Icon } from "../components/icons";

export function Landing() {
  const { actions } = useAppState();

  return (
    <section className="landing" aria-labelledby="landing-title">
      <div className="landing-visual">
        <img src="/assets/placeholders/city-core.svg" alt="" />
      </div>
      <div className="landing-copy">
        <h1 id="landing-title">破産防衛都市</h1>
        <p>資金、士気、都市HPを守りながら、夜ごとに強まる債務圧から街を防衛するPWAです。</p>
        <div className="landing-actions">
          <button className="primary-action" type="button" onClick={() => actions.navigate("signup")} data-testid="landing-signup">
            <Icon name="shield" />
            新しく始める
          </button>
          <button className="secondary-action" type="button" onClick={() => actions.navigate("login")} data-testid="landing-login">
            ログイン
          </button>
        </div>
      </div>
    </section>
  );
}
