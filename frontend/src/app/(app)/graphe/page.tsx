"use client";

import { HubHexGraphPanel } from "../../../components/graph/HubHexGraphPanel";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useAuth } from "../../../context/AuthContext";

export default function GraphePage() {
  const { token, currentUser } = useAuth();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        kicker="// capitalisation"
        title="Graphe HubHex"
        description="Relations entre vos depots : meme techno, inspiration, suite logique."
      />
      <HubHexGraphPanel token={token} username={currentUser?.username ?? ""} />
    </div>
  );
}
