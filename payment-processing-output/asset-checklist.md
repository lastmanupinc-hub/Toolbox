# Asset Checklist — avery-pay-platform

Generated: 2026-04-05T07:37:21.796Z

## Required Assets

### Fonts
- [ ] Inter (primary body font)
- [ ] JetBrains Mono (code snippets)

### Colors
- [x] Background: #0f0f23 (defined in theme)
- [x] Foreground: #e2e8f0 (defined in theme)
- [x] Accent: #6366f1 (defined in theme)
- [x] Muted: #64748b (defined in theme)

### Images
- [ ] avery-pay-platform logo (SVG, transparent background)
- [ ] Social media preview thumbnail (1200×630)
- [ ] Video poster frame (1920×1080)

### Framework Logos
- [ ] Svelte logo (SVG or PNG, transparent)

### Audio
- [ ] Background music track (12s, royalty-free)
- [ ] Transition sound effect
- [ ] Optional: voiceover narration (see scene-plan.md)

## Technical Requirements

### Dependencies
- [ ] `remotion` >= 4.0
- [ ] `@remotion/cli` (for rendering)
- [ ] `@remotion/renderer` (for programmatic rendering)

### Environment
- [ ] Node.js >= 18
- [ ] Chrome/Chromium (for rendering)
- [ ] FFmpeg (for H.264 encoding)

## Output Formats

| Format | Resolution | Use Case |
|--------|-----------|----------|
| MP4 (H.264) | 1920×1080 | Primary delivery |
| WebM (VP9) | 1920×1080 | Web embedding |
| GIF | 800×450 | Social preview |
| PNG Sequence | 1920×1080 | Custom compositing |
