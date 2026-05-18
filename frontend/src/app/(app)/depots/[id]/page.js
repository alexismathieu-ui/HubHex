"use client";

import { use } from "react";

import { DepotDetail } from "../../../../components/depots/DepotDetail";

export default function DepotDetailPage({ params }) {
  const { id } = use(params);
  return <DepotDetail depotId={id} />;
}
