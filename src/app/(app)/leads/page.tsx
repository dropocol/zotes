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

async function getLeadStats(userId: string) {
  const leads = await prisma.lead.findMany({
    where: { userId },
  });

  const total = leads.length;
  const newLeads = leads.filter((l) => l.status === "NEW").length;
  const reachedOut = leads.filter((l) => l.status === "REACHED_OUT").length;
  const inConversation = leads.filter(
    (l) => l.status === "REPLIED" || l.status === "IN_CONVERSATION"
  ).length;
  const meetingScheduled = leads.filter((l) => l.status === "MEETING_SCHEDULED").length;

  return {
    total,
    newLeads,
    reachedOut,
    inConversation,
    meetingScheduled,
  };
}

export default async function LeadsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const [initialLeads, stats] = await Promise.all([
    prisma.lead.findMany({
      where: { userId: session.user.id },
      orderBy: [{ createdAt: "desc" }],
    }),
    getLeadStats(session.user.id),
  ]);

  return (
    <DashboardLayout breadcrumbs={[{ title: "Leads", href: "/leads" }]}>
      <LeadsProvider initialLeads={initialLeads}>
        <LeadViewHeader />
        <LeadList stats={stats} />
      </LeadsProvider>
    </DashboardLayout>
  );
}
