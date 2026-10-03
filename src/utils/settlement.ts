import { MemberBalance, Member, RecommendedTransaction } from '../types';

export function calculateSettlementsFromBalances(
  balances: MemberBalance[],
  members: Member[]
): RecommendedTransaction[] {
  const memberMap = new Map<string, Member>();
  members.forEach(m => memberMap.set(m.id, m));

  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  balances.forEach(b => {
    const rounded = Math.round(b.net_balance * 100) / 100;
    if (rounded < -0.05) {
      debtors.push({ id: b.member_id, amount: -rounded });
    } else if (rounded > 0.05) {
      creditors.push({ id: b.member_id, amount: rounded });
    }
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions: RecommendedTransaction[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];
    const settleAmt = Math.min(debtor.amount, creditor.amount);

    if (settleAmt > 0.01) {
      transactions.push({
        fromId: debtor.id,
        toId: creditor.id,
        amount: Math.round(settleAmt * 100) / 100,
        fromM: memberMap.get(debtor.id),
        toM: memberMap.get(creditor.id),
      });
    }

    debtor.amount -= settleAmt;
    creditor.amount -= settleAmt;

    if (debtor.amount <= 0.01) dIdx++;
    if (creditor.amount <= 0.01) cIdx++;
  }

  return transactions;
}
