export const rewards = [
  { id: 1, name: "Energy Refill", chance: 45.0 },
  { id: 2, name: "Health Refill", chance: 45.0 },
  { id: 3, name: "3000 Coins", chance: 9.9 },

  { id: 4, name: "5000 Coins", chance: 0.021222 },
  { id: 5, name: "7000 Coins", chance: 0.018694 },
  { id: 6, name: "10000 Coins", chance: 0.016167 },
  { id: 7, name: "20000 Coins", chance: 0.013639 },
  { id: 8, name: "50000 Coins", chance: 0.011111 },
  { id: 9, name: "75000 Coins", chance: 0.008583 },
  { id: 10, name: "100000 Coins", chance: 0.006056 },
  { id: 11, name: "100 Stars", chance: 0.003528 },
  { id: 12, name: "Gift", chance: 0.001 },
];

export const rewardById = new Map(rewards.map((r) => [r.id, r]));

const UNIQUE_REWARD_IDS = new Set([1, 2, 11, 12]); // Energy & Health

function weightedRoll(items: typeof rewards) {
  const total = items.reduce((sum, i) => sum + i.chance, 0);
  let roll = Math.random() * total;

  for (const item of items) {
    roll -= item.chance;
    if (roll <= 0) return item;
  }

  return items[items.length - 1];
}

export function generateRewards(items: typeof rewards, count: number) {
  const result: typeof rewards = [];
  const pickedUnique = new Set<number>();

  while (result.length < count) {
    const reward = weightedRoll(items);

    // Prevent duplicate Energy / Health
    if (UNIQUE_REWARD_IDS.has(reward.id) && pickedUnique.has(reward.id)) {
      continue; // re-roll
    }

    if (UNIQUE_REWARD_IDS.has(reward.id)) {
      pickedUnique.add(reward.id);
    }

    result.push(reward);
  }

  return result;
}
