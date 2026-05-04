/**
 * NextAuth passes `error` on the query string for real failures. For custom `pages.signIn`,
 * a GET to `/api/auth/signin/{provider}` incorrectly sets `error` to the provider id (e.g. `google`)
 * when no failure occurred — treat those as non-errors.
 */
const OAUTH_PROVIDER_IDS = new Set(['google', 'github']);

const MESSAGES: Record<string, string> = {
  Configuration:
    'Authentication is misconfigured on the server. Check NEXTAUTH_SECRET and OAuth environment variables.',
  AccessDenied: 'You cancelled sign-in or access was denied.',
  Verification: 'The sign-in link is invalid or has expired.',
  OAuthSignin:
    'Google could not start sign-in. Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, and in Google Cloud Console add this exact redirect URI under Authorized redirect URIs: {origin}/api/auth/callback/google',
  OAuthCallback:
    'Google sign-in did not complete. If this persists, confirm the redirect URI in Google Cloud matches this app and try again.',
  OAuthCreateAccount: 'Could not create your account via Google. Try again or use email sign-up.',
  OAuthAccountNotLinked:
    'This Google account is linked to a different sign-in method. Use the method you used originally.',
  Callback: 'Something went wrong during sign-in. Please try again.',
  CredentialsSignin: 'Invalid email or password.',
  EmailSignin: 'Could not send the email. Try again later.',
  SessionRequired: 'You must be signed in to view this page.',
};

export function normalizeNextAuthErrorParam(error: string | null): string | null {
  if (!error) return null;
  if (OAUTH_PROVIDER_IDS.has(error)) return null;
  return error;
}

export function nextAuthErrorMessage(code: string, requestOrigin?: string): string {
  const origin = requestOrigin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  const template = MESSAGES[code];
  if (!template) {
    return `Sign-in failed (${code}). Please try again.`;
  }
  return template.replace(/\{origin\}/g, origin);
}
