"use client";

import * as React from "react";
import { format } from "date-fns";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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
import { StatusBadge } from "../shared/status-badge";
import { SourceIcon } from "../shared/source-icon";
import { InterviewForm } from "./interview-form";
import {
  getJobSourceDisplayName,
  getApplicationMethodDisplayName,
  formatSalary,
  getInterviewTypeDisplayName,
} from "@/types/jobs";
import type { JobApplication, JobInterview } from "@prisma/client";

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

export function JobDetailsSheet({
  open,
  onOpenChange,
  job,
  onEdit,
  onDelete,
  onUpdate,
}: JobDetailsSheetProps) {
  const [showInterviewForm, setShowInterviewForm] = React.useState(false);
  const [editingInterview, setEditingInterview] = React.useState<JobInterview | null>(null);

  if (!job) return null;

  const handleInterviewAdded = () => {
    setShowInterviewForm(false);
    setEditingInterview(null);
    onUpdate();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <div className="flex items-start justify-between">
              <SheetTitle className="text-left">{job.jobTitle}</SheetTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={onEdit}>
                  <Pencil className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Application</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this job application? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Company and Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" />
                <span className="font-medium">{job.companyName}</span>
              </div>
              <StatusBadge status={job.status} />
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <SourceIcon source={job.source} />
                <span>{getJobSourceDisplayName(job.source)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4" />
                <span>{getApplicationMethodDisplayName(job.applicationMethod)}</span>
              </div>
            </div>

            {/* Location */}
            {(job.location || job.isRemote) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="size-4 text-muted-foreground" />
                <span>{job.location || "Remote"}</span>
                {job.isRemote && (
                  <Badge variant="secondary" className="ml-2">
                    Remote
                  </Badge>
                )}
              </div>
            )}

            {/* URL */}
            {job.jobPostingUrl && (
              <a
                href={job.jobPostingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Globe className="size-4" />
                View Job Posting
                <ExternalLink className="size-3" />
              </a>
            )}

            {/* Salary */}
            {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency || undefined) && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="size-4 text-muted-foreground" />
                <span className="font-medium">
                  {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency || undefined)}
                </span>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              {job.dateFound && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4" />
                  <span>Found: {format(new Date(job.dateFound), "MMM d, yyyy")}</span>
                </div>
              )}
              {job.dateApplied && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4" />
                  <span>Applied: {format(new Date(job.dateApplied), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Notes */}
            {job.notes && (
              <div>
                <h4 className="text-sm font-medium mb-2">Notes</h4>
                <div
                  className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: job.notes }}
                />
              </div>
            )}

            <Separator />

            {/* Interviews */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium">Interviews ({job.interviews.length})</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingInterview(null);
                    setShowInterviewForm(true);
                  }}
                >
                  <Plus className="size-4 mr-1" />
                  Add Interview
                </Button>
              </div>

              {job.interviews.length > 0 ? (
                <div className="space-y-3">
                  {job.interviews.map((interview) => (
                    <div
                      key={interview.id}
                      className="p-3 rounded-lg border bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => {
                        setEditingInterview(interview);
                        setShowInterviewForm(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            Round {interview.roundNumber}
                          </Badge>
                          <span className="font-medium">
                            {getInterviewTypeDisplayName(interview.interviewType)}
                          </span>
                        </div>
                        {interview.scheduledAt && (
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(interview.scheduledAt), "MMM d, yyyy h:mm a")}
                          </span>
                        )}
                      </div>
                      {interview.location && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {interview.location}
                        </p>
                      )}
                      {interview.interviewerNames && (
                        <p className="text-sm text-muted-foreground mt-1">
                          with {interview.interviewerNames}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No interviews scheduled yet.</p>
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
