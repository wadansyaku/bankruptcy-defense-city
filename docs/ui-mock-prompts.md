# UI Mock Prompts

このファイルは Codex GPT image2 で UI mock を作るための prompt 台本です。React 実装ではなく、画面構成、情報優先度、余白、操作導線の合意に使います。

生成画像は production asset ではなく UI/UX 判断用の参照画像です。画像内テキストは最終実装で React が描画するため、mock では短い日本語ラベルの雰囲気が読めれば十分です。

## Shared Direction

Use these constraints in every prompt:

- Game: "破産防衛都市", 2D city management, automation, tower defense, bankruptcy survival.
- Tone: intellectually playful Japanese civic crisis game, serious interface, dark but not depressing.
- Viewpoint: tactical 2D city map, React HUD over a Phaser canvas, no 3D.
- Palette: deep charcoal, civic teal, warning amber, insolvency red, reconstruction green, paper white.
- UI shape: compact panels, 8px or smaller radius, crisp separators, icon + short Japanese labels.
- Mobile: 360 x 640 portrait must be usable with one thumb, safe-area aware, bottom command dock, bottom build sheet.
- Desktop: map remains central, persistent HUD must not cover the middle of the playfield.
- Avoid: casino visuals, real-money purchase cues, fantasy castles, crypto/NFT cues, large marketing hero cards, decorative gradient blobs, unreadable tiny text, copyright-specific game or artist styles.

## Current UI Findings To Guide Mocks

- Landing already has title, login/signup/guest flow, and a city visual. The mock should make it feel like the first playable command screen, not a marketing page.
- Dashboard has basic metrics and actions. The mock should clarify save status, free currency, card count, and the next best action in one glance.
- Game HUD currently exposes key survival metrics, but the visual hierarchy should group them as survival, finance, supply, and social pressure.
- Build controls exist as a bottom sheet and side HUD. The mock should resolve them into a one-thumb mobile sheet and a desktop operations rail.
- Gacha exists and is server-side / free-currency oriented. The mock must communicate "free support request", rates, pity, and owned results without gambling or purchase cues.
- Inventory exists as a card grid. The mock should add filters, deck slots, rarity reading, ownership state, and quick comparison.

## File Naming Recommendation

When a UI mock is generated, save it outside the shipping asset manifest unless intentionally promoted:

- `generated/codex-image2-source/ui-mock-landing.png`
- `generated/codex-image2-source/ui-mock-dashboard.png`
- `generated/codex-image2-source/ui-mock-game-hud-desktop.png`
- `generated/codex-image2-source/ui-mock-game-hud-mobile.png`
- `generated/codex-image2-source/ui-mock-gacha.png`
- `generated/codex-image2-source/ui-mock-inventory.png`
- `generated/codex-image2-source/ui-mock-mobile-flow.png`

## Generated Mock In This Batch

- Source prompt: `Game HUD / Desktop Operations Layout` plus mobile companion constraints from `Game HUD / Mobile One-Thumb Layout`.
- Tracked reference image: `docs/ui-mocks/ui-mock-game-hud-desktop-mobile.png`
- Local generated copy: `generated/codex-image2-source/ui-mock-game-hud-desktop-mobile.png`
- Public preview copy: `public/assets/generated/ui-mock-game-hud-desktop-mobile.png`

Implementation changes should use the mock as information architecture guidance, not as a literal bitmap UI. The React/CSS layer remains the source of truth for Japanese text, buttons, resource values, Turnstile state, and responsive behavior.

## Landing / Guest Start

```text
Create a high-fidelity mobile UI mockup for a Japanese 2D city management tower defense game titled "破産防衛都市".

Canvas: 390 x 844 portrait mobile app screen.
Scene: the first screen should feel like a playable crisis command room, not a marketing website. Show a tactical overhead city district image in the top half with a visible HQ, roads, factories, and warning routes. The brand title is large but integrated into the command interface.
UI layout: top safe-area status bar, compact title block, one clear primary button for "ゲストプレイ", secondary buttons for "ログイン" and "新規登録", a small status strip explaining local guest play and later sync, and a bottom navigation hint.
Visual tone: near-future Japanese municipal emergency operations, dark charcoal panels, civic teal highlights, warning amber action button, paper-white text, subtle insolvency red alert accents.
UX goal: make the fastest path to playing obvious while keeping login/register visible but secondary.
Text: use short Japanese labels such as "破産防衛都市", "ゲストプレイ", "ログイン", "新規登録", "破産まであと少し". Exact typography can be approximate because final text is rendered in React.
Avoid: split marketing hero layout, generic SaaS dashboard, casino cues, photorealistic people, huge paragraphs, decorative blobs, 3D.
```

## Dashboard / Operations Hub

```text
Create a high-fidelity responsive desktop UI mockup for the "破産防衛都市" home dashboard.

Canvas: 1440 x 900 desktop web app.
Scene: an operations hub after login. It should summarize the city and let the player resume quickly.
UI layout: left top brand header, central city status band, compact metric cards for "最終セーブ", "所持通貨", "無料ガチャ通貨", "所持カード", and a prominent action area with "続きから" as primary, plus "新規ゲーム", "マップ生成", "支援ガチャ", "設定". Include a small last incident log and a tiny city map thumbnail.
Hierarchy: the next action must be obvious in 2 seconds. Survival and finance status come before decorative content.
Visual tone: tactical municipal finance dashboard, game-like but restrained, dark charcoal with teal, amber, green, and red role colors.
Text: short Japanese UI labels only. Include playful civic-crisis phrases like "税務署がこちらを見ています" and "弾薬ラインが詰まっています" as log snippets.
Avoid: marketing hero, nested cards inside cards, full-page beige report, stock-photo business people, one-note blue dashboard.
```

## Game HUD / Desktop Operations Layout

```text
Create a high-fidelity desktop game UI mockup for "破産防衛都市", a 2D city management + tower defense game using a Phaser canvas with React HUD.

Canvas: 1440 x 900 desktop gameplay screen.
Main surface: a large central 2D tactical city map with roads, HQ, factories, residential blocks, towers, conveyors, and multiple enemy approach routes. Keep the center playable and visible.
HUD layout: compact top status strip with day and phase. Left rail groups survival and finance metrics: "本社HP", "資金", "借金残高", "本日の利息". Right rail groups social and supply pressure: "住民幸福度", "税務リスク", "電力", "弾薬", "燃料". Bottom command dock contains icon buttons for build, repair, logistics, night start, save. Event log is a narrow collapsible panel, not a large permanent box.
Interaction state: show daytime planning with a selected "砲台" building, valid tiles highlighted, blocked path warning visible but not covering the map.
UX goal: player can scan survival risk, choose a building, place it, and start night without leaving the map.
Visual tone: emergency operations console meets tactical map, crisp lines, high contrast, readable Japanese labels, restrained motion cues implied.
Avoid: center-screen modal, dense opaque overlays, generic admin dashboard, fantasy tower defense castle UI, 3D camera, casino visuals.
```

## Game HUD / Mobile One-Thumb Layout

```text
Create a high-fidelity mobile portrait gameplay UI mockup for "破産防衛都市".

Canvas: 390 x 844 portrait mobile app screen.
Main surface: 2D city map canvas fills most of the screen. Show HQ near center, roads, factories, power lines, towers, conveyors, enemy route arrows from map edges, and tile selection.
HUD layout: top safe-area compact resource strip with two rows: row 1 "DAY", phase, HQ HP, funds; row 2 debt, interest, happiness, tax risk. Use colored chips, not large cards. The center of the map must remain visible.
Bottom UI: one-thumb command dock above the OS safe area with icons for "建設", "修理", "夜開始", "保存". A bottom sheet is half-open for building selection, with a handle, selected building details, cost, supply need, and 2-column building grid. Include a collapse affordance.
Touch affordances: large 48px minimum targets, selected tile outline, long-press detail hint, pinch zoom cue, drag camera cue.
UX goal: 360px width users can place a building and start night without reaching the top corners.
Visual tone: dark civic crisis console, amber primary command, teal selectable state, red danger warning, green supply ok.
Avoid: covering the lower-middle map with permanent text, small unreadable labels, desktop sidebars squeezed into mobile, 3D, decorative gradients.
```

## Map Generation

```text
Create a high-fidelity UI mockup for the map generation screen of "破産防衛都市".

Canvas: 390 x 844 mobile portrait, with a companion desktop-aware composition implied.
UI layout: seed input, randomize button, map size segmented control, difficulty segmented control, biome tendency selector, and a large deterministic map preview. Preview should show HQ candidate, enemy spawn points, resource tiles, roads, water/forest/rock, and pathfinding validity.
UX goal: player understands that the same seed produces the same city and that the map is playable before starting.
Visual tone: municipal planning map, blueprint-like tactical grid, dark charcoal frame, teal valid paths, amber resource highlights, red enemy spawn markers.
Text: use short Japanese labels like "シード", "ランダム生成", "難易度", "廃工業地帯", "経路OK", "この土地で防衛する".
Avoid: abstract noise preview, unreadable tiny grid, fantasy world map, oversized explanatory paragraphs.
```

## Free Currency Gacha

```text
Create a high-fidelity mobile UI mockup for the free-currency gacha screen in "破産防衛都市".

Canvas: 390 x 844 portrait mobile app screen.
Theme: "復興支援パッケージ" and policy card rewards. The gacha must look like a free in-game support request, not casino gambling or real-money purchase.
UI layout: top currency chip for free gacha currency, banner title "破産防衛スタートダッシュ", probability access chip, pity counter "UR天井まで", primary "1回引く" and secondary "10回引く" buttons, Turnstile-safe verification space shown as calm security status, and a result area with card reveal.
Result state: show one SR card result with rarity band, card art thumbnail, effect summary, and owned quantity. Include "無料通貨のみ" visibly but without legalistic clutter.
Visual tone: reconstruction support package, official envelope, emergency budget dossier, teal and amber reward glow, no coins or gems as the main motif.
UX goal: player sees cost, odds, pity, and result clearly before and after rolling.
Avoid: slot machines, roulette, cash purchase buttons, premium currency store, flashing casino reward visuals, real-money price labels.
```

## Inventory / Cards / Deck

```text
Create a high-fidelity desktop and mobile-aware UI mockup for the card inventory screen of "破産防衛都市".

Canvas: 1440 x 900 desktop with a clear mobile collapse pattern.
UI layout: top filter bar with rarity tabs "ALL / N / R / SR / UR", category filters "都市 / 防衛 / 経済 / 物流", sort menu, search field, and deck/equip slots. Main area is a dense but readable card grid with card art thumbnail, rarity band, owned count, effect summary, and category icon. Right detail panel shows selected card name, flavor text, effect values, and equip button.
Mobile behavior: filters collapse into chips, deck slots become a horizontal strip, detail panel opens as a bottom sheet.
Visual tone: policy archive meets tactical card binder, serious but fun, civic teal structure, amber selection, rarity colors used sparingly.
UX goal: player can find owned cards, compare effects, and equip a deck without reading long paragraphs.
Text: use short Japanese labels, examples like "節税の達人", "量産ライン最適化", "神のようなコンベア".
Avoid: oversized collectible-card glamor that hides utility, casino framing, tiny paragraph-heavy cards, bland spreadsheet styling.
```

## Mobile End-To-End Flow Board

```text
Create a single high-fidelity UI flow board for "破産防衛都市" showing five mobile screens side by side.

Canvas: 1800 x 900 horizontal design board, five 360 x 760 mobile frames.
Frames: 1 Landing / guest start, 2 Dashboard operations hub, 3 Map generation, 4 Gameplay with bottom build sheet, 5 Free-currency gacha result.
Design goal: demonstrate a coherent mobile-first UI system with the same palette, spacing, button language, bottom navigation, safe-area behavior, and Japanese labels across all screens.
Annotations: include small non-intrusive callout labels outside the phone frames for "one-thumb primary action", "playfield protected", "free currency only", "server-side roll", "sync after login". Keep annotations simple and not part of the in-game UI.
Visual tone: polished browser game product mock, dark civic crisis, readable and grounded, no 3D.
Avoid: marketing posters, decorative mockup devices that hide the UI, excessive shadows, unreadable text, casino or real-money cues.
```

## Implementation Translation Notes

When converting the selected mock into React/CSS, prioritize these changes:

1. Make guest play the fastest visible action on landing, with login/signup as secondary.
2. Group game HUD metrics by decision: survival, finance, supply, and public pressure.
3. Keep the playable map center clear; move long logs and detailed building data into collapsible surfaces.
4. Convert mobile build controls into a bottom sheet with selected building details and two-column actions.
5. For gacha, always show free currency cost, rates entry, pity counter, and "無料通貨のみ"; never introduce purchase CTAs.
6. For inventory, add rarity/category filters, deck slots, and a detail surface so cards are not only a static grid.
