import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, RotateCcw } from 'lucide-react';
import authService from '../services/authService';

const RECAPTCHA_SITE_KEY = '6Ld9vHAsAAAAALZLg1TvrkYJCA9WiPkNU2Ml_s83';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [recaptchaReady, setRecaptchaReady] = useState(false);
    const recaptchaRef = useRef(null);
    const widgetId = useRef(null);

    useEffect(() => {
        const loadRecaptcha = () => {
            if (window.grecaptcha && window.grecaptcha.render) {
                setRecaptchaReady(true);
            } else {
                // Poll for grecaptcha to be fully loaded
                const checkRecaptcha = setInterval(() => {
                    if (window.grecaptcha && window.grecaptcha.render) {
                        clearInterval(checkRecaptcha);
                        setRecaptchaReady(true);
                    }
                }, 100);
                
                // Safety timeout
                setTimeout(() => clearInterval(checkRecaptcha), 5000);
            }
        };

        if (!window.grecaptcha) {
            const script = document.createElement('script');
            script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
            script.async = true;
            script.defer = true;
            script.onload = loadRecaptcha;
            script.onerror = () => {
                console.error('Failed to load reCAPTCHA script');
                setError('Failed to load captcha. Please refresh and try again.');
            };
            document.head.appendChild(script);
        } else {
            loadRecaptcha();
        }
    }, []);

    useEffect(() => {
        if (recaptchaReady && window.grecaptcha && window.grecaptcha.render && recaptchaRef.current && widgetId.current === null) {
            try {
                widgetId.current = window.grecaptcha.render(recaptchaRef.current, {
                    sitekey: RECAPTCHA_SITE_KEY,
                    theme: 'light'
                });
            } catch (err) {
                console.error('reCAPTCHA render error:', err);
            }
        }
    }, [recaptchaReady]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        let captchaToken = '';
        try {
            if (window.grecaptcha && widgetId.current !== null) {
                captchaToken = window.grecaptcha.getResponse(widgetId.current);
            }
        } catch (err) {
            console.error('Captcha error:', err);
        }
        
        if (!captchaToken) {
            setError('Please complete the captcha verification.');
            return;
        }
        
        setError('');
        setLoading(true);

        try {
            const response = await authService.forgotPassword(email, captchaToken);
            if (response.success) {
                setSuccess(true);
            } else {
                setError(response.error || 'Failed to send reset PIN. Please try again.');
            }
        } catch {
            setError('Connection failed. Please check your network and try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (success && email) {
            const timer = setTimeout(() => {
                navigate('/reset-password-pin', { state: { email } });
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [success, email, navigate]);

    if (success) {
        return (
            <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="text-green-600 w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Check Your Email</h1>
                        <p className="text-gray-500 mt-2 text-center">
                            We've sent a <strong>6-digit PIN</strong> to <br />
                            <span className="font-medium text-gray-700">{email}</span>
                        </p>
                    </div>
                    <p className="text-sm text-gray-500 text-center mb-6">
                        Redirecting to enter PIN... (expires in 15 minutes)
                    </p>
                    <div className="mt-4 text-center">
                        <Link to="/login" className="text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <RotateCcw className="text-blue-600 w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
                    <p className="text-gray-500 mt-2">Enter your email and we'll send you a reset PIN.</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900 placeholder-gray-400"
                                placeholder="you@example.com"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Verify you're human</label>
                        <div className="bg-gray-100 p-4 rounded-lg flex justify-center items-center min-h-[78px]">
                            {recaptchaReady ? (
                                <div ref={recaptchaRef}></div>
                            ) : (
                                <span className="text-gray-500">Loading captcha...</span>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sending PIN...' : 'Send Reset PIN'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-1">
                        <ArrowLeft className="w-4 h-4" /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
