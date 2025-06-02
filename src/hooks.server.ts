import { NODE_ENV } from '$env/static/private';
import { redirect, type Handle } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
import { handleLoginRedirect } from '$lib/utils';

if (NODE_ENV === 'development') {
	process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
	console.warn('TLS verification disabled for development. Do not use in production!');
}

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	
	// Skip auth checks for login page and static assets
	if (pathname.startsWith('/login') || pathname.startsWith('/_app/') || pathname.startsWith('/favicon')) {
		return await resolve(event);
	}

	const authToken = event.cookies.get('AuthorizationToken');
	const refreshToken = event.cookies.get('RefreshToken');
	let isAuthenticated = false;

	// Only validate if we have a token
	if (authToken) {
		const token = authToken.startsWith('Bearer ') ? authToken.substring(7) : authToken;
		
		try {
			const validationResponse = await auth.validateToken(token);
			if (validationResponse && validationResponse.status === "success") {
				event.locals.user = validationResponse.data.user;
				event.locals.token = token;
				isAuthenticated = true;
			}
		} catch (error) {
			console.error('Token validation failed:', error);
			// Clear invalid token
			event.cookies.delete('AuthorizationToken', { path: '/' });
		}
	}

	// Only try refresh if we explicitly failed validation and have refresh token
	if (!isAuthenticated && refreshToken && authToken) {
		try {
			const refreshResult = await auth.refreshToken(refreshToken);
			if (refreshResult && refreshResult.status === 'success' && refreshResult.data) {
				event.cookies.set('AuthorizationToken', refreshResult.data.token, {
					path: '/',
					httpOnly: true,
					secure: NODE_ENV === 'production',
					sameSite: 'strict',
					maxAge: Math.floor(refreshResult.data.tokenExpiration / 1000)
				});
				event.cookies.set('RefreshToken', refreshResult.data.refreshToken, {
					path: '/',
					httpOnly: true,
					secure: NODE_ENV === 'production',
					sameSite: 'strict',
					maxAge: Math.floor(refreshResult.data.refreshTokenExpiration / 1000)
				});
				event.locals.user = refreshResult.data.user;
				event.locals.token = refreshResult.data.token;
				isAuthenticated = true;
			}
		} catch (error) {
			console.error('Token refresh failed:', error);
			// Clear invalid tokens
			event.cookies.delete('AuthorizationToken', { path: '/' });
			event.cookies.delete('RefreshToken', { path: '/' });
		}
	}

	// Clear locals if not authenticated
	if (!isAuthenticated) {
		event.cookies.delete('AuthorizationToken', { path: '/' });
		event.cookies.delete('RefreshToken', { path: '/' });
		event.locals.user = undefined;
		event.locals.token = undefined;
	}

	// Handle redirects
	const isRoot = pathname === '/';
	const isPublic = pathname.startsWith('/login') || isRoot;

	if (isRoot) {
		throw redirect(303, event.locals.user ? '/dashboard' : '/login');
	}

	if (!isPublic && !event.locals.user) {
		throw redirect(303, handleLoginRedirect(event));
	}

	return await resolve(event);
};
