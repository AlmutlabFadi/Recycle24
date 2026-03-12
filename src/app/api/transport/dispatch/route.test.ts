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

describe("transport dispatch route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns 400 for missing required fields", async () => {
    const { POST } = await import("./route");

    const request = new Request("http://localhost:3000/api/transport/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingId: "REQ123",
      }),
    });

    const response = await POST(request as never);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.error).toBe("بيانات ناقصة لإكمال التفاصيل");
  });

  it("returns 404 when booking does not exist", async () => {
    transportBooking.findUnique.mockResolvedValue(null);

    const { POST } = await import("./route");

    const request = new Request("http://localhost:3000/api/transport/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingId: "REQ123",
        date: "2026-03-09",
        timeWindow: "10:00-12:00",
        plateNumber: "123456",
      }),
    });

    const response = await POST(request as never);
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.success).toBe(false);
    expect(payload.error).toBe("Booking not found");
  });

  it("stores dispatch details and moves booking to IN_TRANSIT", async () => {
    transportBooking.findUnique.mockResolvedValue({
      trackingId: "REQ123",
      status: "CONFIRMED_AWAITING_DETAILS",
      vehicleType: "truck",
      notes: JSON.stringify({ offers: [] }),
    });

    transportBooking.update.mockResolvedValue({});

    const { POST } = await import("./route");

    const request = new Request("http://localhost:3000/api/transport/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingId: "REQ123",
        eta: "90",
        date: "2026-03-09",
        timeWindow: "10:00-12:00",
        vehicleType: "flatbed",
        plateNumber: "123456",
        vehicleColor: "white",
        notes: "ready",
      }),
    });

    const response = await POST(request as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.message).toBe("تم تثبيت تفاصيل الرحلة بنجاح");
    expect(transportBooking.update).toHaveBeenCalledTimes(1);
  });
});