import { apiRequest } from './api';

// Admin functions
/**
 * List all transactions (Admin only)
 */
export async function listTransactions(token: string) {
	return apiRequest({
		method: 'GET',
		path: '/api/admin/transactions',
		token
	});
}

/**
 * Get transaction by ID (Admin only)
 */
export async function getTransaction(transactionId: string, token: string) {
	return apiRequest({
		method: 'GET',
		path: `/api/admin/transactions/${transactionId}`,
		token
	});
}

/**
 * Get transactions by user ID (Admin only)
 */
export async function getTransactionsByUserId(userId: string, token: string) {
	return apiRequest({
		method: 'GET',
		path: `/api/admin/transactions/user/${userId}`,
		token
	});
}

// User functions
/**
 * Get user's own transactions (User)
 */
export async function getUserTransactions(token: string) {
	return apiRequest({
		method: 'GET',
		path: '/api/transactions',
		token
	});
}

/**
 * Get transaction details by ID for current user (User)
 */
export async function getUserTransaction(transactionId: string, token: string) {
	return apiRequest({
		method: 'GET',
		path: `/api/transactions/${transactionId}`,
		token
	});
}

/**
 * Get transaction articles/items for current user (User)
 */
export async function getTransactionArticles(transactionId: string, token: string) {
	return apiRequest({
		method: 'GET',
		path: `/api/transactions/${transactionId}/articles`,
		token
	});
}

/**
 * Process a new transaction/purchase (User)
 * Note: This should use the ArticleController's checkout endpoint
 */
export async function processTransaction(transactionData: CheckoutRequest, token: string) {
	return apiRequest({
		method: 'POST',
		path: '/api/articles/cart/checkout',
		body: transactionData,
		token
	});
}
