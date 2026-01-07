import prisma from "../prisma";

export async function runDailyUpdate() {
  console.log("Running daily update...");

  await prisma.user.updateMany({
    data: {
      energyRefillLimit: 20,
      healthRefillLimit: 20,
    },
  });

  console.log("Daily update finished");
}
