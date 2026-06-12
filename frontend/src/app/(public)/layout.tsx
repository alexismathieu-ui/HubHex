import type { ReactNode } from "react";

import { PublicMarketingLayout } from "../../components/layout/PublicMarketingLayout";

export default function PublicMarketingRouteLayout({ children }: { children: ReactNode }) {
  return <PublicMarketingLayout>{children}</PublicMarketingLayout>;
}
