import { beforeEach, describe, expect, it, vi } from "vitest";

const transportBooking = {
  findUnique: vi.fn(),
  update: vi.fn(),
};

vi.mock("@/lib/db", () => ({
  db: {
    transportBooking,
  },
}));

describe("transport offers route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns 404 when booking does not exist", async () => {
    transportBooking.findUnique.mockResolvedValue(null);

    const { GET } = await import("./route");

    const request = new Request(
      "http://localhost:3000/api/transport/offers?trackingId=REQ123",
    );

    const response = await GET(request as never);
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.success).toBe(false);
    expect(payload.error).toBe("طلب النقل غير موجود");
  });

  it("returns offers for an existing booking", async () => {
    transportBooking.findUnique.mockResolvedValue({
      trackingId: "REQ123",
      status: "HAS_OFFERS",
      notes: JSON.stringify({
        offers: [
          {
            driverId: "driver-1",
            driverName: "Driver One",
            driverPhone: "0999",
            price: 100,
            rating: 4.7,
            timestamp: "2026-03-09T00:00:00.000Z",
            status: "PENDING",
          },
        ],
      }),
    });

    const { GET } = await import("./route");

    const request = new Request(
      "http://localhost:3000/api/transport/offers?trackingId=REQ123",
    );

    const response = await GET(request as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.offers).toHaveLength(1);
    expect(payload.offers[0].driverId).toBe("driver-1");
  });

  it("creates a new offer and updates booking notes", async () => {
    transportBooking.findUnique.mockResolvedValue({
      trackingId: "REQ123",
      status: "OPEN",
      notes: JSON.stringify({ offers: [] }),
    });

    transportBooking.update.mockResolvedValue({});

    const { POST } = await import("./route");

    const request = new Request("http://localhost:3000/api/transport/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingId: "REQ123",
        driverId: "driver-1",
        driverName: "Driver One",
        driverPhone: "0999",
        price: 100,
        rating: 4.7,
      }),
    });

    const response = await POST(request as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(transportBooking.update).toHaveBeenCalledTimes(1);
  });

  it("accepts an existing offer", async () => {
    transportBooking.findUnique.mockResolvedValue({
      trackingId: "REQ123",
      status: "HAS_OFFERS",
      notes: JSON.stringify({
        offers: [
          {
            driverId: "driver-1",
            driverName: "Driver One",
            driverPhone: "0999",
            price: 100,
            rating: 4.7,
            timestamp: "2026-03-09T00:00:00.000Z",
            status: "PENDING",
          },
          {
            driverId: "driver-2",
            driverName: "Driver Two",
            driverPhone: "0888",
            price: 120,
            rating: 4.5,
            timestamp: "2026-03-09T00:00:00.000Z",
            status: "PENDING",
          },
        ],
      }),
    });

    transportBooking.update.mockResolvedValue({});

    const { PATCH } = await import("./route");

    const request = new Request("http://localhost:3000/api/transport/offers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingId: "REQ123",
        driverId: "driver-1",
      }),
    });

    const response = await PATCH(request as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(transportBooking.update).toHaveBeenCalledTimes(1);
  });
});
