import { clerkMiddleware as clerkMW, clerkClient as realClerkClient } from '@clerk/express';

let clerkClient = null;

/**
 * Returns an Express middleware to use for Clerk authentication.
 * If Clerk env vars are present we use the real middleware+client.
 * Otherwise we provide a lightweight development fallback.
 */
export const getClerkMiddleware = () => {
  const hasClerk = !!(process.env.CLERK_API_KEY || process.env.CLERK_SECRET || process.env.CLERK_JWT_KEY);
  if (hasClerk) {
    clerkClient = realClerkClient;
    return clerkMW();
  }

  console.warn('Clerk not configured; using development fallback middleware. Set CLERK_API_KEY to enable Clerk.');

  // Development fallback: if DEV_AUTH_USER is set, inject req.auth.userId for convenience.
  clerkClient = {
    users: {
      getUser: async (id) => ({ id, publicMetadata: {} }),
      updateUserMetadata: async () => ({}),
    },
  };

  return (req, _res, next) => {
    if (process.env.DEV_AUTH_USER) {
      req.auth = { userId: process.env.DEV_AUTH_USER };
    }
    next();
  };
};

export { clerkClient };
