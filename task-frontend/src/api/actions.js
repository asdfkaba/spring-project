class AuthError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function authFetch(input, init = {}) {
  const defaultInit = {
    credentials: 'include',  // always send cookies
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    ...init,
  };
  
  const response = await fetch(input, defaultInit);

  if (response.status === 401) {
    throw new AuthError('Unauthorized');
  }

  return response;
}

export async function getCurrentUser() {
  let response;

  try {
    response = await authFetch('/api/auth/status');
  } catch (err) {
    if (err.name === 'AuthError') {
      return { status: 'unauthenticated' };
    }
    return { status: 'backend-unreachable' };
  }

  if ([502, 503, 504].includes(response.status)) {
    return { status: 'backend-unreachable' };
  }

  if (!response.ok) {
    return { status: 'error', code: response.status };
  }

  const user = await response.json();
  return { status: 'ok', user };
}


export async function logoutBackend() {
  const response = await authFetch('/api/auth/logout', {method: 'POST'});

  if (!response.ok) {
    throw new Error(`Error fetching auth status: ${response.status}`);
  }

  return await response.json();
}
