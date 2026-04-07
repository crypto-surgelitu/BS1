const DEFAULT_ADMIN = {
    email: 'admin@swahilipot.co.ke',
    passwordHash: '$2b$10$SGfbF3Q2iFP6dIHQUXbXy.2RDjAd0T6CpRAvJvzNZMcE7LCWBAD3S',
    fullName: 'Admin User',
    department: 'Administration',
    role: 'admin'
};

const DEFAULT_SUPERADMIN = {
    email: 'superadmin@bs1.com',
    passwordHash: '$2b$10$orQiD3dYeO5l42WYGGBBb.AYYbbQ2MDlXria61ZsHKSXq3QbKnxK6',
    fullName: 'Super Admin',
    department: 'Administration',
    role: 'super_admin'
};

const LEGACY_SYSTEM_EMAILS = [
    'admin@swahilipothub.co.ke'
];

const RESERVED_SYSTEM_EMAILS = [
    DEFAULT_ADMIN.email,
    DEFAULT_SUPERADMIN.email,
    ...LEGACY_SYSTEM_EMAILS
].map(email => email.toLowerCase());

module.exports = {
    DEFAULT_ADMIN,
    DEFAULT_SUPERADMIN,
    LEGACY_SYSTEM_EMAILS,
    RESERVED_SYSTEM_EMAILS
};
