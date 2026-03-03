const express = require('express');
const router = express.Router();
const preferencesController = require('../controllers/preferencesController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

router.get('/preferences', authenticate, preferencesController.getPreferences);

router.put('/preferences',
    authenticate,
    [
        body('requiredAmenities').optional().isArray().withMessage('Required amenities must be an array'),
        body('preferredAmenities').optional().isArray().withMessage('Preferred amenities must be an array'),
        body('defaultUseCase').optional().isIn(['meeting', 'event', 'training', 'co-working', 'other']).withMessage('Invalid use case')
    ],
    handleValidationErrors,
    preferencesController.updatePreferences
);

module.exports = router;
