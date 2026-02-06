// using native http module

// If node-fetch is not available (since it's not in package.json), we might need to use http/https module or install it.
// Given the environment, I'll use standard http module to avoid install overhead if possible,
// but fetch is easier. Let's see if I can just use a simple http request.

const http = require('http');

const data = JSON.stringify({
    name: "Test User",
    roomType: "Suite",
    date: "2024-01-01"
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/book',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log('Response:', responseData);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
