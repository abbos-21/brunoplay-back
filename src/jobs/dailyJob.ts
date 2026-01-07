// import prisma from "../prisma";

// export async function runDailyUpdate() {
//   console.log("Running daily update...");

//   await prisma.user.updateMany({
//     data: {
//       energyRefillLimit: 20,
//       healthRefillLimit: 20,
//     },
//   });

//   console.log("Daily update finished");
// }

import prisma from "../prisma";

function getNextUtcMidnight() {
  const now = new Date();

  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0
    )
  );

  return next;
}

export async function runDailyUpdateSafe() {
  const now = new Date();

  await prisma.$transaction([
    prisma.user.updateMany({
      data: {
        energyRefillLimit: 20,
        healthRefillLimit: 20,
      },
    }),
    prisma.jobState.upsert({
      where: { name: "daily-refill-update" },
      update: {
        lastRunAt: now,
        nextRunAt: getNextUtcMidnight(),
      },
      create: {
        name: "daily-refill-update",
        lastRunAt: now,
        nextRunAt: getNextUtcMidnight(),
      },
    }),
  ]);
}
