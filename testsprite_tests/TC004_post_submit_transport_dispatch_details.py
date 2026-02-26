import requests

BASE_URL = "http://127.0.0.1:3000"
TIMEOUT = 30

def test_post_submit_transport_dispatch_details():
    # First create a transport offer to get a valid trackingId and driverId
    create_offer_url = f"{BASE_URL}/api/transport/offers"
    offer_payload = {
        "trackingId": "REQ_TEST_001",
        "driverId": "DRV_TEST_001",
        "driverName": "Test Driver",
        "driverPhone": "+966500000001",
        "price": 1000,
        "rating": 4.5,
    }
    try:
        # Create transport offer
        response = requests.post(create_offer_url, json=offer_payload, timeout=TIMEOUT)
        assert response.status_code == 200, f"Offer creation failed with status {response.status_code}"
        assert response.json().get("success") is True

        # Accept the offer to simulate offer acceptance (required before dispatch)
        accept_offer_url = create_offer_url
        accept_payload = {
            "trackingId": offer_payload["trackingId"],
            "driverId": offer_payload["driverId"]
        }
        response = requests.patch(accept_offer_url, json=accept_payload, timeout=TIMEOUT)
        assert response.status_code == 200, f"Offer acceptance failed with status {response.status_code}"
        assert response.json().get("success") is True

        # Valid dispatch submission
        dispatch_url = f"{BASE_URL}/api/transport/dispatch"
        valid_payload = {
            "trackingId": offer_payload["trackingId"],
            "eta": "2026-02-22T15:00:00Z",
            "date": "2026-02-22",
            "timeWindow": "15:00-17:00",
            "plateNumber": "ABC-123",
            "vehicleColor": "Blue",
            "vehicleType": "Truck",
            "notes": "On route"
        }
        response = requests.post(dispatch_url, json=valid_payload, timeout=TIMEOUT)
        assert response.status_code == 200, f"Valid dispatch submission failed with status {response.status_code}"
        body = response.json()
        assert body.get("success") is True
        assert isinstance(body.get("message"), str)

        # Dispatch submission with invalid date/time format
        invalid_date_payload = {
            "trackingId": offer_payload["trackingId"],
            "eta": "invalid-date",
            "date": "2026-02-22",
            "timeWindow": "15:00-17:00",
            "plateNumber": "ABC-123",
            "vehicleColor": "Blue",
            "vehicleType": "Truck",
            "notes": "On route"
        }
        response = requests.post(dispatch_url, json=invalid_date_payload, timeout=TIMEOUT)
        assert response.status_code == 400, f"Invalid date format should return 400, got {response.status_code}"
        body = response.json()
        assert body.get("success") is False
        assert "error" in body and isinstance(body["error"], str)

        # Dispatch submission with missing required fields (no plateNumber)
        missing_fields_payload = {
            "trackingId": offer_payload["trackingId"],
            "eta": "2026-02-22T15:00:00Z",
            "date": "2026-02-22",
            "timeWindow": "15:00-17:00",
            # "plateNumber" omitted
            "vehicleColor": "Blue",
            "vehicleType": "Truck",
            "notes": "On route"
        }
        response = requests.post(dispatch_url, json=missing_fields_payload, timeout=TIMEOUT)
        assert response.status_code == 400, f"Missing fields should return 400, got {response.status_code}"
        body = response.json()
        assert body.get("success") is False
        assert "error" in body and isinstance(body["error"], str)

        # Dispatch submission with non-existent trackingId
        not_found_payload = {
            "trackingId": "UNKNOWN_REQ_ID_9999",
            "eta": "2026-02-22T15:00:00Z",
            "date": "2026-02-22",
            "timeWindow": "15:00-17:00",
            "plateNumber": "ABC-123",
            "vehicleColor": "Blue",
            "vehicleType": "Truck",
            "notes": "On route"
        }
        response = requests.post(dispatch_url, json=not_found_payload, timeout=TIMEOUT)
        assert response.status_code == 404, f"Unknown trackingId should return 404, got {response.status_code}"
        body = response.json()
        assert body.get("success") is False
        assert "error" in body and isinstance(body["error"], str)

    finally:
        # Cleanup: delete the offer - no delete endpoint specified, so skip if none
        # Usually, if cleanup is needed, here would be the code to delete created resources.
        pass

test_post_submit_transport_dispatch_details()