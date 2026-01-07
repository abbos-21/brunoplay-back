// src/cron.ts
import cron from "node-cron";
import { runDailyUpdate } from "./jobs/dailyJob";

// Runs at 00:00 every day
cron.schedule("30 11 * * *", async () => {
  await runDailyUpdate();
});
