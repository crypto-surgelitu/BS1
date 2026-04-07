const axios = require('axios');

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

const verifyRecaptcha = async (req, res, next) => {
    const recaptchaToken = req.body.captchaToken;

    if (!recaptchaToken) {
        return res.status(400).json({
            error: 'Captcha verification is required',
            code: 'RECAPTCHA_REQUIRED'
        });
    }

    if (!RECAPTCHA_SECRET_KEY) {
        console.error('reCAPTCHA verification is unavailable: RECAPTCHA_SECRET_KEY is not configured');
        return res.status(503).json({
            error: 'Captcha verification is unavailable. Please contact support.'
        });
    }

    try {
        const response = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            null,
            {
                params: {
                    secret: RECAPTCHA_SECRET_KEY,
                    response: recaptchaToken
                }
            }
        );

        if (!response.data.success) {
            console.warn('reCAPTCHA verification failed:', response.data['error-codes']);
            return res.status(403).json({
                error: 'reCAPTCHA verification failed',
                code: 'RECAPTCHA_FAILED'
            });
        }

        next();
    } catch (error) {
        console.error('reCAPTCHA verification error:', error.message);
        return res.status(503).json({
            error: 'Captcha verification failed. Please try again.'
        });
    }
};

module.exports = verifyRecaptcha;
