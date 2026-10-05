/**
 * One-shot sender for the Zotes job intake webhook.
 *
 * Usage:
 *   npx tsx scripts/send-job-webhook.ts
 *   WEBHOOK_URL=... WEBHOOK_SECRET=... npx tsx scripts/send-job-webhook.ts
 *
 * Docs: docs/webhooks.md
 */

const url = process.env.WEBHOOK_URL ?? "http://localhost:3600/api/webhooks/jobs";
const secret = process.env.WEBHOOK_SECRET;

if (!secret) {
  console.error(
    "WEBHOOK_SECRET is not set. Add it to your shell/.env before running this script."
  );
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);

const payload = {
  jobTitle: "Senior Backend Engineer (webhook test)",
  companyName: "Acme Inc.",
  source: "LINKEDIN",
  applicationMethod: "WEB_PORTAL",
  status: "APPLIED",
  jobPostingUrl: `https://example.com/jobs/${Date.now()}`,
  location: "Remote (US)",
  isRemote: true,
  salaryMin: 140000,
  salaryMax: 180000,
  salaryCurrency: "USD",
  dateFound: today,
  dateApplied: today,
  notes: "Sent by scripts/send-job-webhook.ts",
  onDuplicate: "ignore",
};

async function main() {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Keep the raw text when the response is not JSON.
  }

  console.log(`${response.status} ${response.statusText}`);
  console.log(typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2));

  if (!response.ok) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

// Keep this file a module so its helpers don't leak into the global scope
// (scripts/webhook-sender.ts is a legacy global-scope script in this folder).
export {};
