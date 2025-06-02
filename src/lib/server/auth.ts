import { apiRequest } from "./api";

/**
 * Log in a user with email and password
 */
export async function login(email: string, password: string) {
	return apiRequest<AuthResponse>({
		method: 'POST',
		path: '/auth/login',
		body: { email, password }
	});

}

/**
 * Validate an authentication token
 */
export async function validateToken(token: string) {
	return apiRequest({
		method: 'POST',
		path: '/auth/validate-token',
		token
	});
}

/**
 * Refresh an expired token using a refresh token
 */
export async function refreshToken(refreshToken: string) {
	return apiRequest<AuthResponse>({
		method: 'POST',
		path: '/auth/refresh-token',
		token: refreshToken
	});

}
