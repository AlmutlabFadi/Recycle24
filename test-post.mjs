import http from 'http';

const data = JSON.stringify({
    trackingId: 'REQ2602OXWDPF',
    driverId: 'user-driver',
    driverName: 'Test Driver',
    driverPhone: '123456',
    price: 5000000,
    rating: 4.8
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/transport/offers',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

console.log("Sending POST Request...");

const req = http.request(options, (res) => {
    let responseData = '';
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', chunk => responseData += chunk);
    res.on('end', () => console.log('Response:', responseData));
});

req.on('error', error => console.error("HTTP Error:", error));
req.write(data);
req.end();
