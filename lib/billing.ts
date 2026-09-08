/* ==========================================================================
   BILLING RAILS

   The Pakistan payin problem is still open, so the platform ships with the one
   rail that works there today: a bank transfer the member declares and an
   admin confirms. It is slower than a card, and it is honest about that.

   Every rail ends up in the same place: public.record_payment, which opens the
   account, awards the one time commission and the leaderboard points in a
   single transaction. Adding a card provider later means a webhook that calls
   that same function, and nothing downstream changes.
   ========================================================================== */

export type RailId = "bank_transfer" | "card";

export type Rail = {
  id: RailId;
  name: string;
  available: boolean;
  clearing: string;
  body: string;
};

export const rails: Rail[] = [
  {
    id: "bank_transfer",
    name: "Bank transfer",
    available: true,
    clearing: "Confirmed within one working day",
    body: "Transfer the amount from your own bank or wallet app, then tell us the reference. We check it against the account and switch your plan on. This is the rail most members in Pakistan will use.",
  },
  {
    id: "card",
    name: "Card",
    available: false,
    clearing: "Instant",
    body: "Not live yet. Many Pakistani debit cards are not enabled for international payments by default, so we are not switching this on until a local provider is contracted. We will say so here when it is.",
  },
];

/**
 * ⚠ PLACEHOLDER. Replace with the real company account before launch, and never
 * show a member an account that is not yet under the company's control.
 */
export const bankDetails = {
  accountName: "Assignwork Ltd",
  bank: "PLACEHOLDER, add the real bank",
  accountNumber: "PLACEHOLDER",
  iban: "PLACEHOLDER",
  isReal: false,
} as const;
