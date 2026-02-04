import net from 'net';

const probe = (port) => {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(200);
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.on('error', () => {
            resolve(false);
        });
        socket.connect(port, '127.0.0.1');
    });
};

const checkPorts = async () => {
    const ports = [5000, 5001, 5002, 5003, 5004, 5005, 5006, 5173];
    for (const port of ports) {
        if (await probe(port)) {
            console.log(`Port ${port} is OPEN`);
        }
    }
};

checkPorts();
