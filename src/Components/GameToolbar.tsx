import React from "react";
import { IconButton } from "@radix-ui/themes";
import { BarChartIcon, GearIcon, QuestionMarkIcon } from "@radix-ui/react-icons";
import "../css/Settings.css";
import HowToPlay from "./HowToPlay";
import type { GameMode } from "./GameModeDialog";
import Settings, { type GameSettings } from "./Settings";
import Stats, { type GameStats } from "./Stats";

export type ToolbarDialog = "stats" | "settings" | "howTo" | null;

function GameToolbar({
  settings,
  onSettingsChange,
  stats,
  gameMode,
  onResetStats,
  activeDialog,
  onActiveDialogChange,
}: {
  settings: GameSettings;
  onSettingsChange: (next: GameSettings) => void;
  stats: GameStats;
  gameMode: GameMode;
  onResetStats: () => void;
  activeDialog: ToolbarDialog;
  onActiveDialogChange: (dialog: ToolbarDialog) => void;
}) {
  return (
    <>
      <div className="settings-section">
        <IconButton
          className="settings-btn"
          color="mint"
          variant="soft"
          onClick={() => onActiveDialogChange("stats")}
        >
          <BarChartIcon width="25" height="25" />
        </IconButton>
        <IconButton
          className="settings-btn"
          color="mint"
          variant="soft"
          onClick={() => onActiveDialogChange("settings")}
        >
          <GearIcon width="25" height="25" />
        </IconButton>
        <IconButton
          className="settings-btn"
          color="mint"
          variant="soft"
          onClick={() => onActiveDialogChange("howTo")}
        >
          <QuestionMarkIcon width="25" height="25" />
        </IconButton>
      </div>
      <HowToPlay
        open={activeDialog === "howTo"}
        onOpenChange={(open) => onActiveDialogChange(open ? "howTo" : null)}
        mode={gameMode}
      />
      <Stats
        open={activeDialog === "stats"}
        onOpenChange={(open) => onActiveDialogChange(open ? "stats" : null)}
        stats={stats}
        mode={gameMode}
        onResetStats={onResetStats}
      />
      <Settings
        open={activeDialog === "settings"}
        onOpenChange={(open) => onActiveDialogChange(open ? "settings" : null)}
        settings={settings}
        onSettingsChange={onSettingsChange}
      />
    </>
  );
}

export default GameToolbar;
