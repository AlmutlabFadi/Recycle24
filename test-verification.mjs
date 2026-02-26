async function test() {
    try {
        const response = await fetch('http://localhost:3000/api/verification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: 'test-user-id-' + Date.now(),
                licensePlate: 'دمشق 123456',
                vehicleType: 'كيا',
                vehicleColor: 'ابيض',
                governorate: 'دمشق'
            })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Data:', data);
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

test();
