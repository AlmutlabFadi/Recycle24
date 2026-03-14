export type AuctionStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "LIVE"
  | "ENDED"
  | "SETTLEMENT"
  | "CLOSED"
  | "CANCELLED";

export type PlaceBidInput = {
  auctionId: string;
  bidderId: string;
  amount: number;
  now?: Date;
};

export type PlaceBidSuccess = {
  ok: true;
  auctionId: string;
  amount: number;
  highestBidderId: string;
  currentPrice: number;
  extended: boolean;
  endAt: Date;
};

export type PlaceBidFailureCode =
  | "AUCTION_NOT_FOUND"
  | "AUCTION_NOT_LIVE"
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
