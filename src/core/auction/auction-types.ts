export type AuctionStatus =
  | "SCHEDULED"
  | "LIVE"
  | "ENDED"
  | "CANCELLED";

export type AuctionWorkflowState =
  | "DRAFT"
  | "OPEN"
  | "AWAITING_PAYMENT_PROOF"
  | "COMPLETED"
  | "CANCELLED";

export type PlaceBidInput = {
  auctionId: string;
  bidderId: string;
  participantId: string;
  amount: number;
  now?: Date;
};

export type AuctionRuntimeSnapshot = {
  id: string;
  sellerId: string;
  title: string;
  startingBid: number;
  status: AuctionStatus | string;
  workflowStatus: AuctionWorkflowState | string;
  isFinallyClosed: boolean;
  endsAt: Date | null;
  effectiveEndsAt: Date | null;
  extensionCount: number;
  currentBid: number | null;
  winningBidId: string | null;
  version: number;
};

export type HighestBidSnapshot = {
  id: string;
  bidderId: string;
  amount: number;
  status: string;
  createdAt: Date;
};

export type ExtensionUpdate = {
  extensionCount: number;
  effectiveEndsAt: Date;
};

export type PlaceBidSuccess = {
  ok: true;
  auctionId: string;
  bidId: string;
  amount: number;
  bidderId: string;
  previousHighestBidId: string | null;
  previousHighestBidderId: string | null;
  currentBid: number;
  winningBidId: string;
  effectiveEndsAt: Date | null;
  extensionCount: number;
  extended: boolean;
};

export type PlaceBidFailureCode =
  | "AUCTION_NOT_FOUND"
  | "AUCTION_NOT_OPEN"
  | "AUCTION_ENDED"
  | "SELF_OUTBID_FORBIDDEN"
  | "INVALID_BID_AMOUNT"
  | "BID_TOO_LOW"
  | "BID_CONFLICT";

export type PlaceBidFailure = {
  ok: false;
  code: PlaceBidFailureCode;
  message: string;
};

export type PlaceBidResult = PlaceBidSuccess | PlaceBidFailure;
