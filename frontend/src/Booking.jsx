import React, { useState, useEffect } from 'react';

const Booking = () => {
    const [formData, setFormData] = useState({
        name: '',
        date: '',
        roomId: ''
    });
    const [availableRooms, setAvailableRooms] = useState([]);
    const [status, setStatus] = useState('');

    // Fetch rooms when date changes
    useEffect(() => {
        if (formData.date) {
            fetchRooms(formData.date);
        }
    }, [formData.date]);

    const fetchRooms = async (date) => {
        try {
            const response = await fetch(`http://localhost:3000/rooms?date=${date}`);
            const data = await response.json();
            setAvailableRooms(data);
        } catch (error) {
            console.error("Failed to fetch rooms:", error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('Sending booking request...');

        try {
            const response = await fetch('http://localhost:3000/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    guestName: formData.name, // Mapping UI 'name' to backend 'guestName'
                    roomId: formData.roomId,
                    date: formData.date,
                    userId: null // We don't have user ID in this context yet
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('Success! ' + data.message);
                setFormData({ name: '', date: '', roomId: '' });
                fetchRooms(formData.date); // Refresh list
            } else {
                setStatus('Error: ' + data.message);
            }
        } catch (error) {
            setStatus('Error: Could not connect to server.');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '20px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2>Book a Room</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Date:</label>
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Select Room:</label>
                    <select
                        name="roomId"
                        value={formData.roomId}
                        onChange={handleChange}
                        required
                        disabled={!formData.date}
                        style={{ width: '100%', padding: '8px' }}
                    >
                        <option value="">-- Select a Room --</option>
                        {availableRooms.map(room => (
                            <option key={room.id} value={room.id}>
                                {room.name} ({room.type}) - ${room.price}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Guest Name:</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={!formData.roomId}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#007BFF', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: formData.roomId ? 1 : 0.5 }}
                >
                    Book Selected Room
                </button>
            </form>
            {status && <p style={{ marginTop: '10px', color: status.startsWith('Error') ? 'red' : 'green' }}>{status}</p>}
        </div>
    );
};

export default Booking;
