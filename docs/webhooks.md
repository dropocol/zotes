# Job Intake Webhook

`POST /api/webhooks/jobs` lets the local **zee-job-hunt** automation (or anything
else holding the shared secret) create job applications in Zotes without opening
the browser. Created jobs show up on `/jobs/list`, the calendar, the dashboard,
and the stats view exactly like manually added ones.

There is no session cookie or login involved. The request authenticates with a
long random shared secret, and the destination account is pinned on the server,
so a leaked secret cannot write into a different account.

---

## 1. Configure the server

Set two environment variables where Zotes runs:

| Variable | Required | Description |
| --- | --- | --- |
| `WEBHOOK_SECRET` | yes | Long random string the caller must present. |
| `WEBHOOK_USER_EMAIL` | one of | Email of the account webhook jobs are saved to. |
| `WEBHOOK_USER_ID` | one of | User id (cuid) alternative to `WEBHOOK_USER_EMAIL`. Takes precedence when both are set. |

Generate a secret:

```bash
openssl rand -hex 32
```

Local development - add to `.env`:

```env
WEBHOOK_SECRET="paste-the-generated-secret"
WEBHOOK_USER_EMAIL="you@example.com"
```

Production (Coolify) - add the same two variables to the app environment and
redeploy. The endpoint fails closed: if `WEBHOOK_SECRET` is unset, or no owner
account is configured/found, it returns `503` and writes nothing.

---

## 2. Endpoint

| | |
| --- | --- |
| Method | `POST` |
| Production URL | `https://zotes.handytoolskit.com/api/webhooks/jobs` |
| Local URL | `http://localhost:3600/api/webhooks/jobs` |
| Content-Type | `application/json` (required) |
| Auth | `Authorization: Bearer <WEBHOOK_SECRET>` or `X-Webhook-Secret: <WEBHOOK_SECRET>` |

The endpoint is POST-only; any other method returns `405`.

---

## 3. Request body

Only `jobTitle` and `companyName` are required. Everything else has a sensible
default.

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `jobTitle` | string | - | **Required.** Max 500 chars. |
| `companyName` | string | - | **Required.** Max 500 chars. |
| `source` | enum | `OTHER` | Where the job was found. |
| `applicationMethod` | enum | `WEB_PORTAL` | How it was applied to. |
| `status` | enum | `SAVED` | Pipeline status. |
| `responseReceived` | enum | derived | Derived from `status` when omitted. |
| `jobPostingUrl` | string | `null` | Max 2048 chars. Also used for duplicate detection. |
| `location` | string | `null` | Max 500 chars. |
| `isRemote` | boolean | `false` | Accepts `true`/`false` or `"true"`/`"false"`. |
| `salaryMin` | integer | `null` | Non-negative, must be <= `salaryMax`. |
| `salaryMax` | integer | `null` | Non-negative. |
| `salaryCurrency` | string | `"USD"` | Upper-cased, max 12 chars. |
| `dateFound` | date | `null` | `YYYY-MM-DD` or ISO 8601. |
| `dateApplied` | date | see note | Auto-set to today when `status` implies an application and this is omitted. |
| `notes` | string | `null` | Max 20000 chars. |
| `onDuplicate` | enum | `"ignore"` | `ignore`, `create`, or `update`. See section 6. |

Enum values:

- **source**: `LINKEDIN`, `SLACK`, `FACEBOOK`, `X`, `COMPANY_WEBSITE`, `REFERRAL`, `JOB_BOARD`, `OTHER`
- **applicationMethod**: `EMAIL`, `WEB_PORTAL`, `LINKEDIN_EASY_APPLY`, `REFERRAL`
- **status**: `SAVED`, `APPLIED`, `PHONE_SCREEN`, `INTERVIEW`, `OFFER`, `REJECTED`, `WITHDRAWN`, `NO_RESPONSE`
- **responseReceived**: `YES`, `NO`, `PENDING`

Enum parsing is forgiving: `"linkedin easy apply"`, `"linkedin-easy-apply"`,
and `"LINKEDIN_EASY_APPLY"` all work.

When `responseReceived` is omitted it is derived from `status`, matching the job
form: `PHONE_SCREEN`/`INTERVIEW`/`OFFER`/`REJECTED` -> `YES`, `NO_RESPONSE` ->
`NO`, anything else -> `PENDING`.

---

## 4. Examples

Create a saved job found on LinkedIn:

```bash
curl -X POST "https://zotes.handytoolskit.com/api/webhooks/jobs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WEBHOOK_SECRET" \
  -d '{
    "jobTitle": "Senior Backend Engineer",
    "companyName": "Acme Inc.",
    "source": "LINKEDIN",
    "jobPostingUrl": "https://www.linkedin.com/jobs/view/123456789",
    "location": "Remote (US)",
    "isRemote": true,
    "salaryMin": 140000,
    "salaryMax": 180000,
    "salaryCurrency": "USD",
    "dateFound": "2026-10-05",
    "notes": "Found by the job-hunt automation."
  }'
```

Record a job that was just applied to (uses the `X-Webhook-Secret` header):

```bash
curl -X POST "https://zotes.handytoolskit.com/api/webhooks/jobs" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $WEBHOOK_SECRET" \
  -d '{
    "jobTitle": "Platform Engineer",
    "companyName": "Globex",
    "source": "JOB_BOARD",
    "applicationMethod": "WEB_PORTAL",
    "status": "APPLIED",
    "dateApplied": "2026-10-05"
  }'
```

Move an existing application forward (matched by posting URL, then by
title + company):

```bash
curl -X POST "https://zotes.handytoolskit.com/api/webhooks/jobs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WEBHOOK_SECRET" \
  -d '{
    "jobTitle": "Platform Engineer",
    "companyName": "Globex",
    "status": "INTERVIEW",
    "onDuplicate": "update"
  }'
```

Force a second record for the same title/company:

```bash
curl -X POST "https://zotes.handytoolskit.com/api/webhooks/jobs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WEBHOOK_SECRET" \
  -d '{
    "jobTitle": "Platform Engineer",
    "companyName": "Globex",
    "source": "REFERRAL",
    "onDuplicate": "create"
  }'
```

---

## 5. Responses

| Status | Meaning |
| --- | --- |
| `201` | Job created. `action: "created"`. |
| `200` | Duplicate ignored (`action: "duplicate"`) or existing job updated (`action: "updated"`). |
| `400` | Validation failed - `details` lists every problem. |
| `401` | Missing or wrong secret. |
| `405` | Method other than POST. |
| `413` | Body larger than 64 KB. |
| `415` | `Content-Type` is not `application/json`. |
| `500` | Unexpected server error. |
| `503` | Webhook not configured on the server (no secret, no owner). |

Success response:

```json
{
  "success": true,
  "action": "created",
  "job": {
    "id": "clx...",
    "jobTitle": "Senior Backend Engineer",
    "companyName": "Acme Inc.",
    "status": "SAVED",
    "responseReceived": "PENDING",
    "dateApplied": null,
    "interviews": []
  }
}
```

The `job` object is the full record; only a few fields are shown above.

Validation error:

```json
{
  "error": "Validation failed",
  "details": ["salaryMin must be less than or equal to salaryMax"]
}
```

---

## 6. Duplicates and updates (`onDuplicate`)

Before creating, Zotes looks for an existing job for the same account that
matches either:

1. the same `jobPostingUrl` (when the payload includes one), or
2. the same `jobTitle` **and** `companyName` (case-insensitive).

`onDuplicate` controls what happens on a match:

| Value | Behaviour | HTTP |
| --- | --- | --- |
| `ignore` (default) | Return the existing job, do not create or change anything. Safe for retries. | `200`, `action: "duplicate"` |
| `update` | Apply only the fields present in this request to the existing job. | `200`, `action: "updated"` |
| `create` | Always insert a new row. | `201`, `action: "created"` |

With `onDuplicate: "update"`, omitted fields are left untouched, and
`responseReceived` still gets a `responseDate` stamped the first time it becomes
`YES` or `NO`.

---

## 7. Calling it from zee-job-hunt

The call is server-to-server (Node -> Zotes), so there is no CORS or browser
involved. Add the secret to the job-hunt project environment, then call the
endpoint wherever a job is applied to.

Env for the job-hunt project:

```env
ZOTES_WEBHOOK_URL="https://zotes.handytoolskit.com/api/webhooks/jobs"
ZOTES_WEBHOOK_SECRET="the-same-value-as-WEBHOOK_SECRET-on-the-server"
```

Minimal client:

```ts
type ZotesJob = {
  title: string;
  company: string;
  url?: string;
  location?: string;
  remote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  status?: string;
  source?: string;
  appliedAt?: string | Date;
  notes?: string;
};

export async function saveJobToZotes(job: ZotesJob) {
  const response = await fetch(process.env.ZOTES_WEBHOOK_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.ZOTES_WEBHOOK_SECRET!}`,
    },
    body: JSON.stringify({
      jobTitle: job.title,
      companyName: job.company,
      jobPostingUrl: job.url,
      location: job.location,
      isRemote: job.remote,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      status: job.status ?? "APPLIED",
      source: job.source ?? "OTHER",
      dateApplied:
        job.appliedAt instanceof Date
          ? job.appliedAt.toISOString()
          : job.appliedAt,
      notes: job.notes,
      onDuplicate: "update", // keep status fresh on repeat runs
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Zotes webhook failed: ${response.status} ${await response.text()}`
    );
  }

  return response.json();
}
```

---

## 8. Testing locally

With the dev server running (`npm run dev`) and `.env` configured:

```bash
npx tsx scripts/send-job-webhook.ts
```

Or use one of the curl examples from section 4 against
`http://localhost:3600/api/webhooks/jobs`, then open
`http://localhost:3600/jobs/list` to confirm the job appears.

Confirm auth is enforced:

```bash
# Expected: 401 Unauthorized
curl -i -X POST http://localhost:3600/api/webhooks/jobs \
  -H "Content-Type: application/json" -d "{}"
```

---

## 9. Security notes

- Always call the production endpoint over HTTPS.
- Send the secret in a header, never in the query string (URLs get logged).
- Keep the secret out of source control. Rotate it by updating `WEBHOOK_SECRET`
  on the server and in the caller together.
- The destination account cannot be chosen by the caller; it is fixed by
  `WEBHOOK_USER_EMAIL` / `WEBHOOK_USER_ID`.
- The endpoint fails closed (`503`) when not fully configured.
- Secret comparison is constant-time.
- If the secret leaks, rotate it immediately. The blast radius is limited to
  creating/updating job applications for the pinned account.

---

## 10. Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `401 Unauthorized` | Header missing, wrong scheme, or wrong secret. Use `Authorization: Bearer <secret>`. |
| `503 Webhook is not configured...` | `WEBHOOK_SECRET` or `WEBHOOK_USER_EMAIL`/`WEBHOOK_USER_ID` unset, or the account was not found. |
| `400 Validation failed` | See `details`; `jobTitle` and `companyName` are required. |
| `415` | Add `Content-Type: application/json`. |
| Job not on `/jobs/list` | The webhook writes for the env-pinned owner; confirm that account matches the one you are viewing. |
