import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();

const transportBooking = {
  create: vi.fn(),
};

vi.mock("next-auth", () => ({
  getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/db", () => ({
  db: {
    transportBooking,
  },
}));

describe("transport book route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns 401 when no session exists", async () => {
    getServerSession.mockResolvedValue(null);

    const { POST } = await import("./route");

    const request = new Request("http://localhost:3000/api/transport/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        materialType: "Steel",
        weight: "10",
        pickupAddress: "Damascus",
        pickupGovernorate: "دمشق",
        deliveryAddress: "Homs",
        deliveryGovernorate: "حمص",
        pricingType: "per_ton",
      }),
    });

    const response = await POST(request as never);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.success).toBe(false);
  });

  it("returns 400 for invalid payload", async () => {
    getServerSession.mockResolvedValue({
      user: { id: "user-1" },
    });

    const { POST } = await import("./route");

    const request = new Request("http://localhost:3000/api/transport/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        materialType: "",
        weight: "-5",
        pickupAddress: "",
        pickupGovernorate: "",
        deliveryAddress: "",
        deliveryGovernorate: "",
        pricingType: "per_ton",
      }),
    });

    const response = await POST(request as never);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(typeof payload.error).toBe("string");
  });

  it("creates a booking successfully", async () => {
    getServerSession.mockResolvedValue({
      user: { id: "user-1" },
    });

    transportBooking.create.mockResolvedValue({
      id: "booking-1",
      trackingId: "REQ2603AAAAAA",
      status: "OPEN",
      materialType: "Steel",
      weight: 10,
      createdAt: new Date("2026-03-09T00:00:00.000Z"),
    });

    const { POST } = await import("./route");

    const request = new Request("http://localhost:3000/api/transport/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        materialType: "Steel",
        weight: "10",
        pickupAddress: "Damascus pickup",
        pickupGovernorate: "دمشق",
        deliveryAddress: "Homs delivery",
        deliveryGovernorate: "حمص",
        pickupDate: "2026-03-10T08:00:00.000Z",
        notes: "Handle with care",
        pricingType: "per_ton",
      }),
    });

    const response = await POST(request as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.booking.id).toBe("booking-1");
    expect(payload.booking.status).toBe("OPEN");
    expect(payload.booking.materialType).toBe("Steel");
    expect(transportBooking.create).toHaveBeenCalledTimes(1);
  });
});