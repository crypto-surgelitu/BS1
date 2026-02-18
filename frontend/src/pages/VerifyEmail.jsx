import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import authService from '../services/authService';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('verifying'); // verifying | success | error
    const [error, setError] = useState('');
    const [resendEmail, setResendEmail] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    useEffect(() => {
        if (token) {
            verifyToken();
        } else {
            setStatus('error');
            setError('No verification token provided.');
        }
    }, [token]);

    const verifyToken = async () => {
        try {
            const response = await authService.verifyEmail(token);
            if (response.success) {
                setStatus('success');
            } else {
                setStatus('error');
                setError(response.error || 'Verification failed. The link may have expired.');
            }
        } catch {
            setStatus('error');
            setError('Connection failed. Please try again.');
        }
    };

    const handleResend = async (e) => {
        e.preventDefault();
        setResendLoading(true);
        try {
            await authService.resendVerification(resendEmail);
            setResendSuccess(true);
        } catch {
            setError('Failed to resend. Please try again.');
        } finally {
            setResendLoading(false);
        }
    };

    if (status === 'verifying') {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-icon spinning">
                        <Mail size={40} />
                    </div>
                    <h2 className="auth-title">Verifying your email...</h2>
                    <p className="auth-subtitle">Please wait a moment.</p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-success-icon">
                        <CheckCircle size={48} color="#16a34a" />
                    </div>
                    <h2 className="auth-title">Email Verified! 🎉</h2>
                    <p className="auth-subtitle">Your email has been verified successfully. You can now log in.</p>
                    <Link to="/login" className="auth-btn" style={{ display: 'inline-block', marginTop: '16px' }}>
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-success-icon">
                    <XCircle size={48} color="#dc2626" />
                </div>
                <h2 className="auth-title">Verification Failed</h2>
                <p className="auth-subtitle">{error}</p>

                {!resendSuccess ? (
                    <form onSubmit={handleResend} className="auth-form" style={{ marginTop: '24px' }}>
                        <p style={{ marginBottom: '8px', fontWeight: '500' }}>Resend verification email:</p>
                        <div className="form-group">
                            <input
                                type="email"
                                value={resendEmail}
                                onChange={(e) => setResendEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                        <button type="submit" className="auth-btn" disabled={resendLoading}>
                            <RefreshCw size={16} />
                            {resendLoading ? 'Sending...' : 'Resend Verification'}
                        </button>
                    </form>
                ) : (
                    <p className="auth-note" style={{ color: '#16a34a', marginTop: '16px' }}>
                        ✅ Verification email sent! Check your inbox.
                    </p>
                )}

                <div className="auth-footer">
                    <Link to="/login" className="auth-link">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
