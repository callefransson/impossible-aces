import React from "react";
import "../css/Cards.css";
import type { CardStyle } from "./Settings";

type CardProps = {
  suite: string; // keep your name as-is
  rank: string;
  cardStyle?: CardStyle;
  isRemovable?: boolean;
  isBlockedAce?: boolean;
  isDraggable?: boolean;
  isSelected?: boolean;
  isTouchDragging?: boolean;
  isTouchPreview?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent<HTMLButtonElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLButtonElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLButtonElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLButtonElement>) => void;
  onTouchStart?: (e: React.TouchEvent<HTMLButtonElement>) => void;
  onTouchMove?: (e: React.TouchEvent<HTMLButtonElement>) => void;
  onTouchEnd?: (e: React.TouchEvent<HTMLButtonElement>) => void;
  onTouchCancel?: (e: React.TouchEvent<HTMLButtonElement>) => void;
};

type SuitKey = "spades" | "clubs" | "hearts" | "diamonds";

const SUIT_SYMBOL: Record<SuitKey, string> = {
  spades: "♠",
  clubs: "♣",
  hearts: "♥",
  diamonds: "♦",
};

function normalizeSuit(input: string): SuitKey {
  const s = (input ?? "").toLowerCase().trim();

  // allow lots of inputs: "spade", "spades", "♠", "S", etc.
  if (s === "♠" || s === "spade" || s === "spades" || s === "s")
    return "spades";
  if (s === "♣" || s === "club" || s === "clubs" || s === "c") return "clubs";
  if (s === "♥" || s === "heart" || s === "hearts" || s === "h")
    return "hearts";
  if (s === "♦" || s === "diamond" || s === "diamonds" || s === "d")
    return "diamonds";

  // fallback: assume spades if unknown
  return "spades";
}

function normalizeRank(input: string): string {
  const r = (input ?? "").toUpperCase().trim();
  // supports "A", "K", "Q", "J", "2".."10"
  if (r === "1") return "A";
  return r;
}

// Pip positions. (Simple + clean, similar feel to your reference image.)
type PipPos = "TL" | "TR" | "ML" | "MR" | "C" | "BL" | "BR" | "MT" | "MB";

const PIP_LAYOUT: Record<string, PipPos[]> = {
  A: ["C"],
  "2": ["MT", "MB"],
  "3": ["MT", "C", "MB"],
  "4": ["TL", "TR", "BL", "BR"],
  "5": ["TL", "TR", "C", "BL", "BR"],
  "6": ["TL", "TR", "ML", "MR", "BL", "BR"],
  "7": ["TL", "TR", "ML", "C", "MR", "BL", "BR"],
  "8": ["TL", "TR", "ML", "MR", "C", "BL", "BR", "MT"],
  "9": ["TL", "TR", "ML", "MR", "C", "BL", "BR", "MT", "MB"],
  "10": ["TL", "TR", "ML", "MR", "BL", "BR", "MT", "MB", "C", "C"], // 2 center pips
};

function isFace(rank: string) {
  return rank === "J" || rank === "Q" || rank === "K";
}

export default function Cards({
  suite,
  rank,
  cardStyle = "classic",
  isRemovable = false,
  isBlockedAce = false,
  isDraggable = false,
  isSelected = false,
  isTouchDragging = false,
  isTouchPreview = false,
  onClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
}: CardProps) {
  const sKey = normalizeSuit(suite);
  const r = normalizeRank(rank);
  const suitSymbol = SUIT_SYMBOL[sKey];
  const isRed = sKey === "hearts" || sKey === "diamonds";

  const className = [
    "card",
    cardStyle === "largeSymbols" ? "card--largeSymbols" : "",
    isRed ? "card--red" : "card--black",
    isRemovable ? "removable" : "",
    isBlockedAce ? "blocked-ace" : "",
    isDraggable ? "draggable" : "",
    isSelected ? "selected" : "",
    isTouchDragging ? "touch-dragging" : "",
    isTouchPreview ? "touch-preview" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const pips = PIP_LAYOUT[r] ?? [];
  const useLargeStyle = cardStyle === "largeSymbols";
  const isInteractive = Boolean(onClick || isDraggable);

  return (
    <button
      type="button"
      className={className}
      aria-label={`${r} of ${suite}`}
      aria-pressed={isSelected || undefined}
      onClick={onClick}
      draggable={isDraggable}
      tabIndex={isInteractive ? 0 : -1}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
    >
      {/* corner TL */}
      <div className="card__corner card__corner--tl">
        <div className="card__cornerRank">{r}</div>
        <div className="card__cornerSuit">{suitSymbol}</div>
      </div>

      {/* corner BR */}
      <div className="card__corner card__corner--br">
        <div className="card__cornerRank">{r}</div>
        <div className="card__cornerSuit">{suitSymbol}</div>
      </div>

      {/* center */}
      <div className="card__center">
        {useLargeStyle ? (
          <div className="card__largeCenter">
            <div className="card__largeRank">{r}</div>
            <div className="card__largeSuit">{suitSymbol}</div>
          </div>
        ) : isFace(r) ? (
          <div className="card__face">
            <div className="card__faceRank">{r}</div>
            <div className="card__faceSuit">{suitSymbol}</div>
          </div>
        ) : (
          <div className="card__pips">
            {pips.map((pos, i) => (
              <span key={`${pos}-${i}`} className={`pip pip--${pos}`}>
                {suitSymbol}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
