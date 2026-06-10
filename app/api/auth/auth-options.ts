import { NextAuthOptions, Account, Profile, Session as NextAuthSession } from 'next-auth';
import { JWT as NextAuthJWT } from 'next-auth/jwt';

interface JWT extends NextAuthJWT {
  expiresAt?: number;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
  role?: 'HR' | 'Employee';
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    jobTitle?: string;
    mobilePhone?: string;
    role?: 'HR' | 'Employee';
  };
}
import { azureProvider } from '@/app/api/auth/azure';
import { getUserDetails } from '@/lib/user-info';

interface Session extends NextAuthSession {
  accessToken?: string;
  expires: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    jobTitle?: string;
    mobilePhone?: string;
    role?: 'HR' | 'Employee';
  };
}

type AzureProfile = Profile & {
  roles?: string[];
  preferred_username?: string;
  upn?: string;
  email?: string;
};

type AzureAccount = Account & {
  id_token?: string;
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const json = Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeRole(value?: string): 'HR' | 'Employee' | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  if (v === 'hr') return 'HR';
  if (v === 'employee') return 'Employee';
  return undefined;
}

function resolveRole(profile?: AzureProfile | null, account?: AzureAccount | null): 'HR' | 'Employee' | undefined {
  const profileRoles = Array.isArray(profile?.roles) ? profile?.roles : [];
  for (const r of profileRoles) {
    const mapped = normalizeRole(r);
    if (mapped) return mapped;
  }

  const idToken = account?.id_token;
  if (idToken) {
    const payload = decodeJwtPayload(idToken);
    const tokenRoles = Array.isArray(payload?.roles) ? (payload?.roles as string[]) : [];
    for (const r of tokenRoles) {
      const mapped = normalizeRole(r);
      if (mapped) return mapped;
    }
  }

  return undefined;
}

function resolveEmail(profile?: AzureProfile | null, account?: AzureAccount | null): string | undefined {
  const direct = profile?.email || profile?.preferred_username || profile?.upn;
  if (direct) return direct;

  const idToken = account?.id_token;
  if (!idToken) return undefined;

  const payload = decodeJwtPayload(idToken);
  const tokenEmail =
    (payload?.email as string | undefined) ||
    (payload?.preferred_username as string | undefined) ||
    (payload?.upn as string | undefined);

  return tokenEmail;
}

export const authOptions: NextAuthOptions = {
  providers: [azureProvider],
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24, 
  },
  callbacks: {
    async redirect({ baseUrl }: { baseUrl: string }) {
      return `${baseUrl}/dashboard`;
    },

    async jwt({
      token,
      account,
      profile,
    }: {
      token: JWT;
      account?: Account | null;
      profile?: Profile | null;
    }) {
      if (account && profile) {
        const resolvedRole = resolveRole(profile as AzureProfile, account as AzureAccount) || 'Employee';
        const resolvedEmail = resolveEmail(profile as AzureProfile, account as AzureAccount) || token.email || undefined;
        console.log('🔐 [JWT Callback] Captured from Azure:', {
          accessToken: account.access_token?.slice(0, 50) + '...',
          expiresAt: account.expires_at,
          hasRefreshToken: !!account.refresh_token,
          role: resolvedRole,
          email: resolvedEmail,
        });
        token.user = { ...profile, email: resolvedEmail ?? null, role: resolvedRole };
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = (account.expires_at ?? 0) * 1000; // Store expiration as milliseconds
        token.role = resolvedRole;
        token.email = resolvedEmail;
      }

      const oneMinute = 10 *60 * 1000; // 10 minute in milliseconds
      if (token.expiresAt && Date.now() + oneMinute > token.expiresAt) {
        console.log('🔄 [JWT Callback] Token expiring soon, triggering refresh...');
        return await refreshAccessToken(token);
      }

      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      session.user = {
        ...session.user,
        ...(token.user as Session['user']),
        email: (token.user as Session['user'])?.email || token.email || session.user?.email,
        role: token.role,
      };
      session.accessToken = token.accessToken as string;
      console.log('📋 [Session Callback] Assigned to session:', {
        userEmail: session.user?.email,
        accessToken: session.accessToken?.slice(0, 50) + '...' || 'NULL',
        expiresAt: new Date(token.expiresAt ?? 0).toISOString(),
      });
      session.expires = new Date(token.expiresAt ?? 0).toISOString();

      if (token.accessToken) {
        try {
          const userDetails = await getUserDetails(token.accessToken as string);
          session.user.jobTitle = userDetails.jobTitle ?? '';
          session.user.mobilePhone = userDetails.mobilePhone ?? '';
        } catch (error) {
          console.error('Error fetching user details:', error);
        }
      }

      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// 🔄 Refresh Token Function
async function refreshAccessToken(token: JWT) {
  try {
    const url = `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID!}/oauth2/v2.0/token`;

    
    
    const response = await fetch(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.AZURE_AD_CLIENT_ID!,
          client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
          refresh_token: token.refreshToken as string,
          grant_type: 'refresh_token',
          scope: 'openid profile email User.Read offline_access Mail.Send OnlineMeetings.Read OnlineMeetings.ReadWrite Calendars.Read Calendars.ReadWrite',
        }),
      }
    );

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error('🔴 [Refresh] Azure token endpoint failed:', {
        status: response.status,
        error: refreshedTokens?.error,
        error_description: refreshedTokens?.error_description,
      });
      return { ...token, error: 'RefreshAccessTokenError' };
    }

    console.log('✅ [Refresh] New token received from Azure:', {
      accessToken: refreshedTokens.access_token?.slice(0, 50) + '...',
      expiresIn: refreshedTokens.expires_in,
      hasScope: refreshedTokens.scope?.includes('Mail.Send'),
    });

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      expiresAt: Date.now() + refreshedTokens.expires_in * 1000,
    };
  } catch{
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}