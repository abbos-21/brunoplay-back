// src/cron.ts
import cron from "node-cron";
import { runDailyUpdateSafe } from "./jobs/dailyJob";

// Runs at 00:00 every day
cron.schedule("11 21 * * *", runDailyUpdateSafe, {
  timezone: "UTC",
});
