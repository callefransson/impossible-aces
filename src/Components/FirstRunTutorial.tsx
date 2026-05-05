import { Dialog } from "@radix-ui/themes";

type FirstRunTutorialProps = {
  open: boolean;
  onDone: () => void;
};

const tutorialSteps = [
  {
    label: "Goal",
    title: "Build the Ace row",
    body: "Clear the board until only the four Aces remain in the top row.",
  },
  {
    label: "Remove",
    title: "Tap lower cards away",
    body: "A visible card can be removed when a higher card of the same suit is visible.",
  },
  {
    label: "Move",
    title: "Use empty top slots",
    body: "Move a bottom card into an empty top slot. In Strategic Reserve, you can park one card on the side.",
  },
];

export default function FirstRunTutorial({
  open,
  onDone,
}: FirstRunTutorialProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onDone();
      }}
    >
      <Dialog.Content className="first-run-dialog">
        <div className="first-run-layout">
          <div className="first-run-preview" aria-hidden="true">
            <div className="first-run-card first-run-card--ace">A</div>
            <div className="first-run-card first-run-card--low">3</div>
            <div className="first-run-slot" />
            <div className="first-run-card first-run-card--high">K</div>
          </div>

          <div className="first-run-copy">
            <Dialog.Title className="first-run-title">
              Impossible Aces
            </Dialog.Title>
            <Dialog.Description className="first-run-description">
              A quick start before your first round.
            </Dialog.Description>

            <div className="first-run-steps">
              {tutorialSteps.map((step, index) => (
                <div className="first-run-step" key={step.label}>
                  <div className="first-run-step-index">{index + 1}</div>
                  <div>
                    <div className="first-run-step-label">{step.label}</div>
                    <div className="first-run-step-title">{step.title}</div>
                    <div className="first-run-step-body">{step.body}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="first-run-actions">
              <button
                type="button"
                className="first-run-button first-run-button--primary"
                onClick={onDone}
              >
                Start playing
              </button>
            </div>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
