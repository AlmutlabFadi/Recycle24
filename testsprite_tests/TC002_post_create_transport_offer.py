import requests

BASE_URL = "http://127.0.0.1:3000"
OFFERS_PATH = "/api/transport/offers"
TIMEOUT = 30


def test_post_create_transport_offer():
    headers = {"Content-Type": "application/json"}

    # Helper function to create a valid offer
    def create_offer(tracking_id, driver_id, driver_name, driver_phone, price, rating):
        payload = {
            "trackingId": tracking_id,
            "driverId": driver_id,
            "driverName": driver_name,
            "driverPhone": driver_phone,
            "price": price,
            "rating": rating,
        }
        resp = requests.post(
            BASE_URL + OFFERS_PATH, json=payload, headers=headers, timeout=TIMEOUT
        )
        return resp

    # Assume these IDs do not exist for negative test
    NON_EXISTENT_TRACKING_ID = "NON_EXISTENT_TRACK123"
    NON_EXISTENT_DRIVER_ID = "UNKNOWN_DRV"

    # Positive test: valid input
    valid_tracking_id = "REQ123"
    valid_driver_id = "DRV1"
    valid_driver_name = "Ali"
    valid_driver_phone = "+966500000000"
    valid_price = 1500
    valid_rating = 4.8

    # Try creating a valid offer, then delete if needed
    create_resp = create_offer(
        valid_tracking_id,
        valid_driver_id,
        valid_driver_name,
        valid_driver_phone,
        valid_price,
        valid_rating,
    )
    assert create_resp.status_code == 200, f"Expected 200 but got {create_resp.status_code}"
    result = create_resp.json()
    assert result.get("success") == True
    assert isinstance(result.get("message"), str)

    # 400 test: negative price
    neg_price_payload = {
        "trackingId": valid_tracking_id,
        "driverId": valid_driver_id,
        "driverName": valid_driver_name,
        "driverPhone": valid_driver_phone,
        "price": -10,
        "rating": valid_rating,
    }
    resp_neg_price = requests.post(
        BASE_URL + OFFERS_PATH, json=neg_price_payload, headers=headers, timeout=TIMEOUT
    )
    assert resp_neg_price.status_code == 400
    err_neg_price = resp_neg_price.json()
    assert err_neg_price.get("success") == False
    assert isinstance(err_neg_price.get("error"), str)

    # 400 test: missing fields (e.g. missing price)
    missing_fields_payload = {
        "trackingId": valid_tracking_id,
        "driverId": valid_driver_id,
        "driverName": valid_driver_name,
        "driverPhone": valid_driver_phone,
        # price omitted
        "rating": valid_rating,
    }
    resp_missing = requests.post(
        BASE_URL + OFFERS_PATH, json=missing_fields_payload, headers=headers, timeout=TIMEOUT
    )
    assert resp_missing.status_code == 400
    err_missing = resp_missing.json()
    assert err_missing.get("success") == False
    assert isinstance(err_missing.get("error"), str)

    # 404 test: non-existent trackingId
    invalid_tracking_id_payload = {
        "trackingId": NON_EXISTENT_TRACKING_ID,
        "driverId": valid_driver_id,
        "driverName": valid_driver_name,
        "driverPhone": valid_driver_phone,
        "price": valid_price,
        "rating": valid_rating,
    }
    resp_404_tracking = requests.post(
        BASE_URL + OFFERS_PATH, json=invalid_tracking_id_payload, headers=headers, timeout=TIMEOUT
    )
    assert resp_404_tracking.status_code == 404
    err_404_tracking = resp_404_tracking.json()
    assert err_404_tracking.get("success") == False
    assert isinstance(err_404_tracking.get("error"), str)

    # 404 test: non-existent driverId
    invalid_driver_id_payload = {
        "trackingId": valid_tracking_id,
        "driverId": NON_EXISTENT_DRIVER_ID,
        "driverName": valid_driver_name,
        "driverPhone": valid_driver_phone,
        "price": valid_price,
        "rating": valid_rating,
    }
    resp_404_driver = requests.post(
        BASE_URL + OFFERS_PATH, json=invalid_driver_id_payload, headers=headers, timeout=TIMEOUT
    )
    assert resp_404_driver.status_code == 404
    err_404_driver = resp_404_driver.json()
    assert err_404_driver.get("success") == False
    assert isinstance(err_404_driver.get("error"), str)


test_post_create_transport_offer()