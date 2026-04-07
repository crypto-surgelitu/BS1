require('dotenv').config();

const BASE_URL = process.env.TEST_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
const ACCESS_TOKEN = process.env.TEST_ACCESS_TOKEN || '';
const BOOKING_ID = process.env.TEST_BOOKING_ID || '1';

const parseCookieHeader = (setCookieHeaders = []) =>
    setCookieHeaders
        .map(cookie => cookie.split(';')[0])
        .join('; ');

(async () => {
    try {
        const healthResponse = await fetch(`${BASE_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('Health:', healthResponse.status, healthData);

        if (!ACCESS_TOKEN) {
            console.log('Set TEST_ACCESS_TOKEN to run the authenticated booking-status test.');
            return;
        }

        const csrfResponse = await fetch(`${BASE_URL}/csrf-token`);
        const csrfData = await csrfResponse.json();
        const cookieHeader = parseCookieHeader(csrfResponse.headers.getSetCookie?.() || []);

        const response = await fetch(`${BASE_URL}/bookings/${BOOKING_ID}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'X-CSRF-Token': csrfData.csrfToken,
                ...(cookieHeader ? { Cookie: cookieHeader } : {})
            },
            body: JSON.stringify({ status: 'confirmed' })
        });

        const data = await response.json();
        console.log('Booking status update:', response.status, data);
    } catch (error) {
        console.error(error);
        process.exitCode = 1;
    }
})();
