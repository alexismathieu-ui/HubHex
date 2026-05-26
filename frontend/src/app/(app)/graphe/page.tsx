"use client";

import { HubHexGraphPanel } from "../../../components/graph/HubHexGraphPanel";
import { useAuth } from "../../../context/AuthContext";

export default function GraphePage() {
  const { token, currentUser } = useAuth();
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-100">Graphe HubHex</h1>
      <p className="mt-1 text-sm text-slate-400">
        Relations entre vos depots : meme techno, inspiration, suite logique.
      </p>
      <div className="mt-6">
        <HubHexGraphPanel token={token} username={currentUser?.username ?? ""} />
      </div>
    </div>
  );
}
