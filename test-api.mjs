import http from 'http';

http.get('http://localhost:3000/api/transport/orders?status=OPEN&view=driver&limit=50', {
    headers: {
        // Need a valid session cookie to bypass the 401 Unauthorized
        // Actually, curl without cookie will get 401. So the user is logged in the browser.
    }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(data));
});
