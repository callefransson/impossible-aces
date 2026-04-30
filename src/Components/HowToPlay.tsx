import React from "react";
import { Dialog, Card, Button, Heading, Text, Flex } from "@radix-ui/themes";
import helpGif from "../assets/HowToPlayImpossibleAcesGameNewDesign.gif";
import "../css/App.css";

export default function HowToPlay({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="how-to-play-dialog">
        <Card>
          <Flex direction="column" gap="3">
            <Heading size="4">How to play</Heading>

            <img
              className="how-to-play-gif"
              src={helpGif}
              alt="How to play the game"
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
