import React, { useEffect, useState } from "react";
import {
  Dialog,
  Card,
  Button,
  Heading,
  Text,
  Flex,
  CheckboxCards,
  RadioCards,
} from "@radix-ui/themes";

import "../css/SettingsDialog.css";
export type CardStyle = "classic" | "largeSymbols";
export type GameSettings = {
  removableCard: boolean;
  disableDealButton: boolean;
  cardStyle: CardStyle;
};
export default function Settings({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: GameSettings;
  onSettingsChange: (next: GameSettings) => void;
}) {
  const [draft, setDraft] = useState<GameSettings>(settings);
  const setSetting = <K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K],
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };
  useEffect(() => {
    if (open) setDraft(settings);
  }, [open, settings]);

  const save = () => {
    onSettingsChange(draft);
    onOpenChange(false);
  };
  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content maxWidth="420px">
          <Card>
            <Flex direction="column" gap="3">
              <Heading size="4">Settings</Heading>
              <CheckboxCards.Root
                color="green"
                size="2"
                value={draft.removableCard ? ["on"] : []}
                onValueChange={(vals) =>
                  setSetting("removableCard", vals.includes("on"))
                }
              >
                <CheckboxCards.Item
                  value="on"
                  className="removableCard"
                  style={{ cursor: "pointer" }}
                >
                  <Flex direction="column" gap="1" style={{ width: "100%" }}>
                    <Flex align="center" justify="between" gap="2">
                      <Text size="2" className="removableCardTitle">
                        <b>See card to remove</b>
                      </Text>
                    </Flex>

                    <Text size="1" className="removableCardHint">
                      When checked, a green border will appear around the card
                      that will indicate it is removable. Turn this off for a
                      tougher game.
                    </Text>
                  </Flex>
                </CheckboxCards.Item>
              </CheckboxCards.Root>
              <CheckboxCards.Root
                color="green"
                size="2"
                value={draft.disableDealButton ? ["on"] : []}
                onValueChange={(vals) =>
                  setSetting("disableDealButton", vals.includes("on"))
                }
              >
                <CheckboxCards.Item
                  value="on"
                  className="removableCard"
                  style={{ cursor: "pointer" }}
                >
                  <Flex direction="column" gap="1" style={{ width: "100%" }}>
                    <Flex align="center" justify="between" gap="2">
                      <Text size="2" className="removableCardTitle">
                        <b>Disable deal button when board moves are possible</b>
                      </Text>
                    </Flex>

                    <Text size="1">
                      When checked, the deal button will be disabled if there
                      are still cards to remove or move into empty top-row
                      spaces. Reserve-slot moves stay optional.
                    </Text>
                  </Flex>
                </CheckboxCards.Item>
              </CheckboxCards.Root>
              <RadioCards.Root
                color="green"
                columns="2"
                value={draft.cardStyle}
                onValueChange={(value) =>
                  setSetting("cardStyle", value as CardStyle)
                }
              >
                <RadioCards.Item value="classic">
                  <Flex direction="column" gap="1">
                    <Text size="2">
                      <b>Classic cards</b>
                    </Text>
                    <Text size="1">
                      Current deck layout with pips in the middle.
                    </Text>
                  </Flex>
                </RadioCards.Item>
                <RadioCards.Item value="largeSymbols">
                  <Flex direction="column" gap="1">
                    <Text size="2">
                      <b>Big symbols</b>
                    </Text>
                    <Text size="1">
                      Larger rank and suit in the center for easier reading.
                    </Text>
                  </Flex>
                </RadioCards.Item>
              </RadioCards.Root>
              <Dialog.Close>
                <div>
                  <Button onClick={save} className="btn-light-mode ">
                    Save
                  </Button>
                </div>
              </Dialog.Close>
            </Flex>
          </Card>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
