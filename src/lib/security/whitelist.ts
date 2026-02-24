/**
 * GSOCC Safe Haven Repository (Master Whitelist)
 * Prevents automated admin lockouts during high-intensity defense operations.
 */

// Define the static IP addresses of the primary command center/admins.
// In a true sovereign environment, this would likely be a VPN exit node.
export const MASTER_IP_WHITELIST = [
    '127.0.0.1',       // Localhost for development/testing
    '::1',             // IPv6 localhost
    '192.168.1.100', // Example: CEO Home IP
    '10.0.0.50',     // Example: CTO VPN
    // Adhere strictly to the defined list of safe IPs
];

// Define the absolute UUIDs or emails of Super Admins who are immune to auto-isolation
export const MASTER_USER_WHITELIST = [
    'admin@donalgo.com',
    'ceo@donalgo.com',
    // 'uuid-of-super-admin-1',
];

/**
 * Validates if a given IP or User is protected under the Safe Haven policy.
 * 
 * @param ip - The source IP address to check
 * @param userId - The user identifier (email or UUID) to check
 * @returns boolean - True if the entity is protected and should bypass auto-containment
 */
export function isSafeHaven(ip?: string, userId?: string): boolean {
    if (ip && MASTER_IP_WHITELIST.includes(ip)) {
        return true;
    }
    
    if (userId && MASTER_USER_WHITELIST.includes(userId)) {
        return true;
    }
    
    return false;
}
