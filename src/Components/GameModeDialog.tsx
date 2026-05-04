import { useEffect, useState } from "react";
import { Button, Card, Dialog, Flex, Heading, RadioCards, Text } from "@radix-ui/themes";

export type GameMode = "impossible" | "strategicReserve";

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  impossible: "Impossible",
  strategicReserve: "Strategic Reserve",
};

export default function GameModeDialog({
  open,
  onOpenChange,
  mode,
  onModeChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: GameMode;
  onModeChange: (next: GameMode) => void;
}) {
  const [draft, setDraft] = useState<GameMode>(mode);

  useEffect(() => {
    if (open) setDraft(mode);
  }, [mode, open]);

  const save = () => {
    onModeChange(draft);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="460px">
        <Card>
          <Flex direction="column" gap="3">
            <Heading size="4">Game mode</Heading>
            <RadioCards.Root
              color="green"
              value={draft}
              onValueChange={(value) => setDraft(value as GameMode)}
            >
              <RadioCards.Item value="impossible">
                <Flex direction="column" gap="1">
                  <Text size="2">
                    <b>Impossible</b>
                  </Text>
                  <Text size="1">
                    Original rules. No reserve slot, every move has to happen
                    on the board.
                  </Text>
                </Flex>
              </RadioCards.Item>

              <RadioCards.Item value="strategicReserve">
                <Flex direction="column" gap="1">
                  <Text size="2">
                    <b>Strategic Reserve</b>
                  </Text>
                  <Text size="1">
                    Adds one inactive reserve slot. A reserved card can be
                    played back into an empty top-row slot.
                  </Text>
                </Flex>
              </RadioCards.Item>
            </RadioCards.Root>

            <Dialog.Close>
              <div>
                <Button onClick={save} className="btn-light-mode">
                  Save mode
                </Button>
              </div>
            </Dialog.Close>
          </Flex>
        </Card>
      </Dialog.Content>
    </Dialog.Root>
  );
}
