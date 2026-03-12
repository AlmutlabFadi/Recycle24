import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();

const transportBooking = {
  findUnique: vi.fn(),
  update: vi.fn(),
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

describe("transport status route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns 401 when no session exists", async () => {
    getServerSession.mockResolvedValue(null);

    const { PATCH } = await import("./route");

    const request = new Request("http://localhost:3000/api/transport/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingId: "REQ123",
        status: "IN_TRANSIT",
      }),
    });

    const response = await PATCH(request as never);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.success).toBe(false);
  });

  it("returns 404 when booking does not exist", async () => {
    getServerSession.mockResolvedValue({
      user: { id: "user-1" },
    });

    transportBooking.findUnique.mockResolvedValue(null);

    const { PATCH } = await import("./route");

    const request = new Request("http://localhost:3000/api/transport/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingId: "REQ123",
        status: "IN_TRANSIT",
      }),
    });

    const response = await PATCH(request as never);
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.success).toBe(false);
    expect(payload.error).toBe("لم يتم العثور على الشحنة");
  });

  it("updates status successfully", async () => {
    getServerSession.mockResolvedValue({
      user: { id: "user-1" },
    });

    transportBooking.findUnique.mockResolvedValue({
      trackingId: "REQ123",
      status: "CONFIRMED",
    });

    transportBooking.update.mockResolvedValue({
      trackingId: "REQ123",
      status: "IN_TRANSIT",
    });

    const { PATCH } = await import("./route");

    const request = new Request("http://localhost:3000/api/transport/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingId: "REQ123",
        status: "IN_TRANSIT",
        driverName: "Driver One",
        driverPhone: "0999",
        vehicleType: "flatbed",
        plateNumber: "123456",
      }),
    });

    const response = await PATCH(request as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.tracking.trackingId).toBe("REQ123");
    expect(payload.tracking.status).toBe("IN_TRANSIT");
    expect(transportBooking.update).toHaveBeenCalledTimes(1);
  });
});