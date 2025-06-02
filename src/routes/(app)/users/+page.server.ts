import {
	createUser,
	deleteUser,
	getUserRewards,
	getUserTransactions,
	listUsers,
	updateUser
} from '$lib/server/users';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

interface LoadReturn {
	users: User[];
	error?: string;
	userTransactions?: Record<string, Transaction[]>;
	userRewards?: Record<string, Reward[]>;
}

export const load: PageServerLoad<LoadReturn> = async ({ locals, url }) => {
	const token = locals.token;
	if (!token) {
		return {
			users: [],
			error: 'Authentication required to view users.'
		};
	}

	// Get the main users list
	const response = await listUsers(token);
	if (response.status === 'error') {
		console.error('Error fetching users:', response.message);
		return {
			users: [],
			error: response.message
		};
	}

	const userId = url.searchParams.get('userId');
	const viewType = url.searchParams.get('viewType');

	// Initialize return data
	const result: LoadReturn = {
		users: response.data || [],
		userTransactions: {},
		userRewards: {}
	};

	// Load specific user data if requested
	if (userId && viewType && (viewType === 'transactions' || viewType === 'rewards')) {
		try {
			if (viewType === 'transactions') {
				console.log(`Loading transactions for user ${userId}`);
				const txResponse = await getUserTransactions(userId, token);

				if (txResponse.status === 'success' && txResponse.data) {
					if (!result.userTransactions) result.userTransactions = {};
					result.userTransactions[userId] = txResponse.data;
					console.log(`Loaded ${txResponse.data.length} transactions for user ${userId}`);
				} else {
					console.error('Failed to load transactions:', txResponse.message);
					if (!result.userTransactions) result.userTransactions = {};
					result.userTransactions[userId] = [];
				}
			} else if (viewType === 'rewards') {
				console.log(`Loading rewards for user ${userId}`);
				const rewardResponse = await getUserRewards(userId, token);

				if (rewardResponse.status === 'success' && rewardResponse.data) {
					if (!result.userRewards) result.userRewards = {};
					result.userRewards[userId] = rewardResponse.data;
					console.log(`Loaded ${rewardResponse.data.length} rewards for user ${userId}`);
				} else {
					console.error('Failed to load rewards:', rewardResponse.message);
					if (!result.userRewards) result.userRewards = {};
					result.userRewards[userId] = [];
				}
			}
		} catch (error) {
			console.error(`Error fetching ${viewType} for user ${userId}:`, error);
			// Set empty arrays to indicate data loading was attempted but failed
			if (viewType === 'transactions') {
				if (!result.userTransactions) result.userTransactions = {};
				result.userTransactions[userId] = [];
			} else if (viewType === 'rewards') {
				if (!result.userRewards) result.userRewards = {};
				result.userRewards[userId] = [];
			}
		}
	}

	console.log('Final userTransactions:', result.userTransactions);
	console.log('Final userRewards:', result.userRewards);

	return result;
};


export const actions = {
	loadUserData: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) {
			return fail(401, { error: 'Authentication required' });
		}

		const data = await request.formData();
		const userId = data.get('userId')?.toString();
		const viewType = data.get('viewType')?.toString();

		if (!userId || !viewType || (viewType !== 'transactions' && viewType !== 'rewards')) {
			return fail(400, { error: 'Invalid parameters' });
		}

		try {
			if (viewType === 'transactions') {
				const response = await getUserTransactions(userId, token);
				if (response.status === 'success') {
					return {
						success: true,
						data: response.data || [],
						userId,
						viewType
					};
				} else {
					return fail(500, { error: response.message });
				}
			} else {
				const response = await getUserRewards(userId, token);
				if (response.status === 'success') {
					return {
						success: true,
						data: response.data || [],
						userId,
						viewType
					};
				} else {
					return fail(500, { error: response.message });
				}
			}
		} catch (error) {
			console.error(`Error loading ${viewType} for user ${userId}:`, error);
			return fail(500, { error: 'Failed to load user data' });
		}
	},

	create: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const email = formData.get('email')?.toString();
		const displayName = formData.get('displayName')?.toString();
		const password = formData.get('password')?.toString();
		const loyaltyPointsStr = formData.get('loyaltyPoints')?.toString();
		const enabled = formData.get('enabled');

		// Handle enabled field - it can be null, 'on', 'true', or other values
		let isEnabled: boolean;
		if (enabled === null || enabled === 'false' || enabled === '') {
			isEnabled = false;
		} else if (enabled === 'on' || enabled === 'true') {
			isEnabled = true;
		} else {
			isEnabled = Boolean(enabled);
		}

		// Validation
		const errors: Record<string, string> = {};
		if (!email) {
			errors.email = 'Email is required';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			errors.email = 'Please enter a valid email address';
		}

		if (!displayName) {
			errors.displayName = 'Display name is required';
		} else if (displayName.length < 2) {
			errors.displayName = 'Display name must be at least 2 characters';
		}

		if (!password) {
			errors.password = 'Password is required';
		} else if (password.length < 6) {
			errors.password = 'Password must be at least 6 characters';
		}

		let loyaltyPoints = 0;
		if (loyaltyPointsStr) {
			loyaltyPoints = Number(loyaltyPointsStr);
			if (isNaN(loyaltyPoints) || loyaltyPoints < 0) {
				errors.loyaltyPoints = 'Loyalty points must be a valid non-negative number';
			}
		}

		if (Object.keys(errors).length > 0) {
			return fail(400, {
				errors,
				email,
				displayName,
				loyaltyPoints: loyaltyPointsStr,
				enabled: isEnabled
			});
		}

		try {
			const response = await createUser(
				{
					email: email!,
					username: displayName!,
					password: password!,
					enabled: isEnabled,
					loyaltyPoints
				},
				token
			);

			if (response.status === 'error') {
				console.error('Error creating user:', response.message);
				return fail(400, {
					error: response.message,
					email,
					displayName,
					loyaltyPoints: loyaltyPointsStr,
					enabled: isEnabled
				});
			}

			return {
				success: true,
				data: response.data
			};
		} catch (error) {
			console.error('Error creating user:', error);
			return fail(500, {
				error: 'Failed to create user. Please try again.',
				email,
				displayName,
				loyaltyPoints: loyaltyPointsStr,
				enabled: isEnabled
			});
		}
	},

	update: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const email = formData.get('email')?.toString();
		const displayName = formData.get('displayName')?.toString();
		const password = formData.get('password')?.toString();
		const loyaltyPointsStr = formData.get('loyaltyPoints')?.toString();
		const enabled = formData.get('enabled');

		// Handle enabled field
		let isEnabled: boolean;
		if (enabled === null || enabled === 'false' || enabled === '') {
			isEnabled = false;
		} else if (enabled === 'on' || enabled === 'true') {
			isEnabled = true;
		} else {
			isEnabled = Boolean(enabled);
		}

		// Validation
		const errors: Record<string, string> = {};
		if (!id) {
			errors.id = 'User ID is missing';
		}

		if (!email) {
			errors.email = 'Email is required';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			errors.email = 'Please enter a valid email address';
		}

		if (!displayName) {
			errors.displayName = 'Display name is required';
		} else if (displayName.length < 2) {
			errors.displayName = 'Display name must be at least 2 characters';
		}

		// Password is optional for updates
		if (password && password.length < 6) {
			errors.password = 'Password must be at least 6 characters';
		}

		let loyaltyPoints: number = 0;
		if (!loyaltyPointsStr) {
			errors.loyaltyPoints = 'Loyalty points are required';
		} else {
			loyaltyPoints = Number(loyaltyPointsStr);
			if (isNaN(loyaltyPoints)) {
				errors.loyaltyPoints = 'Loyalty points must be a number';
			} else if (loyaltyPoints < 0) {
				errors.loyaltyPoints = 'Loyalty points cannot be negative';
			}
		}

		if (Object.keys(errors).length > 0) {
			return fail(400, {
				errors,
				id,
				email,
				displayName,
				loyaltyPoints: loyaltyPointsStr,
				enabled: isEnabled
			});
		}

		try {
			const updateData: any = {
				username: displayName!,
				email: email!,
				loyaltyPoints,
				enabled: isEnabled
			};

			// Only include password if it's provided
			if (password && password.trim() !== '') {
				updateData.password = password;
			}

			const response = await updateUser(id!, updateData, token);

			console.log('Update response:', response);

			if (response.status === 'error') {
				console.error('Error updating user:', response.message);
				return fail(400, {
					error: response.message,
					id,
					email,
					displayName,
					loyaltyPoints: loyaltyPointsStr,
					enabled: isEnabled
				});
			}

			return {
				success: true,
				data: response.data
			};
		} catch (error) {
			console.error('Error updating user:', error);
			return fail(500, {
				error: 'Failed to update user. Please try again.',
				id,
				email,
				displayName,
				loyaltyPoints: loyaltyPointsStr,
				enabled: isEnabled
			});
		}
	},

	delete: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();

		console.log('User to delete:', userId);

		if (!userId) {
			return fail(400, { error: 'User ID is required' });
		}

		try {
			const response = await deleteUser(userId, token);
			console.log('Delete response:', response);

			if (response.status === 'error') {
				console.error('Error deleting user:', response.message);
				return fail(400, {
					error: response.message
				});
			}

			return {
				success: true,
				deletedUserId: userId
			};
		} catch (error) {
			console.error('Error deleting user:', error);
			return fail(500, {
				error: 'Failed to delete user. Please try again.'
			});
		}
	}
} satisfies Actions;
