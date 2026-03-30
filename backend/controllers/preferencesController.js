const PreferencesModel = require('../models/preferencesModel');
const { validationResult } = require('express-validator');

const preferencesController = {
    async getPreferences(req, res) {
        try {
            const userId = req.user.id;
            console.log('[DEBUG] getPreferences called for userId:', userId);
            const preferences = await PreferencesModel.findOrCreate(userId);
            console.log('[DEBUG] preferences found:', preferences);
            
            const response = {
                requiredAmenities: preferences.required_amenities ? JSON.parse(preferences.required_amenities) : [],
                preferredAmenities: preferences.preferred_amenities ? JSON.parse(preferences.preferred_amenities) : [],
                defaultUseCase: preferences.default_use_case
            };
            
            res.json(response);
        } catch (error) {
            console.error('Error fetching preferences:', error);
            res.status(500).json({ error: 'Failed to fetch preferences', details: error.message });
        }
    },

    async updatePreferences(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const userId = req.user.id;
            const { requiredAmenities, preferredAmenities, defaultUseCase } = req.body;

            const preferences = await PreferencesModel.upsert(userId, {
                requiredAmenities: requiredAmenities || [],
                preferredAmenities: preferredAmenities || [],
                defaultUseCase: defaultUseCase || null
            });

            res.json({
                message: 'Preferences saved successfully',
                requiredAmenities: preferences.required_amenities ? JSON.parse(preferences.required_amenities) : [],
                preferredAmenities: preferences.preferred_amenities ? JSON.parse(preferences.preferred_amenities) : [],
                defaultUseCase: preferences.default_use_case
            });
        } catch (error) {
            console.error('Error updating preferences:', error);
            res.status(500).json({ error: 'Failed to update preferences' });
        }
    }
};

module.exports = preferencesController;
