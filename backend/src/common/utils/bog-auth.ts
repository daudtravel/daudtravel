const BOG_AUTH_URL =
  'https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token';

let accessTokenCache: { token: string; expiresAt: number } | null = null;

export const getBOGAccessToken = async (): Promise<string> => {
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now()) {
    return accessTokenCache.token;
  }

  const clientId = process.env.BOG_CLIENT_ID;
  const clientSecret = process.env.BOG_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'BOG_CLIENT_ID and BOG_CLIENT_SECRET environment variables are required',
    );
  }

  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString(
    'base64',
  );

  const response = await fetch(BOG_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${authString}`,
      Accept: 'application/json',
      'User-Agent': 'DaudTravel-Backend/1.0',
    },
    body: 'grant_type=client_credentials',
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `BOG Authentication error: ${response.status} ${response.statusText} - ${responseText}`,
    );
  }

  let authData;
  try {
    authData = JSON.parse(responseText);
  } catch (parseError) {
    throw new Error(
      `BOG returned invalid JSON: ${responseText.substring(0, 200)}`,
    );
  }

  if (!authData.access_token) {
    throw new Error('BOG authentication response missing access_token');
  }

  accessTokenCache = {
    token: authData.access_token,
    expiresAt: Date.now() + (authData.expires_in || 3600) * 1000 - 60000,
  };

  return authData.access_token;
};
