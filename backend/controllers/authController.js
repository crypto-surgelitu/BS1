const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const sendMail = require('../utils/mailer');
const {
    generateAccessToken,
    generateRefreshToken,
    generateTempToken,
    generateSecureToken
} = require('../utils/tokenUtils');

// ============================================================
// ACCOUNT LOCKOUT CONFIG
// ============================================================
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

// ============================================================
// AUTH CONTROLLER
// ============================================================

const authController = {

    // ----------------------------------------------------------
    // SIGNUP
    // ----------------------------------------------------------
    async signup(req, res) {
        const { email, password, fullName, department } = req.body;

        if (email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()) {
            return res.status(403).json({ error: 'Cannot use admin email for signup' });
        }

        try {
            const existing = await UserModel.findByEmail(email);
            if (existing.length > 0) {
                return res.status(409).json({ error: 'Email already registered' });
            }

            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);
            const result = await UserModel.create(email, passwordHash, fullName, department);

            const newUser = { id: result.insertId, email, role: 'user' };

            // Generate email verification token
            const verificationToken = generateSecureToken();
            const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            await UserModel.setVerificationToken(newUser.id, verificationToken, verificationExpires);

            // Generate auth tokens
            const accessToken = generateAccessToken(newUser);
            const refreshToken = generateRefreshToken(newUser);

            // Send verification email (non-blocking)
            const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
            sendMail(
                email,
                'Verify Your Email - SwahiliPot Hub',
                `Hello ${fullName},\n\nPlease verify your email by clicking: ${verifyUrl}\n\nThis link expires in 24 hours.\n\nSwahiliPot Hub Team`,
                `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                    <h2 style="color:#0B4F6C;">Welcome to SwahiliPot Hub! 🎉</h2>
                    <p>Hello <strong>${fullName}</strong>,</p>
                    <p>Please verify your email address to activate your account.</p>
                    <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#0B4F6C;color:white;text-decoration:none;border-radius:6px;margin:16px 0;">Verify Email</a>
                    <p style="color:#666;font-size:12px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
                </div>`
            ).catch(err => console.error('Failed to send verification email:', err.message));

            console.log(`✅ New user registered: ${email}`);

            res.status(201).json({
                message: 'User registered successfully. Please check your email to verify your account.',
                user: { id: newUser.id, email, fullName, department, role: 'user', emailVerified: false },
                accessToken,
                refreshToken
            });

        } catch (error) {
            console.error('Signup error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    },

    // ----------------------------------------------------------
    // LOGIN (with Account Lockout & 2FA Enforcement)
    // ----------------------------------------------------------
    async login(req, res) {
        const { email, password } = req.body;

        try {
            const results = await UserModel.findByEmail(email);

            if (results.length === 0) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const user = results[0];

            // Check if account is locked
            const lockInfo = await UserModel.isAccountLocked(user.id);
            if (lockInfo) {
                const unlockTime = new Date(lockInfo.locked_until);
                const minutesLeft = Math.ceil((unlockTime - Date.now()) / 60000);
                return res.status(423).json({
                    error: `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft > 0 ? minutesLeft : 1} minute(s).`,
                    code: 'ACCOUNT_LOCKED',
                    lockedUntil: unlockTime.toISOString()
                });
            }

            const match = await bcrypt.compare(password, user.password_hash);

            if (!match) {
                // Increment failed attempts
                await UserModel.incrementFailedAttempts(user.id);

                const newAttempts = (user.failed_login_attempts || 0) + 1;
                if (newAttempts >= MAX_FAILED_ATTEMPTS) {
                    const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
                    await UserModel.lockAccount(user.id, lockedUntil);
                    console.warn(`🔒 Account locked: ${email} after ${newAttempts} failed attempts`);
                    return res.status(423).json({
                        error: `Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.`,
                        code: 'ACCOUNT_LOCKED'
                    });
                }

                const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
                return res.status(401).json({
                    error: `Invalid email or password. ${remaining} attempt(s) remaining before lockout.`
                });
            }

            // Successful login - reset failed attempts
            await UserModel.resetFailedAttempts(user.id);

            // 2FA CHECK
            if (user.totp_enabled) {
                const tempToken = generateTempToken(user);
                console.log(`🔐 2FA required for user: ${user.email}`);
                return res.json({
                    require2fa: true,
                    tempToken: tempToken,
                    userId: user.id
                });
            }

            // STANDARD LOGIN
            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);

            console.log(`✅ User logged in: ${user.email}`);

            res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    department: user.department,
                    role: user.role,
                    emailVerified: !!user.email_verified,
                    totpEnabled: !!user.totp_enabled
                },
                accessToken,
                refreshToken
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    },

    // ----------------------------------------------------------
    // EMAIL VERIFICATION
    // ----------------------------------------------------------
    async verifyEmail(req, res) {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Verification token is required' });
        }

        try {
            const users = await UserModel.findByVerificationToken(token);
            if (users.length === 0) {
                return res.status(400).json({ error: 'Invalid or expired verification token' });
            }

            await UserModel.markEmailVerified(users[0].id);
            console.log(`✅ Email verified: ${users[0].email}`);

            res.json({ message: 'Email verified successfully. You can now log in.' });

        } catch (error) {
            console.error('Email verification error:', error);
            res.status(500).json({ error: 'Email verification failed' });
        }
    },

    // ----------------------------------------------------------
    // RESEND VERIFICATION EMAIL
    // ----------------------------------------------------------
    async resendVerification(req, res) {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        try {
            const users = await UserModel.findByEmail(email);
            if (users.length === 0) {
                return res.json({ message: 'If that email exists, a verification link has been sent.' });
            }

            const user = users[0];
            if (user.email_verified) {
                return res.status(400).json({ error: 'Email is already verified' });
            }

            const verificationToken = generateSecureToken();
            const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await UserModel.setVerificationToken(user.id, verificationToken, verificationExpires);

            const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
            sendMail(
                email,
                'Verify Your Email - SwahiliPot Hub',
                `Please verify your email: ${verifyUrl}`,
                `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                    <h2 style="color:#0B4F6C;">Email Verification</h2>
                    <p>Click below to verify your email address:</p>
                    <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#0B4F6C;color:white;text-decoration:none;border-radius:6px;margin:16px 0;">Verify Email</a>
                    <p style="color:#666;font-size:12px;">This link expires in 24 hours.</p>
                </div>`
            ).catch(err => console.error('Failed to send resend email:', err.message));

            res.json({ message: 'If that email exists, a verification link has been sent.' });

        } catch (error) {
            console.error('Resend verification error:', error);
            res.status(500).json({ error: 'Failed to resend verification email' });
        }
    },

    // ----------------------------------------------------------
    // FORGOT PASSWORD
    // ----------------------------------------------------------
    async forgotPassword(req, res) {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        try {
            const users = await UserModel.findByEmail(email);

            if (users.length === 0) {
                return res.json({ message: 'If that email is registered, a password reset link has been sent.' });
            }

            const user = users[0];
            const resetToken = generateSecureToken();
            const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
            await UserModel.setPasswordResetToken(user.id, resetToken, resetExpires);

            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
            sendMail(
                email,
                'Password Reset - SwahiliPot Hub',
                `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
                `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                    <h2 style="color:#0B4F6C;">Password Reset Request</h2>
                    <p>Hello <strong>${user.full_name}</strong>,</p>
                    <p>We received a request to reset your password. Click below to proceed:</p>
                    <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#dc2626;color:white;text-decoration:none;border-radius:6px;margin:16px 0;">Reset Password</a>
                    <p style="color:#666;font-size:12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
                </div>`
            ).catch(err => console.error('Failed to send forgot password email:', err.message));

            console.log(`📧 Password reset email sent to: ${email}`);
            res.json({ message: 'If that email is registered, a password reset link has been sent.' });

        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({ error: 'Failed to process password reset request' });
        }
    },

    // ----------------------------------------------------------
    // RESET PASSWORD
    // ----------------------------------------------------------
    async resetPassword(req, res) {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        try {
            const users = await UserModel.findByPasswordResetToken(token);
            if (users.length === 0) {
                return res.status(400).json({ error: 'Invalid or expired password reset token' });
            }

            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(newPassword, saltRounds);
            await UserModel.updatePassword(users[0].id, passwordHash);

            console.log(`✅ Password reset for: ${users[0].email}`);

            sendMail(
                users[0].email,
                'Password Changed - SwahiliPot Hub',
                'Your password has been changed successfully.',
                `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                    <h2 style="color:#0B4F6C;">Password Changed</h2>
                    <p>Your password has been changed successfully.</p>
                    <p>If you did not make this change, please contact support immediately.</p>
                </div>`
            ).catch(err => console.error('Failed to send password changed email:', err.message));

            res.json({ message: 'Password reset successfully. You can now log in with your new password.' });

        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({ error: 'Password reset failed' });
        }
    },

    // ----------------------------------------------------------
    // REFRESH TOKEN
    // ----------------------------------------------------------
    async refreshToken(req, res) {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        try {
            const decoded = jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
            );

            const results = await UserModel.findByEmail(decoded.email);
            if (results.length === 0) {
                return res.status(401).json({ error: 'User not found' });
            }

            const user = results[0];
            const newAccessToken = generateAccessToken(user);

            res.json({ message: 'Token refreshed successfully', accessToken: newAccessToken });

        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: 'Invalid refresh token' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Refresh token expired. Please login again.' });
            }
            console.error('Token refresh error:', error);
            res.status(500).json({ error: 'Token refresh failed' });
        }
    },

    // ----------------------------------------------------------
    // GET CURRENT USER
    // ----------------------------------------------------------
    async getCurrentUser(req, res) {
        try {
            const results = await UserModel.findByEmail(req.user.email);
            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const user = results[0];
            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    department: user.department,
                    role: user.role,
                    emailVerified: !!user.email_verified,
                    totpEnabled: !!user.totp_enabled,
                    createdAt: user.created_at
                }
            });
        } catch (error) {
            console.error('Get current user error:', error);
            res.status(500).json({ error: 'Failed to fetch user data' });
        }
    }
};

module.exports = authController;
