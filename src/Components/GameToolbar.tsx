import React from "react";
import { IconButton } from "@radix-ui/themes";
import { BarChartIcon, GearIcon, QuestionMarkIcon } from "@radix-ui/react-icons";
import "../css/Settings.css";
import HowToPlay from "./HowToPlay";
import Settings, { type GameSettings } from "./Settings";
import Stats, { type GameStats } from "./Stats";

function GameToolbar({
  settings,
  onSettingsChange,
  stats,
  onResetStats,
}: {
  settings: GameSettings;
  onSettingsChange: (next: GameSettings) => void;
  stats: GameStats;
  onResetStats: () => void;
}) {
  const [howToOpen, setHowToOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [statsOpen, setStatsOpen] = React.useState(false);
  return (
    <>
      <div className="settings-section">
        <IconButton
          className="settings-btn"
          color="mint"
          variant="soft"
          onClick={() => setStatsOpen(true)}
        >
          <BarChartIcon width="25" height="25" />
        </IconButton>
        <IconButton
          className="settings-btn"
          color="mint"
          variant="soft"
          onClick={() => setSettingsOpen(true)}
        >
          <GearIcon width="25" height="25" />
        </IconButton>
        <IconButton
          className="settings-btn"
          color="mint"
          variant="soft"
          onClick={() => setHowToOpen(true)}
        >
          <QuestionMarkIcon width="25" height="25" />
        </IconButton>
      </div>
      <HowToPlay open={howToOpen} onOpenChange={setHowToOpen} />
      <Stats
        open={statsOpen}
        onOpenChange={setStatsOpen}
        stats={stats}
        onResetStats={onResetStats}
      />
      <Settings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSettingsChange={onSettingsChange}
      />
    </>
  );
}

export default GameToolbar;
