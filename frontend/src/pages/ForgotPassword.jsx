import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import authService from '../services/authService';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.forgotPassword(email);
            if (response.success) {
                setSuccess(true);
            } else {
                setError(response.error || 'Failed to send reset email. Please try again.');
            }
        } catch {
            setError('Connection failed. Please check your network and try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-success-icon">
                        <CheckCircle size={48} color="#16a34a" />
                    </div>
                    <h2 className="auth-title">Check Your Email</h2>
                    <p className="auth-subtitle">
                        If <strong>{email}</strong> is registered, you'll receive a password reset link shortly.
                    </p>
                    <p className="auth-note">The link expires in 1 hour. Check your spam folder if you don't see it.</p>
                    <Link to="/login" className="auth-link-btn">
                        <ArrowLeft size={16} /> Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-icon">
                    <Mail size={40} />
                </div>
                <h2 className="auth-title">Forgot Password?</h2>
                <p className="auth-subtitle">Enter your email and we'll send you a reset link.</p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoFocus
                        />
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="auth-footer">
                    <Link to="/login" className="auth-link">
                        <ArrowLeft size={14} /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
