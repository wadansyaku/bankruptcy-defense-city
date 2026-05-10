import { FormEvent, useState } from "react";
import { useAppState } from "../../state/appState";
import { Icon } from "../icons";

export function MapGenerationPanel() {
  const { actions } = useAppState();
  const [seed, setSeed] = useState("PR1-TOKYO-BAY");
  const [district, setDistrict] = useState("湾岸再建区");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    actions.generateMap(seed, district);
  }

  return (
    <section className="map-screen" aria-labelledby="map-title">
      <div className="map-copy">
        <p className="screen-label">地図生成</p>
        <h1 id="map-title">初期区画を選ぶ</h1>
        <p>都市の形、夜襲方向、初期資金を決めます。PR1では軽量な端末内生成で開始できます。</p>
      </div>
      <form className="map-builder" onSubmit={submit}>
        <label>
          区画名
          <input value={district} onChange={(event) => setDistrict(event.target.value)} />
        </label>
        <label>
          シード
          <input value={seed} onChange={(event) => setSeed(event.target.value)} />
        </label>
        <div className="map-preview" aria-label="生成プレビュー">
          {Array.from({ length: 16 }).map((_, index) => (
            <span key={index} className={index % 5 === 0 ? "blocked" : index % 3 === 0 ? "road" : ""} />
          ))}
        </div>
        <button className="primary-action" type="submit" data-testid="generate-map">
          <Icon name="map" />
          この地図で開始
        </button>
      </form>
    </section>
  );
}
