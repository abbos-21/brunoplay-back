export const rewards = [
  { id: 1, name: "500 Coins", chance: 39.9 },
  { id: 2, name: "1000 Coins", chance: 30.0 },
  { id: 3, name: "3000 Coins", chance: 18.1 },
  { id: 4, name: "5000 Coins", chance: 10.0 },

  { id: 5, name: "13 Stars", chance: 1.2 },
  { id: 6, name: "21 Stars", chance: 0.4 },
  { id: 7, name: "34 Stars", chance: 0.2 },
  { id: 8, name: "50 Stars", chance: 0.1 },
  { id: 9, name: "60 Stars", chance: 0.05 },
  { id: 10, name: "70 Stars", chance: 0.025 },
  { id: 11, name: "100 Stars", chance: 0.015 },
  { id: 12, name: "Gift", chance: 0.01 },
];

export const rewardById = new Map(rewards.map((r) => [r.id, r]));

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

  while (result.length < count) {
    result.push(weightedRoll(items));
  }

  return result;
}
