import {
	listTransactions,
} from '$lib/server/transactions';
import type {  PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const token = locals.token;
	if (!token) {
		return {
			transactions: [],
			error: 'Authentication required to view transactions.'
		};
	}

	const response = await listTransactions(token);
	console.log('Transactions response:', response);

	if (response.status === 'error') {
		console.error('Error fetching transactions:', response.message);
		return {
			transactions: [],
			error: response.message
		};
	}

	return {
		transactions: response.data || []
	};
};