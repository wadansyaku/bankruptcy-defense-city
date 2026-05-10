import { FormEvent, useState } from "react";
import { useAppState } from "../../state/appState";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { actions } = useAppState();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(mode === "signup" ? "captain@example.test" : "guest@example.test");
  const [password, setPassword] = useState("defense-pr1");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = { name, email, password };
    if (mode === "signup") {
      await actions.signup(payload);
    } else {
      await actions.login(payload);
    }
  }

  return (
    <section className="auth-screen" aria-labelledby="auth-title">
      <div className="auth-panel">
        <p className="screen-label">アカウント</p>
        <h1 id="auth-title">{mode === "signup" ? "防衛隊を登録" : "防衛本部へログイン"}</h1>
        <p>通信できない環境ではモック認証で開始し、あとから端末データを同期できます。</p>
        <form onSubmit={submit} className="stack-form">
          {mode === "signup" && (
            <label>
              表示名
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="隊長名" autoComplete="name" />
            </label>
          )}
          <label>
            メール
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label>
            パスワード
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={8}
            />
          </label>
          <button className="primary-action" type="submit" data-testid={mode === "signup" ? "signup-submit" : "login-submit"}>
            {mode === "signup" ? "登録して開始" : "ログイン"}
          </button>
        </form>
        <button className="text-button" type="button" onClick={() => actions.navigate(mode === "signup" ? "login" : "signup")}>
          {mode === "signup" ? "ログインへ" : "新規登録へ"}
        </button>
      </div>
    </section>
  );
}
