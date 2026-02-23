#!/usr/bin/env node

/**
 * Prayer Populator Script
 *
 * Runs at midnight to populate prayer records for all users for the current day.
 * Can be run manually for specific dates.
 *
 * Usage:
 *   node dist/scripts/prayer-populator.js
 *   node dist/scripts/prayer-populator.js --date 2024-01-15
 *
 * Environment variables:
 *   WEBHOOK_URL - Base URL for the app (default: http://localhost:3500)
 *   WEBHOOK_SECRET - The webhook secret for authentication
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const PRAYER_CONFIG = {
  baseUrl: process.env.WEBHOOK_URL || "http://localhost:3500",
  webhookSecret: process.env.WEBHOOK_SECRET || "dev-webhook-secret",
  coloredOutput: true,
} as const;

// ============================================================================
// TYPES
// ============================================================================

interface PopulateResponse {
  success: boolean;
  message: string;
  date: string;
  prayers: string[];
  usersProcessed: number;
  created: number;
  skipped: number;
  error?: string;
}

// ============================================================================
// PRAYER POPULATOR CLASS
// ============================================================================

class PrayerPopulator {
  private get colors() {
    return PRAYER_CONFIG.coloredOutput
      ? {
          reset: "\x1b[0m",
          dim: "\x1b[2m",
          red: "\x1b[31m",
          green: "\x1b[32m",
          yellow: "\x1b[33m",
          cyan: "\x1b[36m",
          white: "\x1b[37m",
        }
      : {
          reset: "",
          dim: "",
          red: "",
          green: "",
          yellow: "",
          cyan: "",
          white: "",
        };
  }

  /**
   * Populate prayers for a specific date
   */
  async populate(date?: string): Promise<PopulateResponse> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(`${PRAYER_CONFIG.baseUrl}/api/prayers/webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PRAYER_CONFIG.webhookSecret}`,
          "User-Agent": "Prayer-Populator/1.0",
        },
        body: JSON.stringify({
          action: "populate-prayers",
          date: date || undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data: PopulateResponse = await response.json();
      const duration = Date.now() - startTime;

      this.logResponse(data, duration);
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logError(error, duration);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        date: date || "today",
        prayers: [],
        usersProcessed: 0,
        created: 0,
        skipped: 0,
      };
    }
  }

  /**
   * Log populate response
   */
  private logResponse(data: PopulateResponse, duration: number): void {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    const statusColor = data.success ? this.colors.green : this.colors.red;

    console.log(
      `${this.colors.dim}[${timestamp}]${this.colors.reset} ${statusColor}${data.success ? "✓" : "✗"}${this.colors.reset} ${duration}ms`
    );

    if (data.success) {
      console.log(
        `  ${this.colors.cyan}Date:${this.colors.reset} ${data.date}`
      );
      console.log(
        `  ${this.colors.cyan}Prayers:${this.colors.reset} ${data.prayers.join(", ")}`
      );
      console.log(
        `  ${this.colors.cyan}Users:${this.colors.reset} ${data.usersProcessed}`
      );
      console.log(
        `  ${this.colors.green}Created:${this.colors.reset} ${data.created}`
      );
      if (data.skipped > 0) {
        console.log(
          `  ${this.colors.yellow}Skipped:${this.colors.reset} ${data.skipped} (already exist)`
        );
      }
    } else {
      console.log(
        `  ${this.colors.red}Error:${this.colors.reset} ${data.message || data.error}`
      );
    }
  }

  /**
   * Log error with details
   */
  private logError(error: unknown, duration: number): void {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    console.log(
      `${this.colors.dim}[${timestamp}]${this.colors.reset} ${this.colors.red}✗${this.colors.reset} ${duration}ms`
    );
    console.log(
      `  ${this.colors.red}Error:${this.colors.reset} ${error instanceof Error ? error.message : String(error)}`
    );
  }

  /**
   * Print banner
   */
  printBanner(): void {
    console.log("\n" + "=".repeat(50));
    console.log(
      `         ${this.colors.cyan}Prayer Populator${this.colors.reset}              `
    );
    console.log("".padEnd(50));
    console.log(
      `  Base URL:    ${this.colors.white}${PRAYER_CONFIG.baseUrl}${this.colors.reset}`
    );
    console.log(
      `  Environment: ${this.colors.white}${process.env.NODE_ENV || "development"}${this.colors.reset}`
    );
    console.log("=".repeat(50));
  }
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

async function runPrayerPopulator() {
  const populator = new PrayerPopulator();
  populator.printBanner();

  // Parse command line args
  const args = process.argv.slice(2);
  let date: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--date" && args[i + 1]) {
      date = args[i + 1];
      i++;
    }
  }

  console.log(
    `\n${populator["colors"].green}Populating prayers${date ? ` for ${date}` : " for today"}...${populator["colors"].reset}\n`
  );

  const result = await populator.populate(date);

  console.log(
    `\n${result.success ? populator["colors"].green + "Done!" : populator["colors"].red + "Failed!"}${populator["colors"].reset}\n`
  );

  process.exit(result.success ? 0 : 1);
}

// Run if called directly
runPrayerPopulator();
