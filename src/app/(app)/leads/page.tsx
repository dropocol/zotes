import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardLayout } from "@/components/dashboard-layout";
import { LeadsProvider, LeadViewHeader, LeadList } from "@/components/leads";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leads",
  description: "Track your networking contacts",
};

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const initialLeads = await prisma.lead.findMany({
    where: { userId: session.user.id },
    orderBy: [{ createdAt: "desc" }],
  });

  return (
    <DashboardLayout breadcrumbs={[{ title: "Leads", href: "/leads" }]}>
      <LeadsProvider initialLeads={initialLeads}>
        <LeadViewHeader />
        <LeadList />
      </LeadsProvider>
    </DashboardLayout>
  );
}
