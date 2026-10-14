import NextAuth from 'next-auth';
import type { Provider } from 'next-auth/providers';
import Credentials from 'next-auth/providers/credentials';
import LinkedIn from 'next-auth/providers/linkedin';

/**
 * Sign in with LinkedIn (decision "Auth"), via OpenID Connect.
 *
 * LinkedIn's OIDC gives identity only — sub, name, email, picture. It does not
 * expose the member's profile URL or work history, so the profile is built
 * from the resume (see docs/DECISIONS.md).
 *
 * Sessions are a signed, encrypted JWT cookie: no database. The candidate's
 * data stays in the browser, namespaced by `session.user.id` (AppStore).
 *
 * Env (see README): AUTH_SECRET, AUTH_LINKEDIN_ID, AUTH_LINKEDIN_SECRET.
 */

/**
 * A fake "test user" sign-in for local development and the E2E suite, where
 * LinkedIn can't be driven. Never on Vercel, whatever the env says.
 */
export const TEST_SIGNIN_ENABLED =
  !process.env.VERCEL &&
  (process.env.NODE_ENV === 'development' || process.env.AUTH_TEST_SIGNIN === '1');

const providers: Provider[] = [LinkedIn];

if (TEST_SIGNIN_ENABLED) {
  providers.push(
    Credentials({
      id: 'test',
      name: 'Test user',
      credentials: { id: {}, name: {} },
      authorize: (c) => {
        const id = typeof c.id === 'string' && /^[\w-]{1,40}$/.test(c.id) ? c.id : 'test-user';
        const name = typeof c.name === 'string' && c.name ? c.name.slice(0, 60) : 'Test User';
        return { id: `test:${id}`, name, email: `${id}@example.test` };
      },
    }),
  );
}

export const { handlers, auth } = NextAuth({
  providers,
  session: { strategy: 'jwt' },
  // Both the sign-in screen and auth errors (e.g. the candidate cancelled at LinkedIn).
  pages: { signIn: '/signin', error: '/signin' },
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
