import { apiRequest } from './api';

// Admin functions
/**
 * List all rewards (Admin only)
 */
export async function listRewards(token: string) {
	return apiRequest({
		method: 'GET',
		path: '/api/admin/rewards',
		token
	});
}

/**
 * Get reward by ID (Admin only)
 */
export async function getReward(rewardId: string, token: string) {
	return apiRequest({
		method: 'GET',
		path: `/api/admin/rewards/${rewardId}`, // Fixed: was /reward/, now /rewards/
		token
	});
}

/**
 * Create new reward (Admin only)
 */
export async function createReward(rewardData: Partial<Reward>, token: string) {
	return apiRequest({
		method: 'POST',
		path: '/api/admin/rewards', // Fixed: was /reward/create, now /rewards
		body: rewardData,
		token
	});
}

/**
 * Update reward (Admin only)
 */
export async function updateReward(rewardId: string, rewardData: Partial<Reward>, token: string) {
	return apiRequest({
		method: 'PUT',
		path: `/api/admin/rewards/${rewardId}`, // Fixed: was /reward/, now /rewards/
		body: rewardData,
		token
	});
}

/**
 * Delete reward by ID (Admin only)
 */
export async function deleteReward(rewardId: string, token: string) {
	return apiRequest({
		method: 'DELETE',
		path: `/api/admin/rewards/${rewardId}`, // Fixed: was /reward/, now /rewards/
		token
	});
}

// User functions (these were missing from your original code)
/**
 * Get available rewards (User)
 */
export async function getAvailableRewards(token: string) {
	return apiRequest({
		method: 'GET',
		path: '/api/rewards/available',
		token
	});
}

/**
 * Get claimed rewards (User)
 */
export async function getClaimedRewards(token: string) {
	return apiRequest({
		method: 'GET',
		path: '/api/rewards/claimed',
		token
	});
}

/**
 * Claim a reward (User)
 */
export async function claimReward(rewardId: string, token: string) {
	return apiRequest({
		method: 'POST',
		path: `/api/rewards/${rewardId}/claim`,
		token
	});
}