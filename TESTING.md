# Impossible Aces Test Workflow

Use this workflow before public releases, after rule changes, after settings changes, and before publishing a Steam/demo build.

## Test Levels

### 1. Automated checks

Run these locally before merging:

```bash
npm run typecheck
npm run build
```

Run the full project check:

```bash
npm run check
```

The GitHub `Test` workflow runs `npm ci` and `npm run check` on pushes to `main`, pull requests, and manual workflow dispatch.

### 2. Manual smoke test

Run the app locally:

```bash
npm run dev
```

Smoke test on desktop and mobile-width browser viewports:

- The app loads without console errors.
- First-run tutorial opens for a clean browser profile.
- A new round can be started.
- Cards render with correct rank, suit, color, and style.
- How To Play, Settings, Stats, and Game Mode dialogs open and close.
- Refreshing the page restores an in-progress round.
- Reset clears the active board and updates reset stats.
- A completed win opens the win modal once.
- A loss opens the loss modal once.

## Game Mode Matrix

Test every major rule in both modes.

| Area | Impossible | Strategic Reserve |
| --- | --- | --- |
| Reserve slot visibility | Reserve UI is hidden | Reserve UI is visible |
| Deal first row | Four cards appear | Four cards appear |
| Remove lower same-suit visible card | Allowed | Allowed |
| Remove blocked card | Blocked | Blocked |
| Move bottommost card to empty top slot | Allowed | Allowed |
| Move blocked card to top slot | Blocked | Blocked |
| Win state | Only four Aces remain in top row | Only four Aces remain in top row and reserve is empty |
| Loss state | No cards left to deal and no valid board moves | No cards left to deal, no valid board moves, and no valid reserve move |
| Stats bucket | Updates only Impossible stats | Updates only Strategic Reserve stats |
| Persisted mode | Reload keeps Impossible | Reload keeps Strategic Reserve |

## Settings Matrix

Test each setting independently, then test the common combinations listed below.

### See card to remove

Setting key: `removableCard`

- On: removable cards show the green removable styling.
- Off: removable cards are still clickable/removable, but no helper styling is shown.
- Switching the setting mid-round does not change the board state.
- Reload keeps the chosen setting.

### Disable deal button when board moves are possible

Setting key: `disableDealButton`

- On: deal is disabled when any card can be removed.
- On: deal is disabled when any bottommost card can move into an empty top slot.
- On: deal is not disabled only because a reserve move is possible.
- Off: deal remains available whenever cards are left in the deck.
- Reload keeps the chosen setting.

### Card style

Setting key: `cardStyle`

- `classic`: cards use the normal pip layout.
- `largeSymbols`: cards use the large center rank/suit layout.
- Switching style mid-round preserves all cards, reserve state, stats, and deck count.
- Mobile first-load defaults to `largeSymbols` when no saved setting exists.
- Desktop first-load defaults to `classic` when no saved setting exists.

### Strategic Reserve uses

Setting key: `reserveUseLimit`

Only visible in Strategic Reserve mode.

- `3`: starts each new Strategic Reserve round with 3 reserve uses.
- `5`: starts each new Strategic Reserve round with 5 reserve uses.
- `8`: starts each new Strategic Reserve round with 8 reserve uses.
- `unlimited`: shows infinity and does not decrement.
- Placing a card into reserve decrements finite limits by 1.
- Moving a card out of reserve does not restore a use.
- At 0 uses, cards cannot be moved into reserve.
- Changing the limit updates the next reset/new round reserve counter.
- Switching to Impossible hides the reserve limit controls and sets active reserve uses to none.

## Required Setting Combinations

Run at least one round setup with each combination:

| Mode | removableCard | disableDealButton | cardStyle | reserveUseLimit |
| --- | --- | --- | --- | --- |
| Impossible | On | On | Classic | N/A |
| Impossible | Off | On | Large symbols | N/A |
| Impossible | On | Off | Classic | N/A |
| Strategic Reserve | On | On | Classic | 3 |
| Strategic Reserve | Off | On | Large symbols | 5 |
| Strategic Reserve | On | Off | Classic | 8 |
| Strategic Reserve | Off | Off | Large symbols | Unlimited |

## Core Rule Regression Tests

### Card removal

- A visible lower-ranked card can be removed when a higher-ranked visible card of the same suit exists.
- A card cannot be removed when the only higher same-suit card is blocked.
- A card cannot be removed when the higher visible card has a different suit.
- A higher-ranked card cannot be removed by a lower same-suit card.
- A card in the top row can be removed only if it is visible and the same-suit higher-card rule is satisfied.
- Removing a card creates an empty slot and may reveal the card above it.

### Strategic Reserve

- Only bottommost non-top-row cards can move into reserve.
- Top-row cards cannot move into reserve.
- Blocked cards cannot move into reserve.
- A card cannot move into reserve when reserve already contains a card.
- A reserved card can move only into an empty top-row slot.
- A reserved card cannot move into an occupied top-row slot.
- A reserved card cannot move into lower rows.
- A reserved card cannot be removed directly from reserve.
- A reserved card must not count as a visible higher same-suit card for removing board cards.
- If the final Ace row is completed while reserve contains a card, the reserve warning appears.
- When all four Aces are in the top row, reserve placement becomes disabled.

### Deal flow

- First deal creates one row with up to four cards.
- Subsequent deals fill topmost empty column slots before adding lower rows.
- Dealt cards never duplicate cards on the board, in reserve, or already removed.
- Deal is blocked when the deck is empty.
- Deal button state matches `disableDealButton`.

### Move flow

- A bottommost card can move to an empty top-row slot.
- A card cannot move to a non-top-row slot.
- A card cannot move upward if the target top-row slot is occupied.
- A card cannot move if another card exists below it in the same column.
- Drag, touch drag, and click/tap selection produce the same valid move result.

### Win and loss

- Win requires exactly four cards left, all four in the top row, all Aces, and reserve empty.
- Strategic Reserve does not win while a card remains in reserve.
- Loss requires no cards left to deal and no valid moves.
- Loss detection includes possible reserve-to-top moves in Strategic Reserve.
- Stats update only once per win/loss modal.
- Resetting after a finished round starts cleanly and does not double-count stats.

## Persistence Tests

Use browser reload and a closed/reopened tab.

- In-progress board restores exactly.
- Reserve card restores exactly.
- Removed cards stay removed and cannot be dealt again.
- Current mode restores.
- Settings restore.
- Reserve uses remaining restore.
- Round timer/start time restores.
- Completed round state does not incorrectly re-record stats after reload.
- Corrupt local storage falls back to a safe new game state.

## UI And Accessibility Pass

Test desktop, tablet, and mobile widths.

- No text overlaps cards, buttons, dialogs, or footer controls.
- Card slots keep stable sizes while dragging, selecting, and dealing.
- Dialog content fits on mobile without clipping important actions.
- Keyboard focus is visible on toolbar buttons, settings, mode choices, and modal actions.
- All clickable cards/buttons have understandable labels or visible text.
- Touch dragging does not scroll the page unexpectedly.
- The floating drag preview follows the pointer and disappears after drop/cancel.

## Browser Matrix

Before release, run the smoke test and one full round attempt in:

- Chrome latest
- Edge latest
- Firefox latest
- Safari latest if available
- iOS Safari
- Android Chrome

## Release Candidate Checklist

Complete this checklist before tagging or deploying a release:

- `npm run check` passes locally.
- GitHub `Test` workflow passes.
- GitHub Pages deploy workflow passes.
- Manual smoke test passes in both game modes.
- Settings matrix has been checked.
- Strategic Reserve regression cases pass.
- Persistence tests pass after reload.
- No console errors during normal play.
- README and How To Play match the current rules.
- New known bugs are documented before release.

## Future Automated Test Targets

When a test framework is added, prioritize these first:

- Pure rule tests for removable cards, visible cards, bottommost moves, reserve moves, win state, and loss state.
- Persistence normalization tests for settings, stats, current round, duplicate cards, corrupt storage, and old save shapes.
- Component tests for Settings, Game Mode, Stats, and How To Play dialogs.
- End-to-end tests for one Impossible win/loss path and one Strategic Reserve reserve-flow path.
