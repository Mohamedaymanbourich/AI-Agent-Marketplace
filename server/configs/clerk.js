let clerkClient = null;

export async function getClerkMiddleware() {
  const hasClerk = !!(process.env.CLERK_API_KEY || process.env.CLERK_SECRET || process.env.CLERK_JWT_KEY || process.env.CLERK_PUBLISHABLE_KEY);
  if (hasClerk) {
    try {
      const mod = await import('@clerk/express');
      const { clerkMiddleware: clerkMW, clerkClient: realClerkClient } = mod;
      clerkClient = realClerkClient;
      return clerkMW();
    } catch (err) {
      console.warn('Clerk import/initialization failed, falling back to dev middleware:', err && err.message ? err.message : err);
    }
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
}

export function getClerkClient() {
  return clerkClient;
}
