import { getClerkClient } from '../configs/clerk.js'

// Middleware ( Protect creator Routes )
export const protectCreator = async (req, res, next) => {
    try {
        const userId = req.auth && req.auth.userId;
        if (!userId) {
            return res.json({ success: false, message: 'Unauthorized Access' });
        }

        const client = getClerkClient();
        if (!client) {
            // If running in local dev with DEV_AUTH_USER, allow
            if (process.env.DEV_AUTH_USER) return next();
            return res.json({ success: false, message: 'Auth not configured' });
        }

        const response = await client.users.getUser(userId);
        if (!response || (response.publicMetadata && response.publicMetadata.role) !== 'creator') {
            return res.json({ success: false, message: 'Unauthorized Access' });
        }

        next();
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
