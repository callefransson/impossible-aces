import { useState } from "react";

export type Card = {
  suite: string;
  rank: string;
  id: string;
};

export type DeckSnapshot = {
  hand: Array<Array<Card | null>>;
  reserveCard: Card | null;
  removedIds: string[];
};

const SUITES = ["Hearts", "Spades", "Diamonds", "Clubs"];
const RANKS = [...Array(9).keys()].map((n) => String(n + 2)).concat(["J", "Q", "K", "A"]);
const EMPTY_HAND: Array<Array<Card | null>> = [[null, null, null, null]];

function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const suite of SUITES) {
    for (const rank of RANKS) {
      deck.push({ suite, rank, id: `${suite}-${rank}` });
    }
  }
  return deck;
}

function rankValue(rank: string): number {
  const map: Record<string, number> = { J: 11, Q: 12, K: 13, A: 14 };
  const n = Number(rank);
  if (!Number.isNaN(n)) return n;
  return map[rank] ?? 0;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cloneHand(rows: Array<Array<Card | null>>) {
  return rows.map((row) =>
    [0, 1, 2, 3].map((col) => row[col] ?? null),
  );
}

export default function useDeck(initialState?: Partial<DeckSnapshot>) {
  const [hand, setHand] = useState<Array<Array<Card | null>>>(() =>
    cloneHand(initialState?.hand ?? EMPTY_HAND),
  );
  const [reserveCard, setReserveCard] = useState<Card | null>(
    () => initialState?.reserveCard ?? null,
  );
  const [removedIds, setRemovedIds] = useState<Set<string>>(
    () => new Set(initialState?.removedIds ?? []),
  );

  const dealtIdSet = () => {
    const ids = new Set(
      hand.flat().filter(Boolean).map((c) => (c as Card).id),
    );
    if (reserveCard) ids.add(reserveCard.id);
    return ids;
  };

  const unavailableIdSet = () => new Set([...dealtIdSet(), ...removedIds]);

  // deal a single row (replaces first row)
  const deal = (count = 4) => {
    const unavailableIds = unavailableIdSet();
    const remaining = shuffle(makeDeck()).filter((c) => !unavailableIds.has(c.id));
    const selected: Array<Card | null> = [null, null, null, null];
    for (let i = 0; i < count && i < remaining.length; i++) {
      selected[i] = remaining[i];
    }
    setHand([selected]);
    return selected;
  };

  const dealFour = () => deal(4);

  // fill empty slots first; if still need, append new row(s) and fill them
  const dealRemainingFromDeck = (count = 4) => {
  const unavailableIds = unavailableIdSet();
  const remainingDeck = shuffle(makeDeck()).filter(
    (c) => !unavailableIds.has(c.id)
  );
  const newHand = hand.map((r) => r.slice()); // deep copy rows
  let deckIdx = 0;

  for (let k = 0; k < count && deckIdx < remainingDeck.length; k++) {
    const card = remainingDeck[deckIdx++];
    const col = k % 4;

    // find topmost empty slot in this column
    let placed = false;
    for (let r = 0; r < newHand.length; r++) {
      if (newHand[r][col] == null) {
        newHand[r][col] = card;
        placed = true;
        break;
      }
    }

    if (placed) continue;

    // create a new row and place the card at `col`
    const newRow: Array<Card | null> = [null, null, null, null];
    newRow[col] = card;
    newHand.push(newRow);
  }

  setHand(newHand);
  return newHand;
};

  const dealFourNew = () => dealRemainingFromDeck(4);

  const reset = () => {
    setHand([[null, null, null, null]]);
    setReserveCard(null);
    setRemovedIds(new Set());
  };

  // moveCard: move a card from one position to an empty slot
  // Can only move cards that are bottommost in their column to an empty slot on the first row
  const moveCard = (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    // Source card must exist
    const sourceCard = hand[fromRow]?.[fromCol];
    if (!sourceCard) return { moved: false };

    // Target must be empty
    const targetCard = hand[toRow]?.[toCol];
    if (targetCard) return { moved: false };

    // Only allow moving to the first row (row 0)
    if (toRow !== 0) return { moved: false };

    // Source must be below the target (fromRow > toRow)
    if (toRow >= fromRow) return { moved: false };

    // Move the card
    const newHand = hand.map((r) => r.slice());
    newHand[toRow][toCol] = sourceCard;
    newHand[fromRow][fromCol] = null;
    setHand(newHand);

    return { moved: true };
  };

  const moveCardToReserve = (fromRow: number, fromCol: number) => {
    if (reserveCard) return { moved: false };
    if (fromRow === 0) return { moved: false };

    const sourceCard = hand[fromRow]?.[fromCol];
    if (!sourceCard) return { moved: false };

    for (let row = fromRow + 1; row < hand.length; row++) {
      if (hand[row][fromCol] !== null) return { moved: false };
    }

    const newHand = hand.map((r) => r.slice());
    newHand[fromRow][fromCol] = null;
    setHand(newHand);
    setReserveCard(sourceCard);

    return { moved: true };
  };

  const moveReserveToTopSlot = (toCol: number) => {
    if (!reserveCard) return { moved: false };
    if (toCol < 0 || toCol >= 4) return { moved: false };
    if (hand[0]?.[toCol]) return { moved: false };

    const newHand = hand.map((r) => r.slice());
    newHand[0][toCol] = reserveCard;
    setHand(newHand);
    setReserveCard(null);

    return { moved: true };
  };

  const computeMaxPerSuit = (rows: Array<Array<Card | null>>) => {
    const maxPerSuit = new Map<string, number>();
    for (const c of rows.flat()) {
      if (!c) continue;
      const val = rankValue(c.rank);
      const cur = maxPerSuit.get(c.suite);
      if (cur === undefined || val > cur) maxPerSuit.set(c.suite, val);
    }
    return maxPerSuit;
  };

  // removable flags: only last-row cards are removable initially.
// Cards above become removable only if the slot directly below is null
// AND there is a higher-ranked card of the same suit that is also visible (not blocked).
const removableFlags = (() => {
  const lastRowIndex = Math.max(0, hand.length - 1);
  
  // First, determine which cards are "visible" (not blocked by a card below)
  const isVisible = (rIdx: number, colIdx: number): boolean => {
    if (rIdx === lastRowIndex) return true;
    const below = hand[rIdx + 1]?.[colIdx] ?? null;
    return below == null;
  };

  // Compute max only from visible cards
  const visibleMax = new Map<string, number>();
  for (let rIdx = 0; rIdx < hand.length; rIdx++) {
    for (let colIdx = 0; colIdx < 4; colIdx++) {
      const c = hand[rIdx][colIdx];
      if (!c) continue;
      if (!isVisible(rIdx, colIdx)) continue;
      const val = rankValue(c.rank);
      const cur = visibleMax.get(c.suite);
      if (cur === undefined || val > cur) visibleMax.set(c.suite, val);
    }
  }

  return hand.map((row, rIdx) =>
    row.map((c, colIdx) => {
      if (!c) return false;
      if (!isVisible(rIdx, colIdx)) return false; // can't remove if blocked
      const val = rankValue(c.rank);
      const maxVisible = visibleMax.get(c.suite);
      if (maxVisible === undefined) return false;
      return val < maxVisible;
    }),
  );
})();
  // remove at row/col only if removable per the above rules
const removeAt = (rowIndex: number, colIndex: number) => {
  if (rowIndex < 0 || rowIndex >= hand.length) return { removed: null, allowed: false };
  if (colIndex < 0 || colIndex >= 4) return { removed: null, allowed: false };

  const lastRowIndex = Math.max(0, hand.length - 1);
  
  // Check if a card is visible (not blocked by a card below)
  const isVisible = (rIdx: number, colIdx: number): boolean => {
    if (rIdx === lastRowIndex) return true;
    const below = hand[rIdx + 1]?.[colIdx] ?? null;
    return below == null;
  };

  // Compute max only from visible cards
  const visibleMax = new Map<string, number>();
  for (let rIdx = 0; rIdx < hand.length; rIdx++) {
    for (let colIdx = 0; colIdx < 4; colIdx++) {
      const c = hand[rIdx][colIdx];
      if (!c) continue;
      if (!isVisible(rIdx, colIdx)) continue;
      const val = rankValue(c.rank);
      const cur = visibleMax.get(c.suite);
      if (cur === undefined || val > cur) visibleMax.set(c.suite, val);
    }
  }

  const c = hand[rowIndex][colIndex];
  if (!c) return { removed: null, allowed: false };
  if (!isVisible(rowIndex, colIndex)) return { removed: null, allowed: false };

  const val = rankValue(c.rank);
  const maxVisible = visibleMax.get(c.suite);
  if (maxVisible === undefined || val >= maxVisible) return { removed: null, allowed: false };

  const newHand = hand.map((r) => r.slice());
  newHand[rowIndex][colIndex] = null;
  setHand(newHand);
  setRemovedIds((prev) => new Set([...prev, c.id]));
  return { removed: c, allowed: true };
};

  // pruneLowerSameSuit now only nulls lower cards in the last row (keeps other rows intact)
const pruneLowerSameSuit = () => {
  const lastRowIndex = Math.max(0, hand.length - 1);
  const lastRow = hand[lastRowIndex] ?? [null, null, null, null];

  const lastRowMax = new Map<string, number>();
  for (const c of lastRow) {
    if (!c) continue;
    const v = rankValue(c.rank);
    const cur = lastRowMax.get(c.suite);
    if (cur === undefined || v > cur) lastRowMax.set(c.suite, v);
  }

  const newHand = hand.map((row, rIdx) =>
    row.map((c) => {
      if (!c) return null;
      if (rIdx !== lastRowIndex) return c;
      const v = rankValue(c.rank);
      return v < (lastRowMax.get(c.suite) ?? v) ? null : c;
    }),
  );

  const removed = hand.flat().filter((c, idx) => c && newHand.flat()[idx] == null) as Card[];
  setHand(newHand);
  setRemovedIds((prev) => new Set([...prev, ...removed.map((c) => c.id)]));
  return { kept: newHand, removed };
};
const restart = () => {
  setRemovedIds(new Set());
  setReserveCard(null);
  setHand(() => {
    const remaining = shuffle(makeDeck());
    const selected: Array<Card | null> = [null, null, null, null];
    for (let i = 0; i < 4 && i < remaining.length; i++) selected[i] = remaining[i];
    return [selected];
  });
};

  return {
    hand, // array of rows (Array<Array<Card|null>>)
    reserveCard,
    deal,
    dealFour,
    dealRemainingFromDeck,
    dealFourNew,
    reset,
    restart,
    pruneLowerSameSuit,
    removableFlags,
    removeAt,
    moveCard,
    moveCardToReserve,
    moveReserveToTopSlot,
    computeMaxPerSuit,
    removedIds,
    hasStartedGame: hand.some((row) => row.some((c) => c !== null)),
    totalCardsLeft: 52 - unavailableIdSet().size,
  };
}
