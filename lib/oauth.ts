export const OAUTH_CONTEXT_STORAGE_KEY = "oauth-context";

export const AUTH_CONFIG = {
  qq: {
    url: "https://graph.qq.com/oauth2.0/authorize",
    client_id: process.env.NEXT_PUBLIC_QQ_CLIENT_ID!,
    redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
    scope: "get_user_info",
    extraParams: {},
  },
  github: {
    url: "https://github.com/login/oauth/authorize",
    client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!,
    redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
    scope: "read:user user:email",
    extraParams: {
      allow_signup: "true",
    },
  },
  google: {
    url: "https://accounts.google.com/o/oauth2/v2/auth",
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
    scope: "openid email profile",
    extraParams: {
      access_type: "offline",
      include_granted_scopes: "true",
      prompt: "consent",
    },
  },
} as const;

export type AuthPlatform = keyof typeof AUTH_CONFIG;

export type OAuthContext = {
  state: string;
  platform: AuthPlatform;
  codeChallenge: string;
  codeVerifier: string;
  action?: "login" | "bind";
};

export type OAuthPkce = {
  codeChallenge: string;
  codeVerifier: string;
};

export const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const createOAuthState = (platform: AuthPlatform) => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${platform}:${crypto.randomUUID()}`;
  }

  return `${platform}:${Math.random().toString(36).substring(2, 15)}`;
};

export const encodeBase64Url = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const createCodeVerifier = () => {
  return (
    crypto.randomUUID().replace(/-/g, "") +
    crypto.randomUUID().replace(/-/g, "")
  );
};

export const createPkcePair = async (): Promise<OAuthPkce> => {
  const codeVerifier = createCodeVerifier();
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier),
  );

  return {
    codeChallenge: encodeBase64Url(digest),
    codeVerifier,
  };
};

export const buildAuthUrl = (
  platform: AuthPlatform,
  state: string,
  codeChallenge: string,
  isMobile: boolean,
) => {
  const config = AUTH_CONFIG[platform as AuthPlatform];
  const params = new URLSearchParams({
    client_id: config.client_id,
    redirect_uri: config.redirect_uri,
    scope: config.scope,
    response_type: "code",
    state: state,
  });

  Object.entries(config.extraParams).forEach(([key, value]) => {
    params.append(key, value);
  });

  if (platform !== "qq") {
    params.append("code_challenge", codeChallenge);
    params.append("code_challenge_method", "S256");
  }

  if (platform === "qq" && isMobile) {
    params.append("display", "mobile");
  }

  return `${config.url}?${params.toString()}`;
};
