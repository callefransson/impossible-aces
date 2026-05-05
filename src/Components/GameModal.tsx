import { useEffect, useState, type CSSProperties } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import "../css/GameModal.css";

export type GameEndState = {
  kind: "win" | "lose";
  title: string;
  description?: string;
  tone: "win" | "lose";
};

type GameEndModalProps = {
  endState: GameEndState | null;
  loadNewGame: () => void;
  canInspectImpossible?: boolean;
  onInspectImpossible?: () => void;
  summaryItems?: Array<{
    label: string;
    value: string | number;
  }>;
};

const celebrationBursts = [
  {
    symbol: "\u2660",
    color: "black",
    x: "-140px",
    y: "-118px",
    delay: "0ms",
    duration: "1120ms",
    rotate: "-22deg",
  },
  {
    symbol: "\u2665",
    color: "red",
    x: "-72px",
    y: "-188px",
    delay: "80ms",
    duration: "1180ms",
    rotate: "18deg",
  },
  {
    symbol: "\u2663",
    color: "black",
    x: "0px",
    y: "-220px",
    delay: "35ms",
    duration: "1020ms",
    rotate: "-8deg",
  },
  {
    symbol: "\u2666",
    color: "red",
    x: "82px",
    y: "-184px",
    delay: "120ms",
    duration: "1160ms",
    rotate: "20deg",
  },
  {
    symbol: "\u2665",
    color: "red",
    x: "146px",
    y: "-112px",
    delay: "150ms",
    duration: "1080ms",
    rotate: "-16deg",
  },
  {
    symbol: "\u2663",
    color: "black",
    x: "-104px",
    y: "-44px",
    delay: "105ms",
    duration: "990ms",
    rotate: "12deg",
  },
] as const;

type BurstStyle = CSSProperties &
  Record<
    | "--burst-x"
    | "--burst-y"
    | "--burst-delay"
    | "--burst-duration"
    | "--burst-rotate",
    string
  >;

export default function GameEndModal({
  endState,
  loadNewGame,
  canInspectImpossible = false,
  onInspectImpossible,
  summaryItems = [],
}: GameEndModalProps) {
  const [modal, setModal] = useState<GameEndState | null>(null);
  const [showWinCelebration, setShowWinCelebration] = useState(false);

  useEffect(() => {
    if (!endState) {
      setModal(null);
      setShowWinCelebration(false);
      return;
    }

    setModal(null);
    setShowWinCelebration(false);

    if (endState.kind === "lose") {
      navigator.vibrate?.(30);
      const timeoutId = window.setTimeout(() => {
        setModal(endState);
      }, 450);
      return () => window.clearTimeout(timeoutId);
    }

    navigator.vibrate?.([22, 28, 42]);
    setShowWinCelebration(true);
    const timeoutId = window.setTimeout(() => {
      setShowWinCelebration(false);
      setModal(endState);
    }, 1200);
    return () => {
      window.clearTimeout(timeoutId);
      setShowWinCelebration(false);
    };
  }, [endState]);

  const open = modal !== null;
  const handlePlayAgain = () => {
    setModal(null);
    loadNewGame();
  };

  return (
    <div className="dialog-container">
      {showWinCelebration ? (
        <div className="win-burst" aria-hidden="true">
          <div className="win-burst__glow" />
          {celebrationBursts.map((burst, index) => (
            <div
              className={`win-burst__card win-burst__card--${burst.color}`}
              key={`${burst.symbol}-${index}`}
              style={
                {
                  "--burst-x": burst.x,
                  "--burst-y": burst.y,
                  "--burst-delay": burst.delay,
                  "--burst-duration": burst.duration,
                  "--burst-rotate": burst.rotate,
                } as BurstStyle
              }
            >
              <span className="win-burst__card-rank">A</span>
              <span className="win-burst__card-suit">{burst.symbol}</span>
            </div>
          ))}
        </div>
      ) : null}
      <Dialog.Root
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setModal(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="gem-overlay" />
          <Dialog.Content
            className={`gem-content ${modal ? `gem-content--${modal.tone}` : ""}`}
          >
            <div className="gem-badge" aria-hidden="true">
              {modal?.tone === "win" ? "Victory" : "Round Over"}
            </div>
            <Dialog.Title className="gem-title">{modal?.title}</Dialog.Title>

            {modal?.description ? (
              <Dialog.Description className="gem-description">
                {modal.description}
              </Dialog.Description>
            ) : null}

            {summaryItems.length > 0 ? (
              <div className="gem-summary" aria-label="Round summary">
                {summaryItems.map((item) => (
                  <div className="gem-summary-item" key={item.label}>
                    <span className="gem-summary-label">{item.label}</span>
                    <span className="gem-summary-value">{item.value}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="gem-actions">
              {canInspectImpossible && onInspectImpossible ? (
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="gem-button gem-button--secondary"
                    onClick={onInspectImpossible}
                  >
                    Inspect board
                  </button>
                </Dialog.Close>
              ) : null}
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="gem-button gem-button--primary"
                  onClick={handlePlayAgain}
                >
                  New round
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
