import React from "react";
import { Dialog, Card, Button, Heading, Text, Flex } from "@radix-ui/themes";
import helpGif from "../assets/HowToPlayImpossibleAcesGameNewDesign.gif";
import strategicReserveGif from "../assets/StrategicReserveGamemode.gif";
import "../css/App.css";
import type { GameMode } from "./GameModeDialog";

export default function HowToPlay({
  open,
  onOpenChange,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: GameMode;
}) {
  const [activeTab, setActiveTab] = React.useState<GameMode>(mode);

  React.useEffect(() => {
    if (open) setActiveTab(mode);
  }, [mode, open]);

  React.useEffect(() => {
    [helpGif, strategicReserveGif].forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="how-to-play-dialog">
        <Card>
          <Flex direction="column" gap="3">
            <Heading size="4">How to play</Heading>

            <div className="how-to-play-tabs" role="tablist">
              <button
                type="button"
                className={`how-to-play-tab ${
                  activeTab === "impossible" ? "how-to-play-tab--active" : ""
                }`}
                onClick={() => setActiveTab("impossible")}
                role="tab"
                aria-selected={activeTab === "impossible"}
              >
                Impossible
              </button>
              <button
                type="button"
                className={`how-to-play-tab ${
                  activeTab === "strategicReserve"
                    ? "how-to-play-tab--active"
                    : ""
                }`}
                onClick={() => setActiveTab("strategicReserve")}
                role="tab"
                aria-selected={activeTab === "strategicReserve"}
              >
                Strategic Reserve
              </button>
            </div>

            {activeTab === "impossible" ? (
              <>
                <img
                  className="how-to-play-gif"
                  src={helpGif}
                  alt="How to play Impossible mode"
                />

                <Text size="2" color="gray">
                  The goal is to finish with all four Aces in the top row and no
                  other cards left in play.
                </Text>

                <Text size="2" color="gray">
                  A card can be removed if it is visible and there is another
                  visible card of the same suit with a higher rank.
                </Text>

                <Text size="2" color="gray">
                  If there is an empty slot in the top row, you can move a
                  bottommost card from any column into that slot.
                </Text>
              </>
            ) : (
              <>
                <img
                  className="how-to-play-gif"
                  src={strategicReserveGif}
                  alt="How to play Strategic Reserve mode"
                />

                <Text size="2" color="gray">
                  Strategic Reserve uses the same goal: finish with the four
                  Aces in the top row and no other cards left in play.
                </Text>

                <Text size="2" color="gray">
                  You get one reserve slot. Move a bottommost card into reserve
                  to hold it for later, then play it back into an empty slot in
                  the top row.
                </Text>

                <Text size="2" color="gray">
                  Cards already in the top row cannot be placed in reserve. Once
                  all four Aces are in the top row, the reserve slot becomes
                  disabled.
                </Text>

                <Text size="2" color="gray">
                  Try to empty the reserve before placing the final Ace. If a
                  card is still reserved when the Ace row is completed, that
                  card can no longer return to the board.
                </Text>
              </>
            )}
            <Dialog.Close>
              <div>
                <Button className="btn-light-mode ">Got it</Button>
              </div>
            </Dialog.Close>
          </Flex>
        </Card>
      </Dialog.Content>
    </Dialog.Root>
  );
}
