export enum LedgerAccountSlug {
  SYSTEM_REVENUE = 'SYSTEM_REVENUE',
  SYSTEM_FEE_COLLECTION = 'SYSTEM_FEE_COLLECTION',
  SYSTEM_AUCTION_ESCROW = 'SYSTEM_AUCTION_ESCROW',
  SYSTEM_LIQUIDITY_POOL = 'SYSTEM_LIQUIDITY_POOL',
}

export enum TransactionType {
  AUCTION_JOIN_DEPOSIT = 'AUCTION_JOIN_DEPOSIT',
  AUCTION_JOIN_FEE = 'AUCTION_JOIN_FEE',
  AUCTION_REFUND = 'AUCTION_REFUND',
  AUCTION_WIN_PAYMENT = 'AUCTION_WIN_PAYMENT',
  DEAL_PAYMENT = 'DEAL_PAYMENT',
  WALLET_DEPOSIT = 'WALLET_DEPOSIT',
  WALLET_WITHDRAWAL = 'WALLET_WITHDRAWAL',
  FEE_COLLECTION = 'FEE_COLLECTION',
  REWARD_PAYMENT = 'REWARD_PAYMENT',
  PLATFORM_COMMISSION = 'PLATFORM_COMMISSION',
}

export enum Currency {
  SYP = 'SYP',
  USD = 'USD',
}

export enum HoldStatus {
  OPEN = 'OPEN',
  RELEASED = 'RELEASED',
  CAPTURED = 'CAPTURED',
  VOIDED = 'VOIDED',
}

export interface PostingLine {
  accountSlug: string;
  amount: number; // Positive for Credit, Negative for Debit
  description?: string;
}

export interface EntryInput {
  type: TransactionType;
  description?: string;
  lines: PostingLine[];
  idempotencyKey?: string;
  metadata?: any;
}
