import React from "react";
import { IconButton } from "@radix-ui/themes";
import { BarChartIcon, GearIcon, QuestionMarkIcon } from "@radix-ui/react-icons";
import "../css/Settings.css";
import HowToPlay from "./HowToPlay";
import type { GameMode } from "./GameModeDialog";
import Settings, { type GameSettings } from "./Settings";
import Stats, { type GameStats } from "./Stats";

function GameToolbar({
  settings,
  onSettingsChange,
  stats,
  gameMode,
  onResetStats,
}: {
  settings: GameSettings;
  onSettingsChange: (next: GameSettings) => void;
  stats: GameStats;
  gameMode: GameMode;
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
      <HowToPlay
        open={howToOpen}
        onOpenChange={setHowToOpen}
        mode={gameMode}
      />
      <Stats
        open={statsOpen}
        onOpenChange={setStatsOpen}
        stats={stats}
        mode={gameMode}
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
