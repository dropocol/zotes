import { NextRequest, NextResponse } from "next/server";
import {
  ApplicationMethod,
  JobApplicationStatus,
  JobSource,
  Prisma,
  ResponseStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authenticateWebhook } from "@/lib/webhook-auth";

/**
 * POST /api/webhooks/jobs
 *
 * Machine-to-machine intake for job applications created by the local
 * zee-job-hunt automation. Authenticated with the WEBHOOK_SECRET shared
 * secret and written to the account pinned by WEBHOOK_USER_EMAIL.
 *
 * Full reference: docs/webhooks.md
 */

export const runtime = "nodejs";

/** Reject oversized bodies so the endpoint cannot be used as a dump. */
const MAX_BODY_BYTES = 64 * 1024;

/** What to do when an equivalent application already exists. */
const DUPLICATE_MODES = ["ignore", "create", "update"] as const;
type DuplicateMode = (typeof DUPLICATE_MODES)[number];

const JOB_SOURCE_VALUES = Object.values(JobSource);
const APPLICATION_METHOD_VALUES = Object.values(ApplicationMethod);
const STATUS_VALUES = Object.values(JobApplicationStatus);
const RESPONSE_VALUES = Object.values(ResponseStatus);

/**
 * Statuses that mean the company got back to us. Mirrors the auto-fill logic
 * in the job form so webhook and manual entries behave the same.
 */
const RESPONDED_STATUSES: readonly JobApplicationStatus[] = [
  JobApplicationStatus.PHONE_SCREEN,
  JobApplicationStatus.INTERVIEW,
  JobApplicationStatus.OFFER,
  JobApplicationStatus.REJECTED,
];

/** Statuses that imply an application was actually submitted. */
const APPLIED_STATUSES: readonly JobApplicationStatus[] = [
  JobApplicationStatus.APPLIED,
  JobApplicationStatus.PHONE_SCREEN,
  JobApplicationStatus.INTERVIEW,
  JobApplicationStatus.OFFER,
  JobApplicationStatus.REJECTED,
  JobApplicationStatus.NO_RESPONSE,
];

interface JobWebhookPayload {
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
  dateFound: Date | null;
  dateApplied: Date | null;
}

interface ParsedPayload {
  data: JobWebhookPayload;
  /** Keys the caller actually sent; drives update semantics. */
  provided: Set<string>;
  onDuplicate: DuplicateMode;
}

function json(payload: unknown, status: number) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Case/space/dash-insensitive enum parsing, e.g. "linkedin easy apply". */
function parseEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  if (typeof value !== "string") return null;
  const candidate = value.trim().toUpperCase().replace(/[\s-]+/g, "_") as T;
  return allowed.includes(candidate) ? candidate : null;
}

function parseDate(value: unknown): Date | null | "invalid" {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" && typeof value !== "number") return "invalid";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "invalid" : date;
}

function parseInteger(value: unknown): number | null | "invalid" {
  if (value === null || value === undefined || value === "") return null;
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : Number.NaN;
  if (!Number.isFinite(numeric)) return "invalid";
  const integer = Math.trunc(numeric);
  if (integer < 0 || integer > 100_000_000) return "invalid";
  return integer;
}

function parseBoolean(value: unknown): boolean | "invalid" {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }
  return "invalid";
}

/** Same auto-fill rule as the job form. */
function deriveResponseReceived(status: JobApplicationStatus): ResponseStatus {
  if (RESPONDED_STATUSES.includes(status)) return ResponseStatus.YES;
  if (status === JobApplicationStatus.NO_RESPONSE) return ResponseStatus.NO;
  return ResponseStatus.PENDING;
}

function parsePayload(
  body: Record<string, unknown>
): { parsed: ParsedPayload } | { errors: string[] } {
  const errors: string[] = [];
  const provided = new Set(Object.keys(body));

  const jobTitle = optionalText(body.jobTitle);
  if (!jobTitle) {
    errors.push("jobTitle is required and must be a non-empty string");
  } else if (jobTitle.length > 500) {
    errors.push("jobTitle must be at most 500 characters");
  }

  const companyName = optionalText(body.companyName);
  if (!companyName) {
    errors.push("companyName is required and must be a non-empty string");
  } else if (companyName.length > 500) {
    errors.push("companyName must be at most 500 characters");
  }

  let source: JobSource = JobSource.OTHER;
  if (body.source !== undefined && body.source !== null && body.source !== "") {
    const parsed = parseEnum(body.source, JOB_SOURCE_VALUES);
    if (parsed) source = parsed;
    else errors.push(`source must be one of: ${JOB_SOURCE_VALUES.join(", ")}`);
  }

  let applicationMethod: ApplicationMethod = ApplicationMethod.WEB_PORTAL;
  if (
    body.applicationMethod !== undefined &&
    body.applicationMethod !== null &&
    body.applicationMethod !== ""
  ) {
    const parsed = parseEnum(body.applicationMethod, APPLICATION_METHOD_VALUES);
    if (parsed) applicationMethod = parsed;
    else
      errors.push(
        `applicationMethod must be one of: ${APPLICATION_METHOD_VALUES.join(", ")}`
      );
  }

  let status: JobApplicationStatus = JobApplicationStatus.SAVED;
  if (body.status !== undefined && body.status !== null && body.status !== "") {
    const parsed = parseEnum(body.status, STATUS_VALUES);
    if (parsed) status = parsed;
    else errors.push(`status must be one of: ${STATUS_VALUES.join(", ")}`);
  }

  let responseReceived: ResponseStatus;
  if (
    body.responseReceived !== undefined &&
    body.responseReceived !== null &&
    body.responseReceived !== ""
  ) {
    const parsed = parseEnum(body.responseReceived, RESPONSE_VALUES);
    if (parsed) {
      responseReceived = parsed;
    } else {
      errors.push(`responseReceived must be one of: ${RESPONSE_VALUES.join(", ")}`);
      responseReceived = ResponseStatus.PENDING;
    }
  } else {
    responseReceived = deriveResponseReceived(status);
  }

  let jobPostingUrl: string | null = null;
  if (body.jobPostingUrl !== undefined && body.jobPostingUrl !== null) {
    const parsed = optionalText(body.jobPostingUrl);
    if (parsed && parsed.length > 2048) {
      errors.push("jobPostingUrl must be at most 2048 characters");
    } else if (body.jobPostingUrl !== "" && parsed === null) {
      errors.push("jobPostingUrl must be a string");
    } else {
      jobPostingUrl = parsed;
    }
  }

  let location: string | null = null;
  if (body.location !== undefined && body.location !== null) {
    const parsed = optionalText(body.location);
    if (parsed && parsed.length > 500) {
      errors.push("location must be at most 500 characters");
    } else if (body.location !== "" && parsed === null) {
      errors.push("location must be a string");
    } else {
      location = parsed;
    }
  }

  let notes: string | null = null;
  if (body.notes !== undefined && body.notes !== null && body.notes !== "") {
    if (typeof body.notes !== "string") {
      errors.push("notes must be a string");
    } else if (body.notes.length > 20_000) {
      errors.push("notes must be at most 20000 characters");
    } else {
      notes = body.notes;
    }
  }

  let salaryCurrency = "USD";
  if (body.salaryCurrency !== undefined && body.salaryCurrency !== null) {
    const parsed = optionalText(body.salaryCurrency);
    if (!parsed) {
      errors.push("salaryCurrency must be a non-empty string");
    } else {
      salaryCurrency = parsed.toUpperCase().slice(0, 12);
    }
  }

  let salaryMin: number | null = null;
  if (body.salaryMin !== undefined) {
    const parsed = parseInteger(body.salaryMin);
    if (parsed === "invalid") errors.push("salaryMin must be a non-negative integer");
    else salaryMin = parsed;
  }

  let salaryMax: number | null = null;
  if (body.salaryMax !== undefined) {
    const parsed = parseInteger(body.salaryMax);
    if (parsed === "invalid") errors.push("salaryMax must be a non-negative integer");
    else salaryMax = parsed;
  }

  if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
    errors.push("salaryMin must be less than or equal to salaryMax");
  }

  let isRemote = false;
  if (body.isRemote !== undefined && body.isRemote !== null) {
    const parsed = parseBoolean(body.isRemote);
    if (parsed === "invalid") errors.push("isRemote must be a boolean");
    else isRemote = parsed;
  }

  let dateFound: Date | null = null;
  if (body.dateFound !== undefined) {
    const parsed = parseDate(body.dateFound);
    if (parsed === "invalid") {
      errors.push("dateFound must be a valid date (YYYY-MM-DD or ISO 8601)");
    } else {
      dateFound = parsed;
    }
  }

  let dateApplied: Date | null = null;
  if (body.dateApplied !== undefined) {
    const parsed = parseDate(body.dateApplied);
    if (parsed === "invalid") {
      errors.push("dateApplied must be a valid date (YYYY-MM-DD or ISO 8601)");
    } else {
      dateApplied = parsed;
    }
  }

  let onDuplicate: DuplicateMode = "ignore";
  if (body.onDuplicate !== undefined && body.onDuplicate !== null) {
    const raw =
      typeof body.onDuplicate === "string" ? body.onDuplicate.trim().toLowerCase() : "";
    if ((DUPLICATE_MODES as readonly string[]).includes(raw)) {
      onDuplicate = raw as DuplicateMode;
    } else {
      errors.push(`onDuplicate must be one of: ${DUPLICATE_MODES.join(", ")}`);
    }
  }

  if (errors.length > 0) return { errors };

  return {
    parsed: {
      data: {
        jobTitle: jobTitle as string,
        companyName: companyName as string,
        source,
        applicationMethod,
        jobPostingUrl,
        salaryMin,
        salaryMax,
        salaryCurrency,
        location,
        isRemote,
        status,
        responseReceived,
        notes,
        dateFound,
        dateApplied,
      },
      provided,
      onDuplicate,
    },
  };
}

function buildUpdateData(
  data: JobWebhookPayload,
  provided: Set<string>,
  existing: { responseDate: Date | null }
): Prisma.JobApplicationUncheckedUpdateInput {
  const update: Prisma.JobApplicationUncheckedUpdateInput = {};

  if (provided.has("jobTitle")) update.jobTitle = data.jobTitle;
  if (provided.has("companyName")) update.companyName = data.companyName;
  if (provided.has("source")) update.source = data.source;
  if (provided.has("applicationMethod")) update.applicationMethod = data.applicationMethod;
  if (provided.has("jobPostingUrl")) update.jobPostingUrl = data.jobPostingUrl;
  if (provided.has("salaryMin")) update.salaryMin = data.salaryMin;
  if (provided.has("salaryMax")) update.salaryMax = data.salaryMax;
  if (provided.has("salaryCurrency")) update.salaryCurrency = data.salaryCurrency;
  if (provided.has("location")) update.location = data.location;
  if (provided.has("isRemote")) update.isRemote = data.isRemote;
  if (provided.has("notes")) update.notes = data.notes;
  if (provided.has("dateFound")) update.dateFound = data.dateFound;
  if (provided.has("dateApplied")) update.dateApplied = data.dateApplied;

  if (provided.has("status")) update.status = data.status;

  if (provided.has("status") || provided.has("responseReceived")) {
    // Mirror the job form: changing the status also refreshes the response
    // flag unless the caller supplied responseReceived explicitly.
    const responseReceived = provided.has("responseReceived")
      ? data.responseReceived
      : deriveResponseReceived(data.status);

    update.responseReceived = responseReceived;
    if (responseReceived === ResponseStatus.PENDING) {
      update.responseDate = null;
    } else if (!existing.responseDate) {
      update.responseDate = new Date();
    }
  }

  return update;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateWebhook(request);
    if (!authResult.ok) {
      return json({ error: authResult.error }, authResult.status);
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return json({ error: "Content-Type must be application/json" }, 415);
    }

    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return json({ error: "Request body is too large" }, 413);
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return json({ error: "Request body must be valid JSON" }, 400);
    }

    if (!isRecord(body)) {
      return json({ error: "Request body must be a JSON object" }, 400);
    }

    const result = parsePayload(body);
    if ("errors" in result) {
      return json({ error: "Validation failed", details: result.errors }, 400);
    }

    const { data, provided, onDuplicate } = result.parsed;
    const userId = authResult.user.id;

    const include = {
      interviews: { orderBy: { scheduledAt: "asc" as const } },
    } satisfies Prisma.JobApplicationInclude;

    const orConditions: Prisma.JobApplicationWhereInput[] = [
      {
        jobTitle: { equals: data.jobTitle, mode: "insensitive" as const },
        companyName: { equals: data.companyName, mode: "insensitive" as const },
      },
    ];
    if (data.jobPostingUrl) {
      orConditions.unshift({ jobPostingUrl: data.jobPostingUrl });
    }

    if (onDuplicate !== "create") {
      const existing = await prisma.jobApplication.findFirst({
        where: { userId, OR: orConditions },
        include,
        orderBy: { createdAt: "desc" },
      });

      if (existing && onDuplicate === "ignore") {
        return json({ success: true, action: "duplicate", job: existing }, 200);
      }

      if (existing && onDuplicate === "update") {
        const job = await prisma.jobApplication.update({
          where: { id: existing.id },
          data: buildUpdateData(data, provided, existing),
          include,
        });
        console.log(`[job-webhook] updated job ${job.id} for user ${userId}`);
        return json({ success: true, action: "updated", job }, 200);
      }
    }

    // Preserve stats accuracy: if the caller says the job was applied to but
    // omits the date, stamp it as applied today.
    const dateApplied =
      data.dateApplied ??
      (APPLIED_STATUSES.includes(data.status) ? new Date() : null);

    const job = await prisma.jobApplication.create({
      data: {
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        source: data.source,
        applicationMethod: data.applicationMethod,
        jobPostingUrl: data.jobPostingUrl,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        salaryCurrency: data.salaryCurrency,
        location: data.location,
        isRemote: data.isRemote,
        status: data.status,
        responseReceived: data.responseReceived,
        responseDate:
          data.responseReceived === ResponseStatus.PENDING ? null : new Date(),
        notes: data.notes,
        dateFound: data.dateFound,
        dateApplied,
        userId,
      },
      include,
    });

    console.log(`[job-webhook] created job ${job.id} for user ${userId}`);
    return json({ success: true, action: "created", job }, 201);
  } catch (error) {
    console.error("Error handling job webhook:", error);
    return json({ error: "Internal server error" }, 500);
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } }
  );
}
