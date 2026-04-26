import { notFound } from "next/navigation";
import { readTeam } from "@/lib/store";
import { LiveTracker } from "./LiveTracker";

type Props = {
  params: Promise<{ id: string }>;
};

const POSITION_ORDER: Record<string, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };

export default async function LiveTrackerPage({ params }: Props) {
  const { id } = await params;
  const data = await readTeam();
  const match = data.matches.find((m) => m.id === id);
  if (!match) notFound();

  const players = [...data.players].sort(
    (a, b) =>
      POSITION_ORDER[a.position] - POSITION_ORDER[b.position] ||
      a.number - b.number,
  );

  return <LiveTracker match={match} players={players} />;
}
