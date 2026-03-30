const apiFetch = async (endpoint, options = {}) => {
    const response = await fetch(`http://localhost:3000${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    return response;
};

async function testCancelBooking() {
    console.log('=== Testing Cancel Booking Flow ===\n');

    try {
        const registerRes = await apiFetch('/signup', {
            method: 'POST',
            body: {
                email: `testcancel_${Date.now()}@test.com`,
                password: 'Test123!',
                full_name: 'Cancel Test User',
                phone_number: '0712345678'
            }
        });

        const registerData = await registerRes.json();
        console.log('1. Registration:', registerRes.ok ? '✓ Success' : '✗ Failed', registerData.email ? `(user: ${registerData.email})` : '');

        if (!registerRes.ok) {
            console.log('\nSkipping cancel test - registration failed');
            return;
        }

        const loginRes = await apiFetch('/login', {
            method: 'POST',
            body: {
                email: registerData.email,
                password: 'Test123!'
            }
        });

        const loginData = await loginRes.json();
        console.log('2. Login:', loginRes.ok ? '✓ Success' : '✗ Failed');

        if (!loginRes.ok) return;

        const token = loginData.accessToken || loginData.tokens?.accessToken;
        console.log('   Token received:', token ? '✓' : '✗');

        const headers = { 'Authorization': `Bearer ${token}` };

        const roomsRes = await apiFetch('/rooms', { headers });
        const rooms = await roomsRes.json();
        console.log('3. Get Rooms:', roomsRes.ok ? `✓ Found ${rooms.length} rooms` : '✗ Failed');

        if (!rooms.length) {
            console.log('\nSkipping booking test - no rooms available');
            return;
        }

        const bookRes = await apiFetch('/book', {
            method: 'POST',
            headers,
            body: {
                userId: loginData.user?.id,
                roomId: rooms[0].id,
                date: new Date().toISOString().split('T')[0],
                startTime: '09:00',
                endTime: '10:00',
                type: 'booking'
            }
        });

        const bookData = await bookRes.json();
        console.log('4. Create Booking:', bookRes.ok ? '✓ Success' : `✗ Failed (${bookData.error || bookRes.status})`);

        if (!bookRes.ok || !bookData.booking?.id) {
            console.log('   Response:', JSON.stringify(bookData).substring(0, 200));
            return;
        }

        const bookingId = bookData.booking.id;

        const cancelRes = await apiFetch(`/bookings/${bookingId}/cancel`, {
            method: 'PUT',
            headers,
            body: {
                reason: 'Test cancellation - booking service working correctly'
            }
        });

        const cancelData = await cancelRes.json();
        console.log('5. Cancel Booking:', cancelRes.ok ? '✓ SUCCESS!' : `✗ Failed (${cancelData.error || cancelRes.status})`);

        if (cancelRes.ok) {
            console.log('\n=== CANCEL BOOKING IS WORKING ===');
        } else {
            console.log('   Error:', cancelData.error || cancelData.details || 'Unknown error');
        }

    } catch (err) {
        console.error('\nTest Error:', err.message);
    }
}

testCancelBooking();