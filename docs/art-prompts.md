# Art Prompts

`scripts/generate-assets.ts` は下記のslugに対応する Codex GPT image2 生成PNGを `generated/codex-image2-source/` から取り込みます。画像ファイルがないslugは placeholder を出力します。OpenAI API key は使いません。

## Global Style

Grounded near-future Japanese city, municipal finance crisis, tactical mobile game, clean readable shapes, civic teal and warning amber accents, hopeful reconstruction mood, no fantasy castle, no medieval weapons, no stock photo look.

## Assets

### hero-city-crisis

Key visual for a mobile strategy game called "破産防衛都市". A near-future Japanese city seen from above at dusk, city hall glowing as the central command point, financial warning lines and reconstruction lights over districts, dramatic but hopeful, clean game key art, no text.

### district-city-hall

Icon illustration of a modern Japanese city hall district as the core base in a tactical city defense game, clear silhouette, civic teal lights, administrative plaza, mobile game asset, transparent-friendly composition, no text.

### district-commercial

Icon illustration of a commercial shopping district under fiscal pressure, storefront lights, tax revenue data lines, amber warning accents, tactical mobile game asset, no text.

### district-residential

Icon illustration of a residential district protected by community services, apartment blocks, small parks, green reconstruction accents, readable at small size, no text.

### district-industrial

Icon illustration of an industrial district with factories, logistics roads, repair cranes, infrastructure gray and warning amber, tactical city map tile, no text.

### card-emergency-loan

Policy card art showing an emergency municipal loan approval, official document, urgent stamp-like visual motif without readable text, teal and red tension, mobile card game frame-safe image.

### card-public-briefing

Policy card art showing a calm public briefing in a disaster response room, city officials and residents around a map table, hopeful civic mood, no text.

### event-interest-shock

Crisis event banner art representing a sudden interest payment shock, financial graph pressure over city skyline, insolvency red accents, no readable text.

### gacha-support-package

Free currency gacha visual: a reconstruction support package with policy documents, tools, and civic seals, bright reward feeling without casino imagery, no text.

### ui-command-dock-bg

Mobile game command dock background, compact control surface inspired by emergency operations dashboards, dark charcoal base, teal highlights, amber alert slots, no text, no icons.

## Prompt Notes

- Text is forbidden in generated images. UI text must be rendered by React.
- Each asset should remain readable at mobile size.
- Avoid copyrighted city landmarks.
- Avoid real political symbols.
- Keep room for UI cropping.
