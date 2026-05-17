import Cards from "./Components/Cards";
import FirstRunTutorial from "./Components/FirstRunTutorial";
import GameModeDialog, {
  GAME_MODE_LABELS,
  type GameMode,
} from "./Components/GameModeDialog";
import GameEndModal from "./Components/GameModal";
import type { GameEndState } from "./Components/GameModal";
import GameToolbar, { type ToolbarDialog } from "./Components/GameToolbar";
import type { GameSettings, ReserveUseLimit } from "./Components/Settings";
import {
  DEFAULT_GAME_STATS,
  DEFAULT_STATS_BY_MODE,
  type GameStats,
  type GameStatsByMode,
} from "./Components/Stats";
import "./css/App.css";
import useDeck, { type Card, type DeckSnapshot } from "./hooks/useDeck";
import {
  Button,
  Card as RadixCard,
  Dialog,
  Flex,
  Heading,
  Text,
} from "@radix-ui/themes";
import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_SETTINGS: GameSettings = {
  removableCard: true,
  disableDealButton: true,
  cardStyle: "classic",
  reserveUseLimit: 5,
};
const GAME_SETTINGS_KEY = "gameSettings";
const GAME_STATS_KEY = "gameStats";
const GAME_MODE_KEY = "gameMode";
const CURRENT_ROUND_KEY = "currentRound";
const FIRST_RUN_TUTORIAL_KEY = "hasSeenFirstRunTutorial";
const SMALL_SCREEN_CARD_STYLE_BREAKPOINT = 640;
const TOUCH_DRAG_THRESHOLD_PX = 8;
const CARD_SUITS = ["Hearts", "Spades", "Diamonds", "Clubs"] as const;
const CARD_RANKS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
] as const;
const CARD_IDS = new Set(
  CARD_SUITS.flatMap((suite) => CARD_RANKS.map((rank) => `${suite}-${rank}`)),
);

type HandState = Array<Array<Card | null>>;
type PendingAceReserveMove = {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
} | null;
type TouchPreview =
  | {
      source: "board";
      row: number;
      col: number;
      x: number;
      y: number;
    }
  | {
      source: "reserve";
      x: number;
      y: number;
    };
type PersistedRound = {
  version: 1;
  gameMode: GameMode;
  deck: DeckSnapshot;
  reserveUsesRemaining: number | null;
  roundStartedAt: number | null;
  roundResultRecorded: boolean;
};
type GameEndSummary = {
  label: string;
  value: string | number;
};

function trimEmptyBottomRows(rows: HandState): HandState {
  const trimmed = rows.map((row) => row.slice()) as HandState;
  while (
    trimmed.length > 1 &&
    trimmed[trimmed.length - 1].every((card) => card === null)
  ) {
    trimmed.pop();
  }
  return trimmed;
}

function serializeHand(rows: HandState): string {
  return trimEmptyBottomRows(rows)
    .map((row) => row.map((card) => card?.id ?? "_").join(","))
    .join("|");
}

function rankValue(rank: string): number {
  const map: Record<string, number> = { J: 11, Q: 12, K: 13, A: 14 };
  const n = Number(rank);
  if (!Number.isNaN(n)) return n;
  return map[rank] ?? 0;
}

function isWinningHand(rows: HandState): boolean {
  const remainingCards = rows.flat().filter(Boolean) as Card[];
  return (
    remainingCards.length === 4 &&
    rows[0]?.every((card) => card?.rank === "A") === true
  );
}

function normalizeStats(
  stats: Partial<GameStats> | null | undefined,
): GameStats {
  return { ...DEFAULT_GAME_STATS, ...(stats ?? {}) };
}

function loadGameMode(): GameMode {
  const raw = localStorage.getItem(GAME_MODE_KEY);
  return raw === "strategicReserve" ? "strategicReserve" : "impossible";
}

function loadStatsByMode(): GameStatsByMode {
  const raw = localStorage.getItem(GAME_STATS_KEY);
  if (!raw) {
    return {
      impossible: normalizeStats(null),
      strategicReserve: normalizeStats(null),
    };
  }

  try {
    const parsed = JSON.parse(raw);

    if (
      parsed &&
      typeof parsed === "object" &&
      ("impossible" in parsed || "strategicReserve" in parsed)
    ) {
      return {
        impossible: normalizeStats(parsed.impossible),
        strategicReserve: normalizeStats(parsed.strategicReserve),
      };
    }

    return {
      impossible: normalizeStats(parsed),
      strategicReserve: normalizeStats(null),
    };
  } catch {
    return {
      impossible: normalizeStats(null),
      strategicReserve: normalizeStats(null),
    };
  }
}

function getDeviceDefaultSettings(): GameSettings {
  if (
    typeof window !== "undefined" &&
    window.innerWidth <= SMALL_SCREEN_CARD_STYLE_BREAKPOINT
  ) {
    return { ...DEFAULT_SETTINGS, cardStyle: "largeSymbols" };
  }

  return DEFAULT_SETTINGS;
}

function normalizeReserveUseLimit(value: unknown): ReserveUseLimit {
  return value === 3 || value === 5 || value === 8 || value === "unlimited"
    ? value
    : DEFAULT_SETTINGS.reserveUseLimit;
}

function normalizeSettings(
  settings: Partial<GameSettings> | null | undefined,
  fallback = getDeviceDefaultSettings(),
): GameSettings {
  return {
    removableCard:
      typeof settings?.removableCard === "boolean"
        ? settings.removableCard
        : fallback.removableCard,
    disableDealButton:
      typeof settings?.disableDealButton === "boolean"
        ? settings.disableDealButton
        : fallback.disableDealButton,
    cardStyle:
      settings?.cardStyle === "classic" ||
      settings?.cardStyle === "largeSymbols"
        ? settings.cardStyle
        : fallback.cardStyle,
    reserveUseLimit: normalizeReserveUseLimit(settings?.reserveUseLimit),
  };
}

function loadSettings(): GameSettings {
  const fallback = getDeviceDefaultSettings();
  const raw = localStorage.getItem(GAME_SETTINGS_KEY);
  if (!raw) return fallback;

  try {
    return normalizeSettings(JSON.parse(raw), fallback);
  } catch {
    return fallback;
  }
}

function getInitialReserveUses(
  settings: GameSettings,
  gameMode: GameMode,
): number | null {
  if (gameMode !== "strategicReserve") return null;
  return settings.reserveUseLimit === "unlimited"
    ? null
    : settings.reserveUseLimit;
}

function isStoredCard(value: unknown): value is Card {
  if (!value || typeof value !== "object") return false;

  const card = value as Partial<Card>;
  return (
    typeof card.suite === "string" &&
    typeof card.rank === "string" &&
    typeof card.id === "string" &&
    card.id === `${card.suite}-${card.rank}` &&
    CARD_IDS.has(card.id)
  );
}

function normalizeStoredCard(value: unknown): Card | null {
  return isStoredCard(value)
    ? { suite: value.suite, rank: value.rank, id: value.id }
    : null;
}

function normalizeStoredHand(value: unknown): HandState | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 13) {
    return null;
  }

  const seenIds = new Set<string>();
  const rows = value.map((row) => {
    if (!Array.isArray(row)) return null;

    const normalizedRow = [0, 1, 2, 3].map((col) => {
      const cardValue = row[col];
      if (cardValue === null) return null;

      const card = normalizeStoredCard(cardValue);
      if (!card || seenIds.has(card.id)) return undefined;

      seenIds.add(card.id);
      return card;
    });

    return normalizedRow.some((card) => card === undefined)
      ? null
      : (normalizedRow as Array<Card | null>);
  });

  if (rows.some((row) => row === null)) return null;
  return trimEmptyBottomRows(rows as HandState);
}

function normalizeRemovedIds(
  value: unknown,
  unavailableIds: Set<string>,
): string[] {
  if (!Array.isArray(value)) return [];

  const ids = new Set<string>();
  for (const id of value) {
    if (typeof id === "string" && CARD_IDS.has(id) && !unavailableIds.has(id)) {
      ids.add(id);
    }
  }

  return [...ids];
}

function loadPersistedRound(): PersistedRound | null {
  const raw = localStorage.getItem(CURRENT_ROUND_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const gameMode =
      parsed?.gameMode === "strategicReserve"
        ? "strategicReserve"
        : "impossible";
    const hand = normalizeStoredHand(parsed?.deck?.hand);
    if (!hand) return null;

    const unavailableIds = new Set(
      hand
        .flat()
        .filter(Boolean)
        .map((card) => (card as Card).id),
    );
    const reserveCard = normalizeStoredCard(parsed?.deck?.reserveCard);
    if (reserveCard) {
      if (unavailableIds.has(reserveCard.id)) return null;
      unavailableIds.add(reserveCard.id);
    }

    const removedIds = normalizeRemovedIds(
      parsed?.deck?.removedIds,
      unavailableIds,
    );
    const hasStartedGame =
      hand.some((row) => row.some((card) => card !== null)) ||
      reserveCard !== null ||
      removedIds.length > 0;
    if (!hasStartedGame) return null;

    const roundStartedAt =
      typeof parsed?.roundStartedAt === "number" &&
      Number.isFinite(parsed.roundStartedAt)
        ? parsed.roundStartedAt
        : null;
    const hasPersistedReserveUses =
      parsed && typeof parsed === "object" && "reserveUsesRemaining" in parsed;
    const persistedReserveUses =
      typeof parsed?.reserveUsesRemaining === "number" &&
      Number.isFinite(parsed.reserveUsesRemaining) &&
      parsed.reserveUsesRemaining >= 0
        ? Math.floor(parsed.reserveUsesRemaining)
        : null;

    return {
      version: 1,
      gameMode,
      deck: { hand, reserveCard, removedIds },
      reserveUsesRemaining:
        gameMode === "strategicReserve"
          ? hasPersistedReserveUses
            ? persistedReserveUses
            : getInitialReserveUses(loadSettings(), gameMode)
          : null,
      roundStartedAt,
      roundResultRecorded: parsed?.roundResultRecorded === true,
    };
  } catch {
    return null;
  }
}

function clearPersistedRound() {
  localStorage.removeItem(CURRENT_ROUND_KEY);
}

function hasSeenFirstRunTutorial() {
  return localStorage.getItem(FIRST_RUN_TUTORIAL_KEY) === "true";
}

function formatRoundDuration(seconds: number | null): string {
  if (seconds === null) return "-";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}

function getVisibleInfo(rows: HandState) {
  const lastRowIndex = Math.max(0, rows.length - 1);
  const visibleMax = new Map<string, number>();
  const visibleFlags = rows.map((row, rowIndex) =>
    row.map((card, colIndex) => {
      if (!card) return false;
      if (rowIndex === lastRowIndex) return true;
      return (rows[rowIndex + 1]?.[colIndex] ?? null) === null;
    }),
  );

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    for (let colIndex = 0; colIndex < 4; colIndex++) {
      const card = rows[rowIndex][colIndex];
      if (!card || !visibleFlags[rowIndex][colIndex]) continue;
      const value = rankValue(card.rank);
      const current = visibleMax.get(card.suite);
      if (current === undefined || value > current) {
        visibleMax.set(card.suite, value);
      }
    }
  }

  return { visibleFlags, visibleMax };
}

function getRemovablePositions(
  rows: HandState,
): Array<{ row: number; col: number }> {
  const { visibleFlags, visibleMax } = getVisibleInfo(rows);
  const positions: Array<{ row: number; col: number }> = [];

  for (let row = 0; row < rows.length; row++) {
    for (let col = 0; col < 4; col++) {
      const card = rows[row][col];
      if (!card || !visibleFlags[row][col]) continue;
      const maxVisible = visibleMax.get(card.suite);
      if (maxVisible !== undefined && rankValue(card.rank) < maxVisible) {
        positions.push({ row, col });
      }
    }
  }

  return positions;
}

function getMovablePositions(
  rows: HandState,
): Array<{ row: number; col: number }> {
  if (!(rows[0]?.some((card) => card === null) ?? false)) return [];

  const positions: Array<{ row: number; col: number }> = [];
  for (let row = 1; row < rows.length; row++) {
    for (let col = 0; col < 4; col++) {
      const card = rows[row][col];
      if (!card) continue;

      let blockedBelow = false;
      for (let nextRow = row + 1; nextRow < rows.length; nextRow++) {
        if (rows[nextRow][col] !== null) {
          blockedBelow = true;
          break;
        }
      }

      if (!blockedBelow) positions.push({ row, col });
    }
  }

  return positions;
}

function applyRemoval(rows: HandState, row: number, col: number): HandState {
  const nextRows = rows.map((currentRow) => currentRow.slice()) as HandState;
  nextRows[row][col] = null;
  return trimEmptyBottomRows(nextRows);
}

function applyMove(
  rows: HandState,
  fromRow: number,
  fromCol: number,
  toCol: number,
): HandState {
  const nextRows = rows.map((currentRow) => currentRow.slice()) as HandState;
  nextRows[0][toCol] = nextRows[fromRow][fromCol];
  nextRows[fromRow][fromCol] = null;
  return trimEmptyBottomRows(nextRows);
}

function canStillReachWin(rows: HandState): boolean {
  const memo = new Map<string, boolean>();

  const search = (state: HandState): boolean => {
    const key = serializeHand(state);
    const cached = memo.get(key);
    if (cached !== undefined) return cached;

    if (isWinningHand(state)) {
      memo.set(key, true);
      return true;
    }

    const removablePositions = getRemovablePositions(state);
    for (const { row, col } of removablePositions) {
      if (search(applyRemoval(state, row, col))) {
        memo.set(key, true);
        return true;
      }
    }

    const emptyTopCols = [0, 1, 2, 3].filter((col) => state[0]?.[col] === null);
    const movablePositions = getMovablePositions(state);
    for (const { row, col } of movablePositions) {
      for (const targetCol of emptyTopCols) {
        if (search(applyMove(state, row, col, targetCol))) {
          memo.set(key, true);
          return true;
        }
      }
    }

    memo.set(key, false);
    return false;
  };

  return search(trimEmptyBottomRows(rows));
}

export default function App() {
  const [persistedRound] = useState<PersistedRound | null>(() =>
    loadPersistedRound(),
  );
  const [tutorialOpen, setTutorialOpen] = useState(
    () => !persistedRound && !hasSeenFirstRunTutorial(),
  );
  const {
    hand,
    dealFour,
    dealFourNew,
    reset,
    restart,
    reserveCard,
    removedIds,
    removableFlags,
    removeAt,
    moveCard,
    moveCardToReserve,
    moveReserveToTopSlot,
    totalCardsLeft,
    hasStartedGame,
  } = useDeck(persistedRound?.deck);

  const [draggedCard, setDraggedCard] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [draggedReserve, setDraggedReserve] = useState(false);
  const [placeableCols, setPlaceableCols] = useState<Set<number>>(new Set());
  const [selectedCard, setSelectedCard] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [selectedReserve, setSelectedReserve] = useState(false);
  const [toolbarDialog, setToolbarDialog] = useState<ToolbarDialog>(null);
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [pendingAceReserveMove, setPendingAceReserveMove] =
    useState<PendingAceReserveMove>(null);
  const [gameMode, setGameMode] = useState<GameMode>(() => {
    return persistedRound?.gameMode ?? loadGameMode();
  });
  const [showTeaseToast, setShowTeaseToast] = useState(false);
  const [showImpossibleReason, setShowImpossibleReason] = useState(false);
  const [isFooterExpanded, setIsFooterExpanded] = useState(true);
  const [touchPreview, setTouchPreview] = useState<TouchPreview | null>(null);
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [statsByMode, setStatsByMode] = useState<GameStatsByMode>(() =>
    loadStatsByMode(),
  );
  const [reserveUsesRemaining, setReserveUsesRemaining] = useState<
    number | null
  >(() =>
    persistedRound
      ? persistedRound.reserveUsesRemaining
      : getInitialReserveUses(settings, loadGameMode()),
  );
  const [roundStartedAt, setRoundStartedAt] = useState<number | null>(
    () => persistedRound?.roundStartedAt ?? null,
  );
  const touchDragRef = useRef<{
    row: number;
    col: number;
    moved: boolean;
    startX: number;
    startY: number;
    centerX: number;
    centerY: number;
  } | null>(null);
  const reserveTouchDragRef = useRef<{
    moved: boolean;
    startX: number;
    startY: number;
    centerX: number;
    centerY: number;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const suppressClickTimeoutRef = useRef<number | null>(null);
  const pendingTouchTapRef = useRef(false);
  const roundResultRecordedRef = useRef(
    persistedRound?.roundResultRecorded ?? false,
  );
  const teaseShownRef = useRef(false);
  const backActionRef = useRef<() => boolean>(() => false);

  const flatHand = hand.flat();
  const flatRemovable = removableFlags.flat();
  const cardsOnBoard = flatHand.filter(Boolean).length;
  const hasReserveMode = gameMode === "strategicReserve";
  const hasCompletedAceRow =
    hand[0]?.every((card) => card?.rank === "A") === true;
  const hasReserveUsesLeft =
    reserveUsesRemaining === null || reserveUsesRemaining > 0;
  const reserveUseLimitLabel =
    settings.reserveUseLimit === "unlimited" ? "∞" : settings.reserveUseLimit;
  const reserveUsesLabel =
    reserveUsesRemaining === null
      ? "∞"
      : String(Math.max(0, reserveUsesRemaining));
  const currentStats = statsByMode[gameMode] ?? DEFAULT_GAME_STATS;
  const hasMoveState =
    selectedCard !== null ||
    selectedReserve ||
    draggedCard !== null ||
    draggedReserve ||
    touchPreview !== null ||
    placeableCols.size > 0;

  // Check if a card is the bottommost card in its column
  const canDragCard = (row: number, col: number): boolean => {
    if (row === 0) return false;

    const card = hand[row]?.[col];
    if (!card) return false;

    const hasEmptyTopSlot =
      hand[0]?.some((topCard) => topCard === null) ?? false;
    if (!hasEmptyTopSlot) return false;

    // Check if there's any card below this one in the same column
    for (let r = row + 1; r < hand.length; r++) {
      if (hand[r][col] !== null) {
        return false;
      }
    }
    return true;
  };

  const canReserveCard = (row: number, col: number): boolean => {
    if (!hasReserveMode || reserveCard || row === 0) return false;
    if (hasCompletedAceRow) return false;
    if (!hasReserveUsesLeft) return false;

    const card = hand[row]?.[col];
    if (!card) return false;

    for (let r = row + 1; r < hand.length; r++) {
      if (hand[r][col] !== null) {
        return false;
      }
    }

    if (totalCardsLeft === 0) {
      const nextHand = trimEmptyBottomRows(
        hand.map((currentRow, rowIndex) =>
          currentRow.map((currentCard, colIndex) =>
            rowIndex === row && colIndex === col ? null : currentCard,
          ),
        ),
      );

      return (
        getRemovablePositions(nextHand).length > 0 ||
        getMovablePositions(nextHand).length > 0
      );
    }

    return true;
  };

  const getPlaceableCols = (): Set<number> => {
    const placeables = new Set<number>();
    for (let col = 0; col < 4; col++) {
      if (hand[0]?.[col] === null) placeables.add(col);
    }
    return placeables;
  };

  const wouldCompleteAceRow = (
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
  ): boolean => {
    const sourceCard = hand[fromRow]?.[fromCol];
    if (!sourceCard || sourceCard.rank !== "A") return false;
    if (toRow !== 0 || hand[toRow]?.[toCol]) return false;

    const nextHand = hand.map((row) => row.slice()) as HandState;
    nextHand[toRow][toCol] = sourceCard;
    nextHand[fromRow][fromCol] = null;

    return nextHand[0]?.every((card) => card?.rank === "A") === true;
  };

  const isWin = useMemo(
    () => totalCardsLeft === 0 && reserveCard === null && isWinningHand(hand),
    [hand, reserveCard, totalCardsLeft],
  );

  const hasBoardMoves = useMemo(() => {
    if (flatRemovable.some((flag) => flag)) return true;

    for (let row = 0; row < hand.length; row++) {
      for (let col = 0; col < 4; col++) {
        if (canDragCard(row, col)) return true;
      }
    }

    return false;
  }, [hand, flatRemovable, reserveCard]);

  const shouldBlockDealForMoves = settings.disableDealButton && hasBoardMoves;

  // Function to check if any moves are possible (removals, board moves, or reserve moves)
  const hasMoves = useMemo(() => {
    if (hasBoardMoves) return true;

    const hasEmptyTopSlot = hand[0]?.some((card) => card === null) ?? false;
    if (reserveCard && hasEmptyTopSlot) return true;

    for (let row = 0; row < hand.length; row++) {
      for (let col = 0; col < 4; col++) {
        if (canReserveCard(row, col)) return true;
      }
    }

    return false;
  }, [
    hand,
    hasBoardMoves,
    hasReserveMode,
    hasReserveUsesLeft,
    reserveCard,
    totalCardsLeft,
  ]);

  const isLose = useMemo(
    () => totalCardsLeft === 0 && !hasMoves && !isWin,
    [totalCardsLeft, hasMoves, isWin],
  );

  const canStillWin = useMemo(() => {
    if (totalCardsLeft !== 0 || isWin) return true;
    if (reserveCard !== null) return false;
    return canStillReachWin(hand);
  }, [hand, isWin, reserveCard, totalCardsLeft]);

  const canInspectImpossible = useMemo(
    () => isLose && !canStillWin,
    [canStillWin, isLose],
  );

  const endState = useMemo<GameEndState | null>(() => {
    if (isWin) {
      return {
        kind: "win",
        title: "Aces complete",
        description: "The board is clear and all four Aces are home.",
        tone: "win",
      };
    }

    if (isLose) {
      return {
        kind: "lose",
        title: "No moves left",
        description: canInspectImpossible
          ? "This round is locked. You can inspect the board or start fresh."
          : "The board is locked. Start a fresh round and try again.",
        tone: "lose",
      };
    }

    return null;
  }, [canInspectImpossible, isLose, isWin]);

  const completedInSeconds =
    endState && roundStartedAt !== null
      ? Math.max(1, Math.round((Date.now() - roundStartedAt) / 1000))
      : null;
  const endSummary = useMemo<GameEndSummary[]>(
    () =>
      endState
        ? [
            {
              label: "Time",
              value: formatRoundDuration(completedInSeconds),
            },
            {
              label: "Cards still in play",
              value: cardsOnBoard + (reserveCard ? 1 : 0),
            },
            {
              label: "Mode",
              value: GAME_MODE_LABELS[gameMode],
            },
          ]
        : [],
    [cardsOnBoard, completedInSeconds, endState, gameMode, reserveCard],
  );

  const handleSettingsChange = (next: GameSettings) => {
    setSettings(next);
    localStorage.setItem(GAME_SETTINGS_KEY, JSON.stringify(next));
    if (!hasStartedGame) {
      setReserveUsesRemaining(getInitialReserveUses(next, gameMode));
    }
  };

  const handleGameModeChange = (next: GameMode) => {
    setGameMode(next);
    localStorage.setItem(GAME_MODE_KEY, next);
    resetBoard(next);
  };

  const handleResetStats = () => {
    setStatsByMode((current) => {
      const next = {
        ...DEFAULT_STATS_BY_MODE,
        ...current,
        [gameMode]: normalizeStats(null),
      };
      localStorage.setItem(GAME_STATS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetBoard = (modeForReserveUses = gameMode) => {
    setShowTeaseToast(false);
    setShowImpossibleReason(false);
    clearPersistedRound();
    clearMoveState();
    setRoundStartedAt(null);
    setReserveUsesRemaining(
      getInitialReserveUses(settings, modeForReserveUses),
    );
    roundResultRecordedRef.current = false;
    teaseShownRef.current = false;
    reset();
  };

  const handleResetBoard = () => {
    if (!hasStartedGame) {
      resetBoard();
      return;
    }

    setStatsByMode((current) => {
      const next = {
        ...DEFAULT_STATS_BY_MODE,
        ...current,
        [gameMode]: {
          ...normalizeStats(current[gameMode]),
          resets: normalizeStats(current[gameMode]).resets + 1,
        },
      };
      localStorage.setItem(GAME_STATS_KEY, JSON.stringify(next));
      return next;
    });

    resetBoard();
  };

  const restartBoard = () => {
    setShowTeaseToast(false);
    setShowImpossibleReason(false);
    clearMoveState();
    setRoundStartedAt(Date.now());
    setReserveUsesRemaining(getInitialReserveUses(settings, gameMode));
    roundResultRecordedRef.current = false;
    teaseShownRef.current = false;
    restart();
  };

  const startFirstDeal = () => {
    setShowTeaseToast(false);
    setShowImpossibleReason(false);
    clearMoveState();
    setRoundStartedAt(Date.now());
    setReserveUsesRemaining(getInitialReserveUses(settings, gameMode));
    roundResultRecordedRef.current = false;
    teaseShownRef.current = false;
    dealFour();
  };

  const handleDragStart = (row: number, col: number) => {
    if (canDragCard(row, col) || canReserveCard(row, col)) {
      setDraggedCard({ row, col });
      setDraggedReserve(false);
      setSelectedCard(null);
      setSelectedReserve(false);
      setPlaceableCols(getPlaceableCols());
    }
  };

  const clearMoveState = () => {
    setDraggedCard(null);
    setDraggedReserve(false);
    setSelectedCard(null);
    setSelectedReserve(false);
    setPlaceableCols(new Set());
    setTouchPreview(null);
    touchDragRef.current = null;
    reserveTouchDragRef.current = null;
    pendingTouchTapRef.current = false;
  };

  const suppressNextClickBriefly = () => {
    suppressClickRef.current = true;

    if (suppressClickTimeoutRef.current !== null) {
      window.clearTimeout(suppressClickTimeoutRef.current);
    }

    suppressClickTimeoutRef.current = window.setTimeout(() => {
      suppressClickRef.current = false;
      suppressClickTimeoutRef.current = null;
    }, 350);
  };

  const showPlaceableCols = () => {
    setPlaceableCols(getPlaceableCols());
  };

  const dismissTutorial = () => {
    localStorage.setItem(FIRST_RUN_TUTORIAL_KEY, "true");
    setTutorialOpen(false);
  };

  const handleBackAction = () => {
    if (tutorialOpen) {
      dismissTutorial();
      return true;
    }

    if (pendingAceReserveMove) {
      setPendingAceReserveMove(null);
      return true;
    }

    if (modeDialogOpen) {
      setModeDialogOpen(false);
      return true;
    }

    if (toolbarDialog) {
      setToolbarDialog(null);
      return true;
    }

    if (hasMoveState) {
      clearMoveState();
      return true;
    }

    if (showTeaseToast) {
      setShowTeaseToast(false);
      return true;
    }

    if (hasStartedGame && !endState) {
      return !window.confirm(
        "Leave this round? Your current game will be saved.",
      );
    }

    return false;
  };

  const performReserveMove = (fromRow: number, fromCol: number) => {
    if (!canReserveCard(fromRow, fromCol)) return { moved: false };

    const moved = moveCardToReserve(fromRow, fromCol);
    if (moved.moved) {
      setReserveUsesRemaining((current) =>
        current === null ? null : Math.max(0, current - 1),
      );
      clearMoveState();
    }
    return moved;
  };

  const performBoardMove = (
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
  ) => {
    const moved = moveCard(fromRow, fromCol, toRow, toCol);
    if (moved.moved) clearMoveState();
    return moved;
  };

  const requestBoardMove = (
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
  ) => {
    if (reserveCard && wouldCompleteAceRow(fromRow, fromCol, toRow, toCol)) {
      setPendingAceReserveMove({ fromRow, fromCol, toRow, toCol });
      clearMoveState();
      return { moved: false, pendingWarning: true };
    }

    return {
      ...performBoardMove(fromRow, fromCol, toRow, toCol),
      pendingWarning: false,
    };
  };

  const continuePendingAceMove = () => {
    if (!pendingAceReserveMove) return;

    const { fromRow, fromCol, toRow, toCol } = pendingAceReserveMove;
    setPendingAceReserveMove(null);
    performBoardMove(fromRow, fromCol, toRow, toCol);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.style.opacity = "0.7";
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = "1";
  };

  const handleDrop = (
    row: number,
    col: number,
    e: React.DragEvent<HTMLDivElement>,
  ) => {
    e.preventDefault();
    e.currentTarget.style.opacity = "1";

    if (draggedReserve) {
      const moved = moveReserveToTopSlot(col);
      if (moved.moved) clearMoveState();
      return;
    }

    if (!draggedCard) return;
    if (flatHand[row * 4 + col]) return; // Target must be empty

    requestBoardMove(draggedCard.row, draggedCard.col, row, col);
  };

  const handleDragEnd = () => {
    clearMoveState();
  };

  const handleTouchStart = (
    row: number,
    col: number,
    e: React.TouchEvent<HTMLButtonElement>,
  ) => {
    if (!canDragCard(row, col) && !canReserveCard(row, col)) return;
    const touch = e.touches[0];
    if (!touch) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    touchDragRef.current = {
      row,
      col,
      moved: false,
      startX: touch.clientX,
      startY: touch.clientY,
      centerX,
      centerY,
    };
    suppressClickRef.current = false;
    pendingTouchTapRef.current = true;
    setDraggedCard({ row, col });
    showPlaceableCols();
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLButtonElement>) => {
    const touchDrag = touchDragRef.current;
    if (!touchDrag) return;

    const touch = e.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchDrag.startX;
    const deltaY = touch.clientY - touchDrag.startY;

    if (!touchDrag.moved) {
      const distance = Math.hypot(deltaX, deltaY);
      if (distance < TOUCH_DRAG_THRESHOLD_PX) return;
    }

    touchDrag.moved = true;
    suppressNextClickBriefly();
    pendingTouchTapRef.current = false;
    setTouchPreview({
      source: "board",
      row: touchDrag.row,
      col: touchDrag.col,
      x: touchDrag.centerX + deltaX,
      y: touchDrag.centerY + deltaY,
    });
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
    const touchDrag = touchDragRef.current;
    if (!touchDrag) return;

    if (!touchDrag.moved) {
      touchDragRef.current = null;
      setDraggedCard(null);
      setTouchPreview(null);
      return;
    }

    e.preventDefault();
    suppressNextClickBriefly();

    const touch = e.changedTouches[0];
    const target = document
      .elementFromPoint(touch.clientX, touch.clientY)
      ?.closest("[data-drop-row][data-drop-col], [data-reserve-slot]");

    if (target instanceof HTMLElement) {
      if (target.dataset.reserveSlot === "true") {
        performReserveMove(touchDrag.row, touchDrag.col);
      } else {
        const row = Number(target.dataset.dropRow);
        const col = Number(target.dataset.dropCol);
        if (!Number.isNaN(row) && !Number.isNaN(col)) {
          requestBoardMove(touchDrag.row, touchDrag.col, row, col);
        }
      }
    }

    if (!pendingAceReserveMove) clearMoveState();
  };

  const handleTouchCancel = () => {
    clearMoveState();
  };

  const handleSlotClick = (row: number, col: number) => {
    if (selectedReserve) {
      const moved = moveReserveToTopSlot(col);
      if (moved.moved) clearMoveState();
      return;
    }

    if (!selectedCard) return;
    if (flatHand[row * 4 + col]) return;

    requestBoardMove(selectedCard.row, selectedCard.col, row, col);
  };

  const handleCardClick = (row: number, col: number) => {
    const isTouchTap = pendingTouchTapRef.current;
    pendingTouchTapRef.current = false;

    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      if (suppressClickTimeoutRef.current !== null) {
        window.clearTimeout(suppressClickTimeoutRef.current);
        suppressClickTimeoutRef.current = null;
      }
      return;
    }

    if (selectedCard && selectedCard.row === row && selectedCard.col === col) {
      clearMoveState();
      return;
    }

    const { allowed } = removeAt(row, col);
    if (!allowed) {
      if (canDragCard(row, col) || canReserveCard(row, col)) {
        setSelectedCard({ row, col });
        setDraggedCard({ row, col });
        setSelectedReserve(false);
        showPlaceableCols();
        return;
      }

      return;
    }
    clearMoveState();
  };

  const handleReserveDragStart = () => {
    if (!reserveCard || !(hand[0]?.some((card) => card === null) ?? false)) {
      return;
    }

    setDraggedReserve(true);
    setDraggedCard(null);
    setSelectedCard(null);
    setSelectedReserve(true);
    setPlaceableCols(getPlaceableCols());
  };

  const handleReserveTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (!reserveCard || !(hand[0]?.some((card) => card === null) ?? false)) {
      return;
    }

    const touch = e.touches[0];
    if (!touch) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    reserveTouchDragRef.current = {
      moved: false,
      startX: touch.clientX,
      startY: touch.clientY,
      centerX,
      centerY,
    };
    suppressClickRef.current = false;
    pendingTouchTapRef.current = true;
    setDraggedReserve(true);
    setDraggedCard(null);
    setSelectedCard(null);
    setSelectedReserve(true);
    setPlaceableCols(getPlaceableCols());
  };

  const handleReserveTouchMove = (e: React.TouchEvent<HTMLButtonElement>) => {
    const touchDrag = reserveTouchDragRef.current;
    if (!touchDrag) return;

    const touch = e.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchDrag.startX;
    const deltaY = touch.clientY - touchDrag.startY;

    if (!touchDrag.moved) {
      const distance = Math.hypot(deltaX, deltaY);
      if (distance < TOUCH_DRAG_THRESHOLD_PX) return;
    }

    touchDrag.moved = true;
    suppressNextClickBriefly();
    pendingTouchTapRef.current = false;
    setTouchPreview({
      source: "reserve",
      x: touchDrag.centerX + deltaX,
      y: touchDrag.centerY + deltaY,
    });
    e.preventDefault();
  };

  const handleReserveTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
    const touchDrag = reserveTouchDragRef.current;
    if (!touchDrag) return;

    if (!touchDrag.moved) {
      reserveTouchDragRef.current = null;
      setDraggedReserve(false);
      setTouchPreview(null);
      return;
    }

    e.preventDefault();
    suppressNextClickBriefly();

    const touch = e.changedTouches[0];
    const target = document
      .elementFromPoint(touch.clientX, touch.clientY)
      ?.closest("[data-drop-row][data-drop-col]");

    if (target instanceof HTMLElement) {
      const row = Number(target.dataset.dropRow);
      const col = Number(target.dataset.dropCol);
      if (row === 0 && !Number.isNaN(col)) {
        moveReserveToTopSlot(col);
      }
    }

    clearMoveState();
  };

  const handleReserveTouchCancel = () => {
    clearMoveState();
  };

  const handleReserveClick = () => {
    if (!reserveCard) return;
    const isTouchTap = pendingTouchTapRef.current;
    pendingTouchTapRef.current = false;

    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      if (suppressClickTimeoutRef.current !== null) {
        window.clearTimeout(suppressClickTimeoutRef.current);
        suppressClickTimeoutRef.current = null;
      }
      return;
    }

    if (isTouchTap) {
      setSelectedReserve(true);
      setSelectedCard(null);
      setDraggedCard(null);
      setPlaceableCols(getPlaceableCols());
      return;
    }

    if (selectedReserve) {
      clearMoveState();
      return;
    }

    setSelectedReserve(true);
    setSelectedCard(null);
    setDraggedCard(null);
    setPlaceableCols(getPlaceableCols());
  };

  const handleReserveDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.style.opacity = "1";

    if (!draggedCard) return;
    performReserveMove(draggedCard.row, draggedCard.col);
  };

  const handleReserveSlotClick = () => {
    if (!selectedCard || !canReserveCard(selectedCard.row, selectedCard.col)) {
      return;
    }

    performReserveMove(selectedCard.row, selectedCard.col);
  };

  useEffect(() => {
    if (!touchPreview) return;

    const preventPageDrag = (event: TouchEvent) => {
      event.preventDefault();
    };

    document.addEventListener("touchmove", preventPageDrag, {
      passive: false,
    });

    return () => {
      document.removeEventListener("touchmove", preventPageDrag);
    };
  }, [touchPreview]);

  useEffect(() => {
    backActionRef.current = handleBackAction;
  });

  useEffect(() => {
    const guardState = { impossibleAcesBackGuard: true };
    if (!window.history.state?.impossibleAcesBackGuard) {
      window.history.pushState(guardState, "");
    }

    const handlePopState = () => {
      const handled = backActionRef.current();

      if (handled) {
        window.history.pushState(guardState, "");
        return;
      }

      window.removeEventListener("popstate", handlePopState);
      window.history.back();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (suppressClickTimeoutRef.current !== null) {
        window.clearTimeout(suppressClickTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasStartedGame || endState) {
      clearPersistedRound();
      return;
    }

    const round: PersistedRound = {
      version: 1,
      gameMode,
      deck: {
        hand: trimEmptyBottomRows(hand),
        reserveCard,
        removedIds: [...removedIds],
      },
      reserveUsesRemaining,
      roundStartedAt,
      roundResultRecorded: roundResultRecordedRef.current,
    };

    localStorage.setItem(CURRENT_ROUND_KEY, JSON.stringify(round));
  }, [
    endState,
    gameMode,
    hand,
    hasStartedGame,
    removedIds,
    reserveCard,
    reserveUsesRemaining,
    roundStartedAt,
  ]);

  useEffect(() => {
    if (
      !endState ||
      roundStartedAt === null ||
      roundResultRecordedRef.current
    ) {
      return;
    }

    const completedInSeconds = Math.max(
      1,
      Math.round((Date.now() - roundStartedAt) / 1000),
    );

    setStatsByMode((current) => {
      const currentModeStats = normalizeStats(current[gameMode]);
      const next: GameStats = {
        ...currentModeStats,
        gamesPlayed: currentModeStats.gamesPlayed + 1,
      };

      if (endState.kind === "win") {
        next.wins += 1;
        next.currentWinStreak += 1;
        next.bestWinStreak = Math.max(
          next.bestWinStreak,
          next.currentWinStreak,
        );
        next.fastestWinSeconds =
          currentModeStats.fastestWinSeconds === null
            ? completedInSeconds
            : Math.min(currentModeStats.fastestWinSeconds, completedInSeconds);
      } else {
        next.losses += 1;
        next.currentWinStreak = 0;
      }

      const nextByMode = {
        ...DEFAULT_STATS_BY_MODE,
        ...current,
        [gameMode]: next,
      };

      localStorage.setItem(GAME_STATS_KEY, JSON.stringify(nextByMode));
      return nextByMode;
    });

    roundResultRecordedRef.current = true;
  }, [canInspectImpossible, endState, gameMode, roundStartedAt]);

  useEffect(() => {
    if (
      teaseShownRef.current ||
      !hasStartedGame ||
      !!endState ||
      cardsOnBoard <= 20
    ) {
      return;
    }

    teaseShownRef.current = true;
    setShowTeaseToast(true);
  }, [cardsOnBoard, endState, hasStartedGame]);

  useEffect(() => {
    if (!showTeaseToast) return;

    const timeoutId = window.setTimeout(() => {
      setShowTeaseToast(false);
    }, 3800);

    return () => window.clearTimeout(timeoutId);
  }, [showTeaseToast]);

  return (
    <>
      <div className="app">
        <div className="app-shell">
          <div className="app-topbar">
            <GameToolbar
              settings={settings}
              onSettingsChange={handleSettingsChange}
              stats={currentStats}
              gameMode={gameMode}
              onResetStats={handleResetStats}
              activeDialog={toolbarDialog}
              onActiveDialogChange={setToolbarDialog}
              onOpenModeDialog={() => setModeDialogOpen(true)}
            />
          </div>

          <header className="app-header">
            <h1 id="game-title" className="app-heading">
              <img
                src="/impossible-aces-logo-transparent.png"
                alt=""
                className="app-title"
                aria-hidden="true"
              />
              <span>Impossible Aces</span>
            </h1>

            <div className="app-toolbar">
              <div className="toolbar-left">
                {!hasStartedGame && (
                  <button
                    className="custom-btn custom-btn-primary-light-mode"
                    onClick={startFirstDeal}
                  >
                    Start round
                  </button>
                )}

                {hasStartedGame && !isLose && (
                  <button
                    className="custom-btn custom-btn-primary-light-mode"
                    onClick={dealFourNew}
                    disabled={
                      totalCardsLeft === 0 ||
                      !!endState ||
                      shouldBlockDealForMoves
                    }
                  >
                    Deal 4 New
                  </button>
                )}

                <button
                  className="custom-btn custom-btn-reset"
                  onClick={handleResetBoard}
                >
                  Reset
                </button>

                <button
                  type="button"
                  className="mode-pill toolbar-mode-pill"
                  onClick={() => setModeDialogOpen(true)}
                >
                  <span className="status-label">
                    <strong>Mode</strong>
                  </span>
                  <span className="mode-pill-value">
                    {GAME_MODE_LABELS[gameMode]}
                  </span>
                </button>
              </div>
            </div>
          </header>

          <main className="app-main">
            <section
              className="table-area"
              aria-label="Impossible Aces game board"
            >
              <div
                className={`cardTableFrame ${
                  hasReserveMode ? "cardTableFrame--with-reserve" : ""
                }`}
                style={{ ["--rows" as any]: hand.length }}
              >
                <div className="table-cards-left" aria-label="Cards remaining">
                  <span>Cards left</span>
                  <strong>{totalCardsLeft}</strong>
                </div>

                {hasReserveMode ? (
                  <div className="reserve-area">
                    <div className="reserve-label">
                      <span>Reserve</span>
                      <small>
                        {reserveUsesLabel}/{reserveUseLimitLabel}
                      </small>
                    </div>
                    {reserveCard ? (
                      <Cards
                        suite={reserveCard.suite}
                        rank={reserveCard.rank}
                        cardStyle={settings.cardStyle}
                        isSelected={selectedReserve}
                        isTouchDragging={touchPreview?.source === "reserve"}
                        isDraggable={
                          hand[0]?.some((card) => card === null) ?? false
                        }
                        onClick={handleReserveClick}
                        onDragStart={handleReserveDragStart}
                        onDragEnd={handleDragEnd}
                        onTouchStart={handleReserveTouchStart}
                        onTouchMove={handleReserveTouchMove}
                        onTouchEnd={handleReserveTouchEnd}
                        onTouchCancel={handleReserveTouchCancel}
                      />
                    ) : (
                      <div
                        className={`reserve-slot ${
                          draggedCard &&
                          canReserveCard(draggedCard.row, draggedCard.col)
                            ? "reserve-slot--placeable"
                            : ""
                        } ${
                          hasCompletedAceRow || !hasReserveUsesLeft
                            ? "reserve-slot--disabled"
                            : ""
                        }`}
                        data-reserve-slot="true"
                        onDragOver={
                          draggedCard &&
                          canReserveCard(draggedCard.row, draggedCard.col)
                            ? handleDragOver
                            : undefined
                        }
                        onDragLeave={
                          draggedCard &&
                          canReserveCard(draggedCard.row, draggedCard.col)
                            ? handleDragLeave
                            : undefined
                        }
                        onDrop={
                          draggedCard &&
                          canReserveCard(draggedCard.row, draggedCard.col)
                            ? handleReserveDrop
                            : undefined
                        }
                        onClick={
                          selectedCard &&
                          canReserveCard(selectedCard.row, selectedCard.col)
                            ? handleReserveSlotClick
                            : undefined
                        }
                      />
                    )}
                  </div>
                ) : null}

                <div className="cardGrid">
                  {[0, 1, 2, 3].map((col) => (
                    <div key={`col-${col}`} className="cardColumn">
                      {hand.map((rowArr, row) => {
                        const c = hand[row][col];

                        if (!c) {
                          const isPlaceableSlot =
                            row === 0 && placeableCols.has(col);

                          return (
                            <div
                              key={`empty-${row}-${col}`}
                              className={`cardSlot cardSlot--empty row-${row} ${
                                isPlaceableSlot
                                  ? "cardSlot--placeable-slot placeable"
                                  : ""
                              }`}
                              data-drop-row={row}
                              data-drop-col={col}
                              onDragOver={
                                isPlaceableSlot ? handleDragOver : undefined
                              }
                              onDragLeave={
                                isPlaceableSlot ? handleDragLeave : undefined
                              }
                              onDrop={
                                isPlaceableSlot
                                  ? (e) => handleDrop(row, col, e)
                                  : undefined
                              }
                              onClick={
                                isPlaceableSlot
                                  ? () => handleSlotClick(row, col)
                                  : undefined
                              }
                            />
                          );
                        }

                        const isDraggable =
                          canDragCard(row, col) || canReserveCard(row, col);

                        return (
                          <div
                            key={`${c.id}-${row}-${col}`}
                            className={`cardWrapper row-${row}`}
                          >
                            <Cards
                              suite={c.suite}
                              rank={c.rank}
                              cardStyle={settings.cardStyle}
                              isRemovable={
                                settings.removableCard &&
                                !!removableFlags[row]?.[col]
                              }
                              isBlockedAce={
                                showImpossibleReason &&
                                c.rank === "A" &&
                                row > 0
                              }
                              isDraggable={isDraggable}
                              isSelected={
                                selectedCard?.row === row &&
                                selectedCard?.col === col
                              }
                              isTouchDragging={
                                touchPreview?.source === "board" &&
                                touchPreview.row === row &&
                                touchPreview?.col === col
                              }
                              onClick={() => handleCardClick(row, col)}
                              onDragStart={(e) => handleDragStart(row, col)}
                              onDragOver={undefined}
                              onDragLeave={undefined}
                              onDrop={undefined}
                              onDragEnd={handleDragEnd}
                              onTouchStart={(e) =>
                                handleTouchStart(row, col, e)
                              }
                              onTouchMove={handleTouchMove}
                              onTouchEnd={handleTouchEnd}
                              onTouchCancel={handleTouchCancel}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section
              className={`game-footer-panel ${
                isFooterExpanded ? "game-footer-panel--expanded" : ""
              }`}
              aria-labelledby="game-title"
            >
              <button
                type="button"
                className="game-footer-toggle"
                aria-expanded={isFooterExpanded ? "true" : "false"}
                aria-controls="game-footer-content"
                onClick={() => setIsFooterExpanded((expanded) => !expanded)}
              >
                <span>{isFooterExpanded ? "Hide info" : "Show info"}</span>
              </button>

              {isFooterExpanded ? (
                <div id="game-footer-content" className="game-footer-content">
                  <div className="game-intro">
                    <p>
                      Impossible Aces is a free online browser card game with
                      solitaire-inspired rules, puzzle card game choices, and
                      quick strategy rounds. Clear the board until only the four
                      Aces remain.
                    </p>
                  </div>

                  <div className="app-support">
                    <a
                      className="support-link"
                      href="https://ko-fi.com/impossibleaces"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Support Impossible Aces
                    </a>
                  </div>

                  <p className="app-copyright">© 2026 Impossible Aces</p>
                </div>
              ) : null}
            </section>
          </main>

          <GameEndModal
            endState={endState}
            loadNewGame={restartBoard}
            canInspectImpossible={canInspectImpossible}
            onInspectImpossible={() => setShowImpossibleReason(true)}
            summaryItems={endSummary}
          />
          <GameModeDialog
            open={modeDialogOpen}
            onOpenChange={setModeDialogOpen}
            mode={gameMode}
            onModeChange={handleGameModeChange}
          />
          <Dialog.Root
            open={pendingAceReserveMove !== null}
            onOpenChange={(open) => {
              if (!open) setPendingAceReserveMove(null);
            }}
          >
            <Dialog.Content maxWidth="420px">
              <RadixCard className="reserve-warning-card">
                <Flex direction="column" gap="3">
                  <div className="reserve-warning-icon">A</div>
                  <Heading size="4" className="reserve-warning-title">
                    Reserve card will be trapped
                  </Heading>
                  <Text size="2" className="reserve-warning-text">
                    Moving this Ace will complete the top row while a card is
                    still in reserve. That reserve card cannot return after the
                    Ace row is full, so this round will no longer be winnable.
                  </Text>

                  <Flex gap="3" justify="end" wrap="wrap">
                    <Button
                      variant="soft"
                      color="gray"
                      className="reserve-warning-secondary"
                      onClick={() => setPendingAceReserveMove(null)}
                    >
                      Cancel Ace move
                    </Button>
                    <Button
                      className="btn-light-mode reserve-warning-primary"
                      onClick={continuePendingAceMove}
                    >
                      Move Ace anyway
                    </Button>
                  </Flex>
                </Flex>
              </RadixCard>
            </Dialog.Content>
          </Dialog.Root>
          <FirstRunTutorial open={tutorialOpen} onDone={dismissTutorial} />
        </div>

        {showTeaseToast ? (
          <div className="tease-toast" role="status" aria-live="polite">
            <span>This board is getting difficult!</span>
            <button
              type="button"
              className="tease-toast-close"
              onClick={() => setShowTeaseToast(false)}
              aria-label="Dismiss message"
            >
              x
            </button>
          </div>
        ) : null}

        {touchPreview &&
          (() => {
            const previewCard =
              touchPreview.source === "reserve"
                ? reserveCard
                : hand[touchPreview.row]?.[touchPreview.col];
            if (!previewCard) return null;

            return (
              <div
                className="touch-drag-layer"
                style={{
                  left: touchPreview.x,
                  top: touchPreview.y,
                }}
              >
                <Cards
                  suite={previewCard.suite}
                  rank={previewCard.rank}
                  cardStyle={settings.cardStyle}
                  isTouchPreview
                />
              </div>
            );
          })()}
      </div>
    </>
  );
}
