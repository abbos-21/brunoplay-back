export const rewards = [
  { id: 1, name: "Energy Refill", chance: 26.6 },
  { id: 2, name: "Health Refill", chance: 26.0 },
  { id: 3, name: "3000 Coins", chance: 26.0 },
  { id: 4, name: "5000 Coins", chance: 10.0 },
  { id: 5, name: "7000 Coins", chance: 5.0 },
  { id: 6, name: "10000 Coins", chance: 3.0 },
  { id: 7, name: "20000 Coins", chance: 2.0 },
  { id: 8, name: "50000 Coins", chance: 0.6 },
  { id: 9, name: "75000 Coins", chance: 0.5 },
  { id: 10, name: "100000 Coins", chance: 0.1 },
  { id: 11, name: "100 Stars", chance: 0.1 },
  { id: 12, name: "Gift", chance: 0.1 },
];

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
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(weightedRoll(items));
  }
  return result;
}
