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
import VolumeSlider from "./VolumeSlider";
export type CardStyle = "classic" | "largeSymbols";
export type GameSettings = {
  removableCard: boolean;
  disableDealButton: boolean;
  enableSound: boolean;
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
    localStorage.setItem("gameSettings", JSON.stringify(draft));
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
                      that will indicate it is removable. For a better game
                      experience, it is recommended to keep this disabled.
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
                        <b>Disable deal button when moves still are possible</b>
                      </Text>
                    </Flex>

                    <Text size="1">
                      When checked, the deal button will be disabled if there
                      are still possible moves to make. Prevents players to
                      accidentally deal new cards when they still have moves
                      left.
                    </Text>
                  </Flex>
                </CheckboxCards.Item>
              </CheckboxCards.Root>
              <CheckboxCards.Root
                color="green"
                size="2"
                value={draft.enableSound ? ["on"] : []}
                onValueChange={(vals) =>
                  setSetting("enableSound", vals.includes("on"))
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
                        <b>Enable sound</b>
                      </Text>
                    </Flex>

                    <Text size="1">
                      When checked, sound effects will be enabled.
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
              {draft.enableSound && <VolumeSlider />}
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
