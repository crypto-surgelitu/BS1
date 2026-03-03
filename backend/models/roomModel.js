const { dbPromise } = require('../config/db');

const RoomModel = {
    async findAll(date) {
        const query = `
            SELECT 
                r.*,
                (SELECT b.type FROM bookings b 
                 WHERE b.room_id = r.id 
                 AND b.booking_date = ? 
                 AND b.status IN ('pending', 'confirmed')
                 LIMIT 1) as current_booking_type
            FROM rooms r
            ORDER BY r.name
        `;
        const [rows] = await dbPromise.query(query, [date]);
        return rows;
    },

    async findAvailableWithFilters(date, requiredAmenities = [], preferredAmenities = []) {
        const query = `
            SELECT 
                r.*,
                (SELECT b.type FROM bookings b 
                 WHERE b.room_id = r.id 
                 AND b.booking_date = ? 
                 AND b.status IN ('pending', 'confirmed')
                 LIMIT 1) as current_booking_type
            FROM rooms r
            WHERE r.status = 'Available'
            ORDER BY r.name
        `;
        const [rows] = await dbPromise.query(query, [date]);
        
        let filtered = rows;
        
        if (requiredAmenities.length > 0) {
            filtered = filtered.filter(room => {
                const roomAmenities = room.amenities ? JSON.parse(room.amenities).map(a => a.toLowerCase()) : [];
                return requiredAmenities.every(req => roomAmenities.includes(req.toLowerCase()));
            });
        }
        
        if (preferredAmenities.length > 0 || filtered.length > 0) {
            filtered = filtered.map(room => {
                const roomAmenities = room.amenities ? JSON.parse(room.amenities).map(a => a.toLowerCase()) : [];
                const matchedPreferred = preferredAmenities.filter(pref => 
                    roomAmenities.includes(pref.toLowerCase())
                ).length;
                return {
                    ...room,
                    matchedPreferredCount: matchedPreferred,
                    preferredMatchPercentage: preferredAmenities.length > 0 
                        ? Math.round((matchedPreferred / preferredAmenities.length) * 100) 
                        : 100
                };
            });
            
            if (preferredAmenities.length > 0) {
                filtered.sort((a, b) => b.matchedPreferredCount - a.matchedPreferredCount);
            }
        }
        
        return filtered;
    },

    async findById(id) {
        const [rows] = await dbPromise.query(
            'SELECT * FROM rooms WHERE id = ?',
            [id]
        );
        return rows;
    },

    async create(name, space, capacity, amenities) {
        const [result] = await dbPromise.query(
            'INSERT INTO rooms (name, space, capacity, amenities, status) VALUES (?, ?, ?, ?, ?)',
            [name, space, capacity, JSON.stringify(amenities || []), 'Available']
        );
        return result;
    },

    async deleteById(id) {
        // First delete related bookings to maintain integrity
        await dbPromise.query('DELETE FROM bookings WHERE room_id = ?', [id]);
        const [result] = await dbPromise.query('DELETE FROM rooms WHERE id = ?', [id]);
        return result;
    },

    async updateById(id, name, space, capacity, amenities) {
        const [result] = await dbPromise.query(
            'UPDATE rooms SET name = ?, space = ?, capacity = ?, amenities = ? WHERE id = ?',
            [name, space, capacity, JSON.stringify(amenities || []), id]
        );
        return result;
    }
};

module.exports = RoomModel;
