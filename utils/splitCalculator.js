const minimizeTransactions = (expenses) => {
  // Use integer cents arithmetic to avoid floating point rounding drift
  const balancesCents = {};

  for (const expense of expenses) {
    const paidById = expense.paidBy._id ? expense.paidBy._id.toString() : expense.paidBy.toString();
    const expenseCents = Math.round(Number(expense.amount) * 100);
    balancesCents[paidById] = (balancesCents[paidById] || 0) + expenseCents;

    for (const split of expense.splitDetails) {
      const userId = split.user._id ? split.user._id.toString() : split.user.toString();
      const splitCents = Math.round(Number(split.amount) * 100);
      balancesCents[userId] = (balancesCents[userId] || 0) - splitCents;
    }
  }

  const creditors = [];
  const debtors = [];

  for (const [user, cents] of Object.entries(balancesCents)) {
    if (cents > 0) {
      creditors.push({ user, cents });
    } else if (cents < 0) {
      debtors.push({ user, cents: Math.abs(cents) });
    }
  }

  creditors.sort((a, b) => b.cents - a.cents);
  debtors.sort((a, b) => b.cents - a.cents);

  const transactions = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const calculatedCents = Math.min(debtors[i].cents, creditors[j].cents);

    transactions.push({
      from: debtors[i].user,
      to: creditors[j].user,
      amount: Number((calculatedCents / 100).toFixed(2)),
    });

    debtors[i].cents -= calculatedCents;
    creditors[j].cents -= calculatedCents;

    if (debtors[i].cents === 0) {
      i++;
    }

    if (creditors[j].cents === 0) {
      j++;
    }
  }

  return transactions;
};

module.exports = { minimizeTransactions };
