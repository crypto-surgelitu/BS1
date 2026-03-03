const { dbPromise } = require('../config/db');

const PreferencesModel = {
    async findByUserId(userId) {
        const [rows] = await dbPromise.query(
            'SELECT * FROM user_preferences WHERE user_id = ?',
            [userId]
        );
        return rows.length > 0 ? rows[0] : null;
    },

    async findOrCreate(userId) {
        let preferences = await this.findByUserId(userId);
        if (!preferences) {
            const [result] = await dbPromise.query(
                'INSERT INTO user_preferences (user_id) VALUES (?)',
                [userId]
            );
            preferences = {
                id: result.insertId,
                user_id: userId,
                required_amenities: null,
                preferred_amenities: null,
                default_use_case: null
            };
        }
        return preferences;
    },

    async upsert(userId, { requiredAmenities, preferredAmenities, defaultUseCase }) {
        const existing = await this.findByUserId(userId);
        
        if (existing) {
            await dbPromise.query(
                `UPDATE user_preferences 
                 SET required_amenities = ?, preferred_amenities = ?, default_use_case = ?
                 WHERE user_id = ?`,
                [
                    JSON.stringify(requiredAmenities || []),
                    JSON.stringify(preferredAmenities || []),
                    defaultUseCase || null,
                    userId
                ]
            );
        } else {
            await dbPromise.query(
                `INSERT INTO user_preferences (user_id, required_amenities, preferred_amenities, default_use_case)
                 VALUES (?, ?, ?, ?)`,
                [
                    userId,
                    JSON.stringify(requiredAmenities || []),
                    JSON.stringify(preferredAmenities || []),
                    defaultUseCase || null
                ]
            );
        }
        
        return this.findByUserId(userId);
    }
};

module.exports = PreferencesModel;
