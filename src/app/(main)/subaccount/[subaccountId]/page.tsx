import BlurPage from "@/components/global/blur-page";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { getSubaccountTotalFunnelPages } from "@/lib/queries";
import { AreaChart, BadgeDelta } from "@tremor/react";
import {
  ClipboardIcon,
  Contact2,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import React from "react";

type Props = {
  params: { subaccountId: string };
  searchParams: {
    code: string;
  };
};

const SubaccountPageId = async ({ params, searchParams }: Props) => {
  let currency = "INR";
  let sessions;
  let totalClosedSessions;
  let totalPendingSessions;
  let net = 0;
  let potentialIncome = 0;
  let closingRate = 0;

  const subaccountDetails = await db.subAccount.findUnique({
    where: {
      id: params.subaccountId,
    },
  });

  const totalVisits = await db.funnelPage.aggregate({
    _sum: {
      visits: true,
    },
    where: {
      Funnel: {
        subAccountId:params.subaccountId,
      },
    },
  });

  const currentYear = new Date().getFullYear();
  const startDate = new Date(`${currentYear}-01-01T00:00:00Z`).getTime() / 1000;
  const endDate = new Date(`${currentYear}-12-31T23:59:59Z`).getTime() / 1000;

  if (!subaccountDetails) return;



  const funnels = await db.funnel.findMany({
    where: {
      subAccountId: params.subaccountId,
    },
    include: {
      FunnelPages: true,
    },
  });

  const funnelPerformanceMetrics = funnels.map((funnel) => ({
    ...funnel,
    totalFunnelVisits: funnel.FunnelPages.reduce(
      (total, page) => total + page.visits,
      0
    ),
  }));

  const subaccountStats = await getSubaccountTotalFunnelPages(params.subaccountId)

  return (
    <BlurPage>
      <div className="relative h-full">
        <div className="flex flex-col gap-4 pb-6">
          <div className="flex gap-4 flex-col xl:!flex-row">
          <Card className="flex-1 relative">
              <CardHeader>
              <CardDescription>Total No of page visits</CardDescription>
              <CardTitle className="text-4xl">{totalVisits._sum.visits ?? 0}</CardTitle>
              </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                          Reflects the number of pages created by every subaccount user.
                </CardContent>
              <Contact2 className="absolute right-4 top-4 text-muted-foreground" />
            </Card>
            
          </div>

          <div className="flex gap-4 flex-col xl:!flex-row">
            <Card className="flex-1 relative">
              <CardHeader>
              <CardDescription>Total Pages Created across all Subaccounts</CardDescription>
              <CardTitle className="text-4xl">{subaccountStats.totalFunnelPages}</CardTitle>
              </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                          Reflects the number of pages created by every subaccount user.
                </CardContent>
              <Contact2 className="absolute right-4 top-4 text-muted-foreground" />
            </Card>
          </div>
          <div className="flex gap-4 xl:!flex-row flex-col">
            {/*<Card className="p-4 flex-1 h-[450px] overflow-scroll relative">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Transition History
                  <BadgeDelta
                    className="rounded-xl bg-transparent"
                    deltaType="moderateIncrease"
                    isIncreasePositive={true}
                    size="xs"
                  >
                    +12.3%
                  </BadgeDelta>
                </CardTitle>
              </CardHeader>
            </Card>*/}
          </div>
        </div>
      </div>
    </BlurPage>
  );
};

export default SubaccountPageId;