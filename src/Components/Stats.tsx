import {
  ClockIcon,
  LightningBoltIcon,
  RocketIcon,
  CrossCircledIcon,
  StarIcon,
  BackpackIcon,
  CounterClockwiseClockIcon,
} from "@radix-ui/react-icons";
import {
  Button,
  Card,
  Dialog,
  Flex,
  Grid,
  Heading,
  Text,
} from "@radix-ui/themes";
import "../css/StatsDialog.css";
import { GAME_MODE_LABELS, type GameMode } from "./GameModeDialog";

export type GameStats = {
  gamesPlayed: number;
  wins: number;
  losses: number;
  fastestWinSeconds: number | null;
  currentWinStreak: number;
  bestWinStreak: number;
  resets: number;
};

export type GameStatsByMode = Record<GameMode, GameStats>;

export const DEFAULT_GAME_STATS: GameStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  fastestWinSeconds: null,
  currentWinStreak: 0,
  bestWinStreak: 0,
  resets: 0,
};

export const DEFAULT_STATS_BY_MODE: GameStatsByMode = {
  impossible: DEFAULT_GAME_STATS,
  strategicReserve: DEFAULT_GAME_STATS,
};

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "-";

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function winRate(stats: GameStats): string {
  if (stats.gamesPlayed === 0) return "0%";
  return `${Math.round((stats.wins / stats.gamesPlayed) * 100)}%`;
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="stats-tile">
      <Flex align="center" gap="3" justify="between">
        <div className="stats-tile-icon">{icon}</div>
        <Text size="2" className="stats-tile-label">
          {label}
        </Text>
        <Text size="5" weight="bold" className="stats-tile-value">
          {value}
        </Text>
      </Flex>
    </Card>
  );
}

export default function Stats({
  open,
  onOpenChange,
  stats,
  mode,
  onResetStats,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: GameStats;
  mode: GameMode;
  onResetStats: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="560px">
        <Card>
          <Flex direction="column" gap="4">
            <Flex
              align="center"
              justify="between"
              gap="3"
              className="stats-header"
            >
              <Heading size="5" className="stats-title">
                Stats
              </Heading>
              <Text size="2" className="stats-mode-label">
                {GAME_MODE_LABELS[mode]}
              </Text>
              <Button
                variant="soft"
                color="red"
                onClick={onResetStats}
                className="stats-reset-btn"
              >
                Reset stats
              </Button>
            </Flex>

            <Grid columns={{ initial: "1", sm: "2" }} gap="3" className="stats-grid">
              <StatTile
                icon={<RocketIcon width="18" height="18" />}
                label="Games played"
                value={stats.gamesPlayed}
              />
              <StatTile
                icon={<BackpackIcon width="18" height="18" />}
                label="Wins"
                value={stats.wins}
              />
              <StatTile
                icon={<CrossCircledIcon width="18" height="18" />}
                label="Losses"
                value={stats.losses}
              />
              <StatTile
                icon={<LightningBoltIcon width="18" height="18" />}
                label="Win rate"
                value={winRate(stats)}
              />
              <StatTile
                icon={<ClockIcon width="18" height="18" />}
                label="Fastest win"
                value={formatDuration(stats.fastestWinSeconds)}
              />
              <StatTile
                icon={<StarIcon width="18" height="18" />}
                label="Current streak"
                value={stats.currentWinStreak}
              />
              <StatTile
                icon={<StarIcon width="18" height="18" />}
                label="Best streak"
                value={stats.bestWinStreak}
              />
              <StatTile
                icon={<CounterClockwiseClockIcon width="18" height="18" />}
                label="Resets"
                value={stats.resets}
              />
            </Grid>

            <Flex justify="end" className="stats-actions">
              <Dialog.Close>
                <Button className="btn-light-mode stats-close-btn">Close</Button>
              </Dialog.Close>
            </Flex>
          </Flex>
        </Card>
      </Dialog.Content>
    </Dialog.Root>
  );
}
