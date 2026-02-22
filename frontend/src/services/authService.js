import { apiFetch, authenticatedFetch, saveTokens, clearAuth } from './api';

const authService = {
    /**
     * Login user and store tokens
     */
    async login(email, password) {
        const response = await apiFetch('/login', {
            method: 'POST',
            body: { email, password },
        });

        const data = await response.json();

        if (response.ok) {
            // Check if 2FA is required
            if (data.require2fa) {
                return {
                    success: true,
                    require2fa: true,
                    tempToken: data.tempToken,
                    userId: data.userId
                };
            }

            // Check if password reset OTP is required
            if (data.requirePasswordResetOtp) {
                return {
                    success: true,
                    requirePasswordResetOtp: true,
                    tempToken: data.tempToken,
                    userId: data.userId,
                    message: data.message
                };
            }

            // Check if user data exists
            if (!data.user) {
                return { success: false, error: 'Invalid server response: no user data', status: response.status };
            }

            // Store tokens and user data
            saveTokens(data.accessToken, data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            return { success: true, data };
        }

        return { success: false, error: data.error, status: response.status };
    },

    /**
     * Admin login with reCAPTCHA
     */
    async adminLogin(email, password, captchaToken) {
        const response = await apiFetch('/admin/login', {
            method: 'POST',
            body: { email, password, captchaToken },
        });

        if (response.ok) {
            const data = await response.json();

            if (data.require2fa) {
                return {
                    success: true,
                    require2fa: true,
                    tempToken: data.tempToken,
                    userId: data.userId
                };
            }

            saveTokens(data.accessToken, data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            return { success: true, data };
        }

        const error = await response.json();
        return { success: false, error: error.error, status: response.status };
    },

    /**
     * Signup new user and store tokens
     */
    async signup(email, password, fullName, department) {
        const response = await apiFetch('/signup', {
            method: 'POST',
            body: { email, password, fullName, department },
        });

        if (response.ok) {
            const data = await response.json();
            // Store tokens and user data
            saveTokens(data.accessToken, data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            return { success: true, data };
        }

        const error = await response.json();
        return { success: false, error: error.error || error.details, status: response.status };
    },

    /**
     * Logout user and clear tokens
     */
    logout() {
        clearAuth();
        window.location.href = '/login';
    },

    /**
     * Get current user from localStorage
     */
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!localStorage.getItem('accessToken');
    },

    /**
     * Check if current user is admin
     */
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    },

    /**
     * Fetch current user data from server (with authentication)
     */
    async fetchCurrentUser() {
        const response = await authenticatedFetch('/me', {
            method: 'GET',
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('user', JSON.stringify(data.user));
            return { success: true, data: data.user };
        }

        return { success: false, error: 'Failed to fetch user data' };
    },

    /**
     * Verify 2FA code during login
     */
    async verify2fa(code, tempToken) {
        const response = await apiFetch('/auth/2fa/verify', {
            method: 'POST',
            body: { code, tempToken },
        });

        if (response.ok) {
            const data = await response.json();
            saveTokens(data.accessToken, data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            return { success: true, data };
        }

        const error = await response.json();
        return { success: false, error: error.error, status: response.status };
    },

    /**
     * Request password reset PIN
     */
    async forgotPassword(email, captchaToken) {
        const response = await apiFetch('/forgot-password', {
            method: 'POST',
            body: { email, captchaToken },
        });

        if (response.ok) {
            return { success: true };
        }

        const error = await response.json();
        return { success: false, error: error.error };
    },

    /**
     * Reset password with PIN
     */
    async resetPasswordWithPin(pin, newPassword) {
        const response = await apiFetch('/reset-password-pin', {
            method: 'POST',
            body: { pin, newPassword },
        });

        if (response.ok) {
            return { success: true };
        }

        const error = await response.json();
        return { success: false, error: error.error };
    },

    /**
     * Verify password reset OTP after login
     */
    async verifyPasswordResetOtp(otp, tempToken) {
        const response = await apiFetch('/verify-password-reset-otp', {
            method: 'POST',
            body: { otp, tempToken },
        });

        if (response.ok) {
            const data = await response.json();
            saveTokens(data.accessToken, data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            return { success: true, data };
        }

        const error = await response.json();
        return { success: false, error: error.error };
    },

    /**
     * Resend password reset OTP
     */
    async resendPasswordResetOtp(tempToken) {
        const response = await apiFetch('/resend-password-reset-otp', {
            method: 'POST',
            body: { tempToken },
        });

        if (response.ok) {
            return { success: true };
        }

        const error = await response.json();
        return { success: false, error: error.error };
    },

    /**
     * Get active users (admin only)
     */
    async getActiveUsers() {
        const response = await authenticatedFetch('/active-users', {
            method: 'GET',
        });

        if (response.ok) {
            const data = await response.json();
            return { success: true, activeUsers: data.activeUsers };
        }

        return { success: false, error: 'Failed to fetch active users' };
    },

    /**
     * Disconnect a specific user (admin only)
     */
    async disconnectUser(userId) {
        const response = await authenticatedFetch(`/disconnect-user/${userId}`, {
            method: 'POST',
        });

        if (response.ok) {
            return { success: true };
        }

        const error = await response.json();
        return { success: false, error: error.error };
    },

    /**
     * Logout and notify server to remove session
     */
    async logoutWithNotification() {
        try {
            await authenticatedFetch('/logout', {
                method: 'POST',
            });
        } catch (e) {
            // Ignore errors, local logout always works
        }
        clearAuth();
        window.location.href = '/login';
    },

    /**
     * Generate a strong password suggestion
     */
    async generatePassword(length = 16) {
        const response = await apiFetch(`/generate-password?length=${length}`, {
            method: 'GET',
        });

        if (response.ok) {
            const data = await response.json();
            return { success: true, password: data.password };
        }

        return { success: false, error: 'Failed to generate password' };
    }
};

export default authService;
