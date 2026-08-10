import { IconButton } from "@radix-ui/themes";
import {
  BarChartIcon,
  Cross2Icon,
  GearIcon,
  HamburgerMenuIcon,
  QuestionMarkIcon,
} from "@radix-ui/react-icons";
import "../css/Settings.css";
import HowToPlay from "./HowToPlay";
import { GAME_MODE_LABELS, type GameMode } from "./GameModeDialog";
import Settings, { type GameSettings } from "./Settings";
import Stats, { type DailyStreakStats, type GameStats } from "./Stats";
import { useState } from "react";

export type ToolbarDialog = "stats" | "settings" | "howTo" | null;

function GameToolbar({
  settings,
  onSettingsChange,
  stats,
  dailyStreak,
  gameMode,
  onResetStats,
  activeDialog,
  onActiveDialogChange,
  onOpenModeDialog,
}: {
  settings: GameSettings;
  onSettingsChange: (next: GameSettings) => void;
  stats: GameStats;
  dailyStreak: DailyStreakStats;
  gameMode: GameMode;
  onResetStats: () => void;
  activeDialog: ToolbarDialog;
  onActiveDialogChange: (dialog: ToolbarDialog) => void;
  onOpenModeDialog: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const openDialog = (dialog: Exclude<ToolbarDialog, null>) => {
    setMenuOpen(false);
    onActiveDialogChange(dialog);
  };

  return (
    <>
      <div className="settings-section">
        <div className="desktop-toolbar-actions">
          <IconButton
            className="settings-btn"
            color="mint"
            variant="soft"
            onClick={() => onActiveDialogChange("stats")}
            aria-label="Open stats"
          >
            <BarChartIcon width="22" height="22" />
          </IconButton>
          <IconButton
            className="settings-btn"
            color="mint"
            variant="soft"
            onClick={() => onActiveDialogChange("settings")}
            aria-label="Open settings"
          >
            <GearIcon width="22" height="22" />
          </IconButton>
          <IconButton
            className="settings-btn"
            color="mint"
            variant="soft"
            onClick={() => onActiveDialogChange("howTo")}
            aria-label="Open how to play"
          >
            <QuestionMarkIcon width="22" height="22" />
          </IconButton>
        </div>

        <IconButton
          className="settings-btn menu-toggle"
          color="mint"
          variant="soft"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
        >
          <HamburgerMenuIcon width="24" height="24" />
        </IconButton>
      </div>

      <div
        className={`app-menu-backdrop ${menuOpen ? "app-menu-backdrop--open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`app-menu-panel ${menuOpen ? "app-menu-panel--open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="app-menu-header">
          <div>
            <div className="app-menu-title">Menu</div>
            <div className="app-menu-subtitle">{GAME_MODE_LABELS[gameMode]}</div>
          </div>
          <IconButton
            className="settings-btn app-menu-close"
            color="gray"
            variant="soft"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <Cross2Icon width="20" height="20" />
          </IconButton>
        </div>

        <div className="app-menu-actions">
          <button
            type="button"
            className="app-menu-item"
            onClick={() => openDialog("settings")}
          >
            <GearIcon width="20" height="20" />
            <span>Settings</span>
          </button>
          <button
            type="button"
            className="app-menu-item"
            onClick={() => openDialog("stats")}
          >
            <BarChartIcon width="20" height="20" />
            <span>Stats</span>
          </button>
          <button
            type="button"
            className="app-menu-item"
            onClick={() => openDialog("howTo")}
          >
            <QuestionMarkIcon width="20" height="20" />
            <span>How to play</span>
          </button>
          <button
            type="button"
            className="app-menu-item app-menu-item--mode"
            onClick={() => {
              setMenuOpen(false);
              onOpenModeDialog();
            }}
          >
            <span>Game mode</span>
            <strong>{GAME_MODE_LABELS[gameMode]}</strong>
          </button>
        </div>
      </aside>

      <HowToPlay
        open={activeDialog === "howTo"}
        onOpenChange={(open) => onActiveDialogChange(open ? "howTo" : null)}
        mode={gameMode}
      />
      <Stats
        open={activeDialog === "stats"}
        onOpenChange={(open) => onActiveDialogChange(open ? "stats" : null)}
        stats={stats}
        dailyStreak={dailyStreak}
        mode={gameMode}
        onResetStats={onResetStats}
      />
      <Settings
        open={activeDialog === "settings"}
        onOpenChange={(open) => onActiveDialogChange(open ? "settings" : null)}
        settings={settings}
        onSettingsChange={onSettingsChange}
        gameMode={gameMode}
      />
    </>
  );
}

export default GameToolbar;
