"use client";

import * as React from "react";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  Briefcase,
  Trash2,
  MoreHorizontal,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeadStatusBadge } from "./lead-status-badge";
import { LEAD_STATUSES, getLeadStatusDisplayName } from "@/types/leads";
import { cn } from "@/lib/utils";
import type { Lead, LeadStatus } from "@prisma/client";

interface LeadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  isCreating: boolean;
  onSave: (data: {
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    title: string | null;
    linkedinUrl: string | null;
    notes: string | null;
    status: LeadStatus;
  }) => Promise<void>;
  onDelete: () => void;
}

// Avatar with gradient based on name
function ContactAvatar({ name }: { name: string }) {
  const colors = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-amber-600",
    "from-pink-500 to-rose-600",
    "from-indigo-500 to-blue-600",
  ];

  const index = name.charCodeAt(0) % colors.length;
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex items-center justify-center size-14 rounded-xl bg-linear-to-br shadow-lg",
        colors[index]
      )}
    >
      <span className="text-white font-bold text-lg">{initials}</span>
    </div>
  );
}

export function LeadSheet({
  open,
  onOpenChange,
  lead,
  isCreating,
  onSave,
  onDelete,
}: LeadSheetProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    title: "",
    linkedinUrl: "",
    notes: "",
    status: "NEW" as LeadStatus,
  });

  // Reset form when lead or open state changes
  React.useEffect(() => {
    if (open) {
      setFormData({
        name: lead?.name || "",
        email: lead?.email || "",
        phone: lead?.phone || "",
        company: lead?.company || "",
        title: lead?.title || "",
        linkedinUrl: lead?.linkedinUrl || "",
        notes: lead?.notes || "",
        status: lead?.status || ("NEW" as LeadStatus),
      });
    }
  }, [open, lead]);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSave({
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        company: formData.company || null,
        title: formData.title || null,
        linkedinUrl: formData.linkedinUrl || null,
        notes: formData.notes || null,
        status: formData.status,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving lead:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-lg overflow-y-auto p-0 flex flex-col"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="relative bg-muted/30">
          <div className="absolute top-4 right-4 flex items-center gap-0.5">
            {!isCreating && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 className="size-4 mr-2" />
                        Delete Contact
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this contact? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={onDelete}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <X className="size-4" />
              </Button>
            </SheetClose>
          </div>

          {/* Create Mode Header */}
          {isCreating && (
            <div className="px-6 pt-6 pb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 p-3 shadow-lg shadow-blue-500/25">
                  <Briefcase className="size-6 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-xl font-bold text-left mb-0.5">
                    Add New Contact
                  </SheetTitle>
                  <SheetDescription className="text-sm">
                    Track a new networking contact
                  </SheetDescription>
                </div>
              </div>
            </div>
          )}

          {/* Edit Mode Header */}
          {!isCreating && (
            <div className="px-6 pt-6 pb-6">
              <div className="flex items-start gap-4">
                <ContactAvatar name={formData.name || "?"} />
                <div className="flex-1 min-w-0 pt-1">
                  <SheetTitle className="text-xl font-bold text-left mb-1">
                    {formData.name || "Unnamed"}
                  </SheetTitle>
                  <SheetDescription className="text-base font-medium text-foreground/80 flex items-center gap-2">
                    {formData.company && (
                      <>
                        <Building2 className="size-4" />
                        {formData.company}
                      </>
                    )}
                    {formData.title && formData.company && (
                      <span className="text-muted-foreground">·</span>
                    )}
                    {formData.title && (
                      <span className="text-muted-foreground">
                        {formData.title}
                      </span>
                    )}
                  </SheetDescription>
                </div>
              </div>

              {/* Status badge */}
              <div className="mt-4">
                <LeadStatusBadge status={formData.status} className="text-sm px-3 py-1" />
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="px-6 py-6 space-y-4 flex-1">
            {/* Name & Company */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => updateField("company", e.target.value)}
                  placeholder="Acme Inc."
                />
              </div>
            </div>

            {/* Title & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Engineering Manager"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => updateField("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getLeadStatusDisplayName(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="john@example.com"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+1 555 000 0000"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* LinkedIn URL */}
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="linkedinUrl"
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => updateField("linkedinUrl", e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="pl-9"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Add notes about this contact..."
                rows={6}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 border-t bg-background px-6 py-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreating ? "Create Contact" : "Save Changes"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
