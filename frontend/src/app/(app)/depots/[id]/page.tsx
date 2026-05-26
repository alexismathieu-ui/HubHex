"use client";

import { use } from "react";

import { DepotDetail } from "../../../../components/depots/DepotDetail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function DepotDetailPage({ params }: PageProps) {
  const { id } = use(params);
  return <DepotDetail depotId={id} />;
}
