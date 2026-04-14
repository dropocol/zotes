"use client";

import * as React from "react";
import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadSheet } from "./lead-sheet";
import type { Lead, LeadStatus, LeadType } from "@prisma/client";

interface LeadsContextValue {
  leads: Lead[];
  isLoading: boolean;
  refreshKey: number;
  fetchLeads: () => Promise<void>;
  handleLeadClick: (lead: Lead) => void;
  showAddLead: () => void;
}

const LeadsContext = React.createContext<LeadsContextValue | null>(null);

export function useLeads() {
  const context = React.useContext(LeadsContext);
  if (!context) {
    throw new Error("useLeads must be used within a LeadsProvider");
  }
  return context;
}

interface LeadsProviderProps {
  children: React.ReactNode;
  initialLeads?: Lead[];
}

export function LeadsProvider({
  children,
  initialLeads = [],
}: LeadsProviderProps) {
  const [leads, setLeads] = React.useState<Lead[]>(initialLeads);
  const [isLoading, setIsLoading] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Sheet state
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);

  const fetchLeads = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/leads");
      if (response.ok) {
        const data = await response.json();
        setLeads(data.data || data);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsCreating(false);
    setIsSheetOpen(true);
  };

  const showAddLead = () => {
    setSelectedLead(null);
    setIsCreating(true);
    setIsSheetOpen(true);
  };

  const handleSave = async (data: {
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    title: string | null;
    linkedinUrl: string | null;
    notes: string | null;
    type: LeadType;
    status: LeadStatus;
  }) => {
    if (isCreating) {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const newLead = await response.json();
        setLeads((prev) => [newLead, ...prev]);
        setRefreshKey((k) => k + 1);
      }
    } else if (selectedLead) {
      const response = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const updatedLead = await response.json();
        setLeads((prev) =>
          prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
        );
        setRefreshKey((k) => k + 1);
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedLead) return;

    try {
      const response = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== selectedLead.id));
        setIsSheetOpen(false);
        setSelectedLead(null);
        setRefreshKey((k) => k + 1);
      }
    } catch (error) {
      console.error("Error deleting lead:", error);
    }
  };

  const contextValue: LeadsContextValue = {
    leads,
    isLoading,
    refreshKey,
    fetchLeads,
    handleLeadClick,
    showAddLead,
  };

  return (
    <LeadsContext.Provider value={contextValue}>
      {children}

      <LeadSheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) {
            setSelectedLead(null);
            setIsCreating(false);
          }
        }}
        lead={selectedLead}
        isCreating={isCreating}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </LeadsContext.Provider>
  );
}

// Header component for leads view
export function LeadViewHeader() {
  const { showAddLead } = useLeads();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 p-2.5">
          <Users className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Track your networking contacts
          </p>
        </div>
      </div>
      <Button onClick={showAddLead}>
        <Plus className="size-4 mr-2" />
        Add Contact
      </Button>
    </div>
  );
}
