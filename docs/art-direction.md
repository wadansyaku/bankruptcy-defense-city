# Art Direction

## Visual Thesis

破産防衛都市の見た目は、財政危機の硬さとスマホゲームの読みやすさを両立させます。暗くしすぎず、行政資料、都市地図、災害対策本部、近未来の財務 dashboard を混ぜた方向です。

## Keywords

- civic crisis
- tactical city map
- municipal finance
- emergency operations
- hopeful reconstruction
- readable mobile game UI
- grounded near-future Japan

## Palette

- Deep charcoal: `#182026`
- Civic teal: `#1A8C8C`
- Warning amber: `#F2A900`
- Insolvency red: `#D64545`
- Reconstruction green: `#3FA66B`
- Paper white: `#F4F1E8`
- Infrastructure gray: `#8A9299`

単色テーマに寄せず、teal / amber / red / green を役割色として使います。

## Shape Language

- 地図・区画: 六角形よりも都市ブロック風の直交グリッド。
- 財政 pressure: 赤い波、警告ライン、債務の鎖ではなく、数値パネルと警報帯。
- 防衛施設: 行政・インフラ・公共施設として説得力を持たせる。
- ガチャ演出: 派手すぎる宝箱ではなく、緊急支援パッケージ、補正予算封筒、復興計画書。

## Character Direction

キャラクターを使う場合は mascot よりも、都市職員、復興エンジニア、監査官、商店街代表などの役割で立てます。PR1 のスマホ UI では都市マップと区画状態が主役です。

## UI Mood

- Mobile first。
- 下部 command dock。
- 重要数値は小さすぎない。
- カードは角丸 8px 以下。
- 破産危機は赤を使うが、全体を赤黒くしない。
- 重要操作は icon + short label。
- 中央のプレイフィールドを常に守る。通常プレイ中に地図中央へ大きな説明カードやログを置かない。
- 情報は「生存」「財務」「供給」「社会圧」の順に読めるようにする。
- 360px 幅では主要操作を下半分に寄せ、片手で建設、夜開始、保存へ届くようにする。
- ゲーム中の長文説明は drawer、bottom sheet、詳細モーダルへ退避する。

## UI/UX Improvement Direction

今回の UI mock batch は、既存の PR1 UI を「画面が揃っている状態」から「実際に遊び続けられる操作盤」へ引き上げるための参照です。

### Landing

- ランディングは宣伝ページではなく、最初の司令室として見せる。
- 最速導線は「ゲストプレイ」。ログインと新規登録は同期・保存のための補助導線にする。
- タイトル背景は抽象グラデーションではなく、実際の都市、HQ、道路、敵襲方向が分かるものにする。

### Dashboard

- 「続きから」を最優先にし、次に「新規ゲーム」「マップ生成」「支援ガチャ」を並べる。
- 最終セーブ、所持通貨、無料ガチャ通貨、カード数を同じ階層に置く。
- 小さな事件ログを置き、ゲームのふざけた社会圧を短文で伝える。

### Game HUD

- 本社HP、資金、借金、利息を survival / finance の最重要情報として上位に置く。
- 電力、弾薬、燃料は supply cluster としてまとめ、供給不足時だけ強い色にする。
- 幸福度と税務リスクは public pressure cluster として隣接させる。
- 建設パネルは mobile では bottom sheet、desktop では rail / dock に寄せる。
- ログは常時巨大表示せず、最新 2-3 件を chip 表示し、詳細は開閉式にする。

### Gacha

- 表現は「復興支援」「補正予算」「政策カード」。宝箱、スロット、札束、購入導線は使わない。
- 「無料通貨のみ」「確率」「天井まで」を同時に見せる。
- Turnstile は技術用語を押し出さず、「無料通貨の安全確認」程度に落とす。

### Inventory

- カード一覧は単なる grid ではなく、rarity / category / owned / deck slot の操作面にする。
- カード効果は短く、詳細は選択時の side panel または bottom sheet に出す。
- レアリティ色は縁取りと小さな帯に使い、画面全体を虹色にしない。

### Mobile

- 360 x 640 を最低成立サイズとして扱う。
- タッチ target は 48px 以上を基準にする。
- 片手操作では、建設、夜開始、保存、支援の主要操作を下部へ寄せる。
- 横画面では HUD を左、地図を右に分け、地図の高さを優先する。
- safe-area を前提に、bottom nav と bottom sheet が重ならないようにする。

## Asset Classes

- Hero key visual
- City map tiles
- District icons
- Policy cards
- Crisis event banners
- Gacha support package
- UI background panels
- Loading / empty placeholders
- UI mock boards
- Mobile gameplay frame references
- Gacha result frame references
- Inventory detail frame references

## Negative Direction

- 中世ファンタジー城防衛に寄せない。
- 暗いサイバーパンクだけにしない。
- 金貨や宝石だけの一般的なガチャ表現にしない。
- 行政資料風すぎてゲームの楽しさが消える方向にしない。
- リアルマネー購入、価格表示、有償石、ショップ導線を UI mock に入れない。
- 生成画像の中に最終 UI として使う長い日本語本文を焼き込まない。
- 既存ゲーム名、特定アーティスト名、著作権のある UI スタイル指定を prompt に入れない。

## GPT Image2 Mock Usage

UI mock は `docs/ui-mock-prompts.md` の prompt を Codex GPT image2 に投入して作る。OpenAI API key は使わない。

Mock は実装参照であり、最終 UI そのものではない。特に日本語テキスト、数値、カード名、確率、Turnstile 表示は React 側で正確に描画する。

今回採用した参照 mock:

- `docs/ui-mocks/ui-mock-game-hud-desktop-mobile.png`
- 画面構造: desktop gameplay HUD と mobile one-thumb gameplay を 1 枚で比較。
- 実装へ反映した点: 上部 KPI strip、供給 cluster、desktop operations rail、bottom build dock、開閉式ログ、無料通貨ガチャの明示、カード inventory の filter / deck / detail 構造。

採用する mock は以下を満たすこと:

- 360px 幅で主要操作が読める。
- 地図中央が UI に隠れていない。
- 財務危機、供給不足、敵襲、住民不満の区別が色とラベルで分かる。
- ガチャが無料ゲーム内通貨の支援要請として見える。
- カード一覧が収集画面ではなく、都市運用の意思決定画面に見える。
