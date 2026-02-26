import requests
import uuid

BASE_URL = "http://127.0.0.1:3000"
TIMEOUT = 30

def test_get_transport_offers_by_trackingid():
    # Helper function to create a transport offer (required to have a valid trackingId with offers)
    def create_offer(tracking_id):
        offer_data = {
            "trackingId": tracking_id,
            "driverId": f"DRV-{uuid.uuid4().hex[:8]}",
            "driverName": "Test Driver",
            "driverPhone": "+966500000001",
            "price": 1000,
            "rating": 4.5
        }
        r = requests.post(f"{BASE_URL}/api/transport/offers", json=offer_data, timeout=TIMEOUT)
        r.raise_for_status()
        resp = r.json()
        assert resp.get("success") is True, f"Failed to create offer: {resp}"
        return offer_data["trackingId"], offer_data["driverId"]

    # Use a fixed trackingId for testing consistent with PRD example
    valid_tracking_id = "REQ123"
    create_offer(valid_tracking_id)  # Create a valid offer so that GET returns results

    try:
        # 1. Success: GET /api/transport/offers?trackingId=valid_tracking_id
        r = requests.get(f"{BASE_URL}/api/transport/offers", params={"trackingId": valid_tracking_id}, timeout=TIMEOUT)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        resp = r.json()
        assert resp.get("success") is True, "Success flag not True in 200 response"
        assert isinstance(resp.get("offers"), list), "Offers is not a list in success response"
        assert len(resp["offers"]) > 0, "Offers list is empty when it should contain offers"

        # 2. Error 400: invalid trackingId format (e.g., empty or malformed)
        invalid_tracking_ids = ["", "!!!invalid###", "123 45", "req@123"]
        for bad_id in invalid_tracking_ids:
            r = requests.get(f"{BASE_URL}/api/transport/offers", params={"trackingId": bad_id}, timeout=TIMEOUT)
            assert r.status_code == 400 or r.status_code == 422, f"Expected 400 or 422 for bad trackingId '{bad_id}', got {r.status_code}"
            resp = r.json()
            assert resp.get("success") is False, f"Expected success=False for bad trackingId '{bad_id}'"
            assert "error" in resp and isinstance(resp["error"], str) and resp["error"], f"Error message missing for bad trackingId '{bad_id}'"

        # 3. Error 404: non-existent trackingId
        non_existent_id = f"NON_EXISTENT_{uuid.uuid4().hex[:8]}"
        r = requests.get(f"{BASE_URL}/api/transport/offers", params={"trackingId": non_existent_id}, timeout=TIMEOUT)
        assert r.status_code == 404, f"Expected 404 for non-existent trackingId, got {r.status_code}"
        resp = r.json()
        assert resp.get("success") is False, "Expected success=False in 404 response"
        assert "error" in resp and isinstance(resp["error"], str) and resp["error"], "Error message missing in 404 response"

    finally:
        # Cleanup: delete created offer - no DELETE endpoint specified in PRD, so skip cleanup
        pass

test_get_transport_offers_by_trackingid()
