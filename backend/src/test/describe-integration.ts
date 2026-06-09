/**
 * Integration tests require DATABASE_URL (postgres). Skipped locally when unset.
 */
export const describeIntegration = process.env.DATABASE_URL ? describe : describe.skip;
