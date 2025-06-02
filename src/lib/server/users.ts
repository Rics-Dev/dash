// users.ts
import { apiRequest } from "./api";

/**
 * List all users
 */
export async function listUsers(token: string) {
	return apiRequest({
		method: 'GET',
		path: '/admin/users',
		token
	});
}

/**
 * Update user profile
 */
export async function createUser(profileData: any, token: string) {
	return apiRequest({
		method: 'POST',
		path: `/admin/user/create`,
		body: profileData,
		token
	});
}

/**
 * Update user profile
 */
export async function updateUser(userId: string, profileData: any, token: string) {
	return apiRequest({
		method: 'PUT',
		path: `/admin/user/${userId}`,
		body: profileData,
		token
	});
}

/**
 * Delete user by ID
 */
export async function deleteUser(userId: string, token: string) {
	return apiRequest({
		method: 'DELETE',
		path: `/admin/user/${userId}`,
		token
	});
}

/**
 * Get user transactions by user ID (admin only)
 * Retrieves the transaction history for a specific user
 */
export async function getUserTransactions(userId: string, token: string) {
  return apiRequest({
    method: 'GET',
	path: `/api/admin/transactions/user/${userId}`,
    token
  });
}

/**
 * Get user claimed rewards by user ID (admin only)
 * Retrieves rewards already claimed by a specific user
 */
export async function getUserRewards(userId: string, token: string) {
  return apiRequest({
    method: 'GET',
    path: `/admin/rewards/user/${userId}`,
    token
  });
}
