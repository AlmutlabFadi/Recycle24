import net from 'net';

function checkPort(host) {
    return new Promise((resolve) => {
        const sock = net.connect(3000, host, () => {
            console.log(`Connected to port 3000 on ${host}`);
            sock.destroy();
            resolve(true);
        });
        sock.on('error', (err) => {
            console.error(`Failed to connect to port 3000 on ${host}: ${err.message}`);
            resolve(false);
        });
    });
}

(async () => {
    await checkPort('127.0.0.1');
    await checkPort('localhost');
    await checkPort('::1');
})();
