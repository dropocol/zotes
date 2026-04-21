"use client";

import * as React from "react";
import { format, isPast, isFuture, isToday } from "date-fns";
import {
  Building2,
  MapPin,
  Globe,
  DollarSign,
  Calendar,
  Clock,
  Trash2,
  Plus,
  Users,
  Video,
  Phone,
  MapPinned,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Briefcase,
  Send,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { InterviewForm } from "./interview-form";
import {
  getJobSourceDisplayName,
  getApplicationMethodDisplayName,
  getInterviewTypeDisplayName,
  JOB_SOURCES,
  APPLICATION_METHODS,
  JOB_APPLICATION_STATUSES,
  RESPONSE_STATUSES,
} from "@/types/jobs";
import { cn } from "@/lib/utils";
import type {
  JobApplication,
  JobInterview,
  JobSource,
  ApplicationMethod,
} from "@prisma/client";
import { JobApplicationStatus, ResponseStatus } from "@prisma/client";

interface JobWithInterviews extends JobApplication {
  interviews: JobInterview[];
}

interface JobDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobWithInterviews | null;
  isCreating: boolean;
  onSave: (data: {
    jobTitle: string;
    companyName: string;
    source: JobSource;
    applicationMethod: ApplicationMethod;
    jobPostingUrl: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string;
    location: string | null;
    isRemote: boolean;
    status: JobApplicationStatus;
    responseReceived: ResponseStatus;
    notes: string | null;
    dateFound: string | null;
    dateApplied: string | null;
  }) => Promise<void>;
  onDelete: () => void;
  onUpdate: () => void;
}

// Company avatar with gradient based on company name
function CompanyAvatar({ name }: { name: string }) {
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
        "flex items-center justify-center size-12 rounded-xl bg-linear-to-br shadow-lg",
        colors[index],
      )}
    >
      <span className="text-white font-bold text-base">{initials}</span>
    </div>
  );
}

// Interview card with timeline styling
function InterviewCard({
  interview,
  onClick,
  isLast,
}: {
  interview: JobInterview;
  jobTitle: string;
  companyName: string;
  onClick: () => void;
  isLast: boolean;
}) {
  const scheduledDate = interview.scheduledAt
    ? new Date(interview.scheduledAt)
    : null;
  const isCompleted = interview.completedAt
    ? true
    : scheduledDate
      ? isPast(scheduledDate)
      : false;
  const isUpcoming = scheduledDate ? isFuture(scheduledDate) : false;
  const isTodayInterview = scheduledDate ? isToday(scheduledDate) : false;

  const typeIcons: Record<string, React.ElementType> = {
    PHONE: Phone,
    VIDEO: Video,
    ONSITE: MapPinned,
    TECHNICAL: Briefcase,
    BEHAVIORAL: Users,
    FINAL: CheckCircle2,
  };

  const Icon = typeIcons[interview.interviewType] || Briefcase;

  return (
    <div className="relative flex gap-4 group">
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "size-10 rounded-full flex items-center justify-center border-2 transition-colors",
            isCompleted
              ? "bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700"
              : isUpcoming
                ? "bg-blue-100 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700"
                : "bg-muted border-border",
          )}
        >
          <Icon
            className={cn(
              "size-4",
              isCompleted
                ? "text-emerald-600 dark:text-emerald-400"
                : isUpcoming
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-muted-foreground",
            )}
          />
        </div>
        {!isLast && (
          <div
            className={cn(
              "w-0.5 flex-1 my-2",
              isCompleted ? "bg-emerald-300 dark:bg-emerald-700" : "bg-border",
            )}
          />
        )}
      </div>

      {/* Content */}
      <div
        className={cn("flex-1 cursor-pointer", !isLast && "pb-6")}
        onClick={onClick}
      >
        <div
          className={cn(
            "p-4 rounded-xl border transition-all hover:shadow-md hover:border-primary/50",
            isTodayInterview &&
              "ring-2 ring-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20",
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
                Round {interview.roundNumber}
              </Badge>
              <span className="font-semibold text-sm">
                {getInterviewTypeDisplayName(interview.interviewType)}
              </span>
            </div>
            {isTodayInterview && (
              <Badge className="bg-blue-500 text-white text-xs">Today</Badge>
            )}
            {isCompleted && !isTodayInterview && interview.completedAt && (
              <Badge
                variant="outline"
                className="text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 text-xs"
              >
                Completed
              </Badge>
            )}
          </div>

          {scheduledDate && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {format(scheduledDate, "MMM d, yyyy")}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {format(scheduledDate, "h:mm a")}
              </div>
            </div>
          )}

          {interview.location && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
              <MapPin className="size-3.5" />
              <span className="truncate">{interview.location}</span>
            </div>
          )}

          {interview.interviewerNames && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="size-3.5" />
              <span>{interview.interviewerNames}</span>
            </div>
          )}

          {interview.notes && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {interview.notes.replace(/<[^>]*>/g, "")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Response status display helper
function ResponseStatusLabel({ status }: { status: ResponseStatus }) {
  const config = {
    YES: { label: "Yes", className: "text-emerald-600 dark:text-emerald-400" },
    NO: { label: "No", className: "text-red-600 dark:text-red-400" },
    PENDING: { label: "Pending", className: "text-amber-600 dark:text-amber-400" },
  };

  const { label, className } = config[status];
  return <span className={className}>{label}</span>;
}

export function JobDetailsSheet({
  open,
  onOpenChange,
  job,
  isCreating,
  onSave,
  onDelete,
  onUpdate,
}: JobDetailsSheetProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showInterviewForm, setShowInterviewForm] = React.useState(false);
  const [editingInterview, setEditingInterview] =
    React.useState<JobInterview | null>(null);

  const [formData, setFormData] = React.useState({
    jobTitle: "",
    companyName: "",
    source: "LINKEDIN" as JobSource,
    applicationMethod: "WEB_PORTAL" as ApplicationMethod,
    jobPostingUrl: "",
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "USD",
    location: "",
    isRemote: false,
    status: "SAVED" as JobApplicationStatus,
    responseReceived: "PENDING" as ResponseStatus,
    notes: "",
    dateFound: "",
    dateApplied: "",
  });

  // Reset form when job or open state changes
  React.useEffect(() => {
    if (open) {
      setFormData({
        jobTitle: job?.jobTitle || "",
        companyName: job?.companyName || "",
        source: job?.source || ("LINKEDIN" as JobSource),
        applicationMethod: job?.applicationMethod || ("WEB_PORTAL" as ApplicationMethod),
        jobPostingUrl: job?.jobPostingUrl || "",
        salaryMin: job?.salaryMin?.toString() || "",
        salaryMax: job?.salaryMax?.toString() || "",
        salaryCurrency: job?.salaryCurrency || "USD",
        location: job?.location || "",
        isRemote: job?.isRemote ?? false,
        status: job?.status || ("SAVED" as JobApplicationStatus),
        responseReceived: job?.responseReceived || ("PENDING" as ResponseStatus),
        notes: job?.notes || "",
        dateFound: job?.dateFound ? new Date(job.dateFound).toISOString().split("T")[0] : "",
        dateApplied: job?.dateApplied ? new Date(job.dateApplied).toISOString().split("T")[0] : "",
      });
    }
  }, [open, job]);

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      // Auto-set response received when status changes
      if (field === "status") {
        const respondedStatuses: JobApplicationStatus[] = [
          JobApplicationStatus.PHONE_SCREEN,
          JobApplicationStatus.INTERVIEW,
          JobApplicationStatus.OFFER,
          JobApplicationStatus.REJECTED,
        ];
        if (respondedStatuses.includes(value as JobApplicationStatus)) {
          next.responseReceived = ResponseStatus.YES;
        } else if (value === JobApplicationStatus.NO_RESPONSE) {
          next.responseReceived = ResponseStatus.NO;
        } else {
          next.responseReceived = ResponseStatus.PENDING;
        }
      }

      return next;
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSave({
        jobTitle: formData.jobTitle,
        companyName: formData.companyName,
        source: formData.source,
        applicationMethod: formData.applicationMethod,
        jobPostingUrl: formData.jobPostingUrl || null,
        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : null,
        salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : null,
        salaryCurrency: formData.salaryCurrency,
        location: formData.location || null,
        isRemote: formData.isRemote,
        status: formData.status,
        responseReceived: formData.responseReceived,
        notes: formData.notes || null,
        dateFound: formData.dateFound || null,
        dateApplied: formData.dateApplied || null,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving job:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleInterviewAdded = () => {
    setShowInterviewForm(false);
    setEditingInterview(null);
    onUpdate();
  };

  if (!job && !isCreating) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="w-full sm:max-w-lg overflow-y-auto p-0 flex flex-col"
          showCloseButton={false}
        >
          {/* Header */}
          <div className="relative bg-muted/30">
            {/* Actions */}
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
                          Delete Application
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Application</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this job application?
                            This action cannot be undone.
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
              <div className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 p-2.5">
                    <Briefcase className="size-5 text-white" />
                  </div>
                  <div>
                    <SheetTitle className="text-lg font-bold text-left mb-0.5">
                      Add New Job Application
                    </SheetTitle>
                    <SheetDescription className="text-sm">
                      Track a new job application
                    </SheetDescription>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Mode Header */}
            {!isCreating && (
              <div className="px-6 py-4">
                <div className="flex items-start gap-4">
                  <CompanyAvatar name={formData.companyName || "?"} />
                  <div className="flex-1 min-w-0 pt-1">
                    <SheetTitle className="text-lg font-bold text-left mb-1">
                      {formData.jobTitle || "Untitled Job"}
                    </SheetTitle>
                    <SheetDescription className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                      <Building2 className="size-4" />
                      {formData.companyName}
                    </SheetDescription>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1">
            <div className="px-6 pt-4 pb-6 space-y-4 flex-1">
              {/* Job Title & Company */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => updateField("jobTitle", e.target.value)}
                    placeholder="Senior Software Engineer"
                    required
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    placeholder="Acme Inc."
                    required
                    className="w-full"
                  />
                </div>
              </div>

              {/* Source & Application Method */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source *</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value) => updateField("source", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_SOURCES.map((source) => (
                        <SelectItem key={source} value={source}>
                          {getJobSourceDisplayName(source)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Application Method *</Label>
                  <Select
                    value={formData.applicationMethod}
                    onValueChange={(value) => updateField("applicationMethod", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPLICATION_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {getApplicationMethodDisplayName(method)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* URL & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobPostingUrl">Job Posting URL</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="jobPostingUrl"
                      type="url"
                      value={formData.jobPostingUrl}
                      onChange={(e) => updateField("jobPostingUrl", e.target.value)}
                      placeholder="https://..."
                      className="pl-9 w-full"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => updateField("location", e.target.value)}
                      placeholder="San Francisco, CA"
                      className="pl-9 w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Remote checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRemote"
                  checked={formData.isRemote}
                  onCheckedChange={(checked) => updateField("isRemote", checked as boolean)}
                />
                <Label htmlFor="isRemote" className="font-normal">
                  Remote position
                </Label>
              </div>

              {/* Salary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salaryMin">Min Salary</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="salaryMin"
                      type="number"
                      value={formData.salaryMin}
                      onChange={(e) => updateField("salaryMin", e.target.value)}
                      placeholder="100000"
                      className="pl-9 w-full"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryMax">Max Salary</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="salaryMax"
                      type="number"
                      value={formData.salaryMax}
                      onChange={(e) => updateField("salaryMax", e.target.value)}
                      placeholder="150000"
                      className="pl-9 w-full"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={formData.salaryCurrency}
                    onValueChange={(value) => updateField("salaryCurrency", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status & Response */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => updateField("status", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_APPLICATION_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status === "SAVED" ? "Saved" :
                           status === "APPLIED" ? "Applied" :
                           status === "PHONE_SCREEN" ? "Phone Screen" :
                           status === "INTERVIEW" ? "Interview" :
                           status === "OFFER" ? "Offer" :
                           status === "REJECTED" ? "Rejected" :
                           status === "WITHDRAWN" ? "Withdrawn" :
                           status === "NO_RESPONSE" ? "No Response" : status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Response Received</Label>
                  <Select
                    value={formData.responseReceived}
                    onValueChange={(value) => updateField("responseReceived", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESPONSE_STATUSES.map((response) => (
                        <SelectItem key={response} value={response}>
                          {response === "YES" ? "Yes" : response === "NO" ? "No" : "Pending"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFound">Date Found</Label>
                  <Input
                    id="dateFound"
                    type="date"
                    value={formData.dateFound}
                    onChange={(e) => updateField("dateFound", e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateApplied">Date Applied</Label>
                  <Input
                    id="dateApplied"
                    type="date"
                    value={formData.dateApplied}
                    onChange={(e) => updateField("dateApplied", e.target.value)}
                    className="w-full"
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
                  placeholder="Add any notes about this application..."
                  rows={4}
                  className="w-full"
                />
              </div>

              {/* Interviews Section - Only show in edit mode */}
              {!isCreating && job && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Interviews</span>
                      {job.interviews.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {job.interviews.length}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => {
                        setEditingInterview(null);
                        setShowInterviewForm(true);
                      }}
                    >
                      <Plus className="size-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  {job.interviews.length > 0 ? (
                    <div className="pt-2">
                      {job.interviews
                        .sort((a, b) => a.roundNumber - b.roundNumber)
                        .map((interview, index) => (
                          <InterviewCard
                            key={interview.id}
                            interview={interview}
                            jobTitle={job.jobTitle}
                            companyName={job.companyName}
                            onClick={() => {
                              setEditingInterview(interview);
                              setShowInterviewForm(true);
                            }}
                            isLast={index === job.interviews.length - 1}
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg border-dashed">
                      <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Calendar className="size-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium mb-1">No interviews yet</p>
                      <p className="text-xs text-muted-foreground">
                        Add interview details to track your progress
                      </p>
                    </div>
                  )}
                </div>
              )}
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
              <Button type="submit" disabled={isLoading || !formData.jobTitle || !formData.companyName}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isCreating ? "Create Application" : "Save Changes"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Interview Form Dialog */}
      {!isCreating && job && (
        <InterviewForm
          open={showInterviewForm}
          onOpenChange={setShowInterviewForm}
          jobApplicationId={job.id}
          interview={editingInterview}
          onSuccess={handleInterviewAdded}
        />
      )}
    </>
  );
}
