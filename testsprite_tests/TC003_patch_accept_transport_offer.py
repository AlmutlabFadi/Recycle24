import requests

BASE_URL = "http://127.0.0.1:3000"
TIMEOUT = 30

def test_patch_accept_transport_offer():
    offers_url = f"{BASE_URL}/api/transport/offers"
    headers = {"Content-Type": "application/json"}

    # Step 1: Create a valid offer to patch later
    offer_payload = {
        "trackingId": "REQ123",
        "driverId": "DRV1",
        "driverName": "Ali",
        "driverPhone": "+966500000000",
        "price": 1500,
        "rating": 4.8
    }

    try:
        resp_create = requests.post(offers_url, json=offer_payload, headers=headers, timeout=TIMEOUT)
        assert resp_create.status_code == 200, f"Expected 200 creating offer, got {resp_create.status_code}"
        json_create = resp_create.json()
        assert json_create.get("success") is True

        # Step 2: PATCH accept with valid trackingId and driverId -> expect 200 success
        patch_payload = {
            "trackingId": offer_payload["trackingId"],
            "driverId": offer_payload["driverId"]
        }
        resp_patch = requests.patch(offers_url, json=patch_payload, headers=headers, timeout=TIMEOUT)
        assert resp_patch.status_code == 200, f"Expected 200 on patch accept, got {resp_patch.status_code}"
        json_patch = resp_patch.json()
        assert json_patch.get("success") is True
        assert "message" in json_patch and isinstance(json_patch["message"], str)

        # Step 3: PATCH accept with invalid input (e.g. empty trackingId, missing driverId or empty string driverId) -> expect 400
        invalid_inputs = [
            {"trackingId": "", "driverId": "SomeDriver"},
            {"trackingId": "SomeTracking", "driverId": ""},
            {"trackingId": "SomeTracking"},  # Missing driverId
            {"driverId": "SomeDriver"}       # Missing trackingId
        ]
        for invalid_payload in invalid_inputs:
            resp_invalid = requests.patch(offers_url, json=invalid_payload, headers=headers, timeout=TIMEOUT)
            assert resp_invalid.status_code == 400, f"Expected 400 for invalid input {invalid_payload}, got {resp_invalid.status_code}"
            json_invalid = resp_invalid.json()
            assert json_invalid.get("success") is False
            assert "error" in json_invalid and isinstance(json_invalid["error"], str)

        # Step 4: PATCH accept with non-existent offer or driver -> expect 404
        non_existent_cases = [
            {"trackingId": "NON_EXISTENT_REQ", "driverId": offer_payload["driverId"]},
            {"trackingId": offer_payload["trackingId"], "driverId": "UNKNOWN_DRIVER"},
            {"trackingId": "NON_EXISTENT_REQ", "driverId": "UNKNOWN_DRIVER"}
        ]
        for case in non_existent_cases:
            resp_404 = requests.patch(offers_url, json=case, headers=headers, timeout=TIMEOUT)
            assert resp_404.status_code == 404, f"Expected 404 for non-existent case {case}, got {resp_404.status_code}"
            json_404 = resp_404.json()
            assert json_404.get("success") is False
            assert "error" in json_404 and isinstance(json_404["error"], str)

    finally:
        # Cleanup - no delete endpoint available per PRD
        pass

test_patch_accept_transport_offer()
