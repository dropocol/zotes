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
  ExternalLink,
  Pencil,
  Trash2,
  Plus,
  Users,
  Video,
  Phone,
  MapPinned,
  FileText,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Briefcase,
  Send,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { StatusBadge } from "../shared/status-badge";
import { SourceIcon } from "../shared/source-icon";
import { InterviewForm } from "./interview-form";
import {
  getJobSourceDisplayName,
  getApplicationMethodDisplayName,
  formatSalary,
  getInterviewTypeDisplayName,
} from "@/types/jobs";
import { cn } from "@/lib/utils";
import type {
  JobApplication,
  JobInterview,
  ResponseStatus,
} from "@prisma/client";

interface JobWithInterviews extends JobApplication {
  interviews: JobInterview[];
}

interface JobDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobWithInterviews | null;
  onEdit: () => void;
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
        "flex items-center justify-center size-14 rounded-xl bg-linear-to-br shadow-lg",
        colors[index],
      )}
    >
      <span className="text-white font-bold text-lg">{initials}</span>
    </div>
  );
}

// Response status indicator
function ResponseIndicator({ status }: { status: ResponseStatus }) {
  const config = {
    YES: {
      icon: CheckCircle2,
      label: "Response Received",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    NO: {
      icon: XCircle,
      label: "No Response",
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/30",
    },
    PENDING: {
      icon: AlertCircle,
      label: "Awaiting Response",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
  };

  const { icon: Icon, label, color, bg } = config[status];

  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md", bg)}>
      <Icon className={cn("size-3.5", color)} />
      <span className={cn("text-xs font-medium", color)}>{label}</span>
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
        className={cn("flex-1 pb-6 cursor-pointer", !isLast && "pb-6")}
        onClick={onClick}
      >
        <div
          className={cn(
            "p-4 rounded-xl border transition-all hover:shadow-md hover:border-primary/30",
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

export function JobDetailsSheet({
  open,
  onOpenChange,
  job,
  onEdit,
  onDelete,
  onUpdate,
}: JobDetailsSheetProps) {
  const [showInterviewForm, setShowInterviewForm] = React.useState(false);
  const [editingInterview, setEditingInterview] =
    React.useState<JobInterview | null>(null);

  if (!job) return null;

  const handleInterviewAdded = () => {
    setShowInterviewForm(false);
    setEditingInterview(null);
    onUpdate();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="w-full sm:max-w-lg overflow-y-auto p-0"
          showCloseButton={false}
        >
          {/* Header with subtle background */}
          <div className="relative px-6 pt-6 pb-8 bg-muted/30">
            {/* Actions - close and options aligned together */}
            <div className="absolute top-4 right-4 flex items-center gap-0.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="size-4 mr-2" />
                    Edit Application
                  </DropdownMenuItem>
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
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <X className="size-4" />
                </Button>
              </SheetClose>
            </div>

            {/* Company and Title */}
            <div className="flex items-start gap-4">
              <CompanyAvatar name={job.companyName} />
              <div className="flex-1 min-w-0 pt-1">
                <SheetTitle className="text-xl font-bold text-left mb-1">
                  {job.jobTitle}
                </SheetTitle>
                <SheetDescription className="text-base font-medium text-foreground/80 flex items-center gap-2">
                  <Building2 className="size-4" />
                  {job.companyName}
                </SheetDescription>
              </div>
            </div>

            {/* Status and Response */}
            <div className="flex items-center gap-3 mt-4">
              <StatusBadge status={job.status} className="text-sm px-3 py-1" />
              <ResponseIndicator status={job.responseReceived} />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Source */}
              <div className="p-3 rounded-lg border bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1">Source</div>
                <div className="flex items-center gap-2">
                  <SourceIcon source={job.source} />
                  <span className="text-sm font-medium">
                    {getJobSourceDisplayName(job.source)}
                  </span>
                </div>
              </div>

              {/* Method */}
              <div className="p-3 rounded-lg border bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1">
                  Applied Via
                </div>
                <div className="flex items-center gap-2">
                  <Send className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {getApplicationMethodDisplayName(job.applicationMethod)}
                  </span>
                </div>
              </div>

              {/* Location */}
              {(job.location || job.isRemote) && (
                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">
                    Location
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {job.location || "Remote"}
                    </span>
                    {job.isRemote && (
                      <Badge variant="secondary" className="text-xs">
                        Remote OK
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Salary */}
              {formatSalary(
                job.salaryMin,
                job.salaryMax,
                job.salaryCurrency || undefined,
              ) && (
                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">
                    Salary Range
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {formatSalary(
                        job.salaryMin,
                        job.salaryMax,
                        job.salaryCurrency || undefined,
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Dates Row */}
            <div className="flex items-center gap-4 text-sm">
              {job.dateFound && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="size-3.5" />
                  <span>Found {format(new Date(job.dateFound), "MMM d")}</span>
                </div>
              )}
              {job.dateApplied && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Send className="size-3.5" />
                  <span>
                    Applied {format(new Date(job.dateApplied), "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>

            {/* Job Posting Link */}
            {job.jobPostingUrl && (
              <a
                href={job.jobPostingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-primary" />
                  <span className="text-sm font-medium">View Job Posting</span>
                </div>
                <ExternalLink className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            )}

            {/* Notes Section */}
            {job.notes && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="size-4 text-muted-foreground" />
                  Notes
                </div>
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div
                    className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.notes }}
                  />
                </div>
              </div>
            )}

            {/* Interviews Section */}
            <div className="space-y-4">
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
          </div>
        </SheetContent>
      </Sheet>

      <InterviewForm
        open={showInterviewForm}
        onOpenChange={setShowInterviewForm}
        jobApplicationId={job.id}
        interview={editingInterview}
        onSuccess={handleInterviewAdded}
      />
    </>
  );
}
