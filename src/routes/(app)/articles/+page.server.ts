import {
	createArticle,
	deleteArticle,
	getArticle,
	listArticles,
	updateArticle
} from '$lib/server/articles';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

interface LoadReturn {
	articles: Article[];
	error?: string;
}

export const load: PageServerLoad<LoadReturn> = async ({ locals }) => {
	const token = locals.token;
	if (!token) {
		return {
			articles: [],
			error: 'Authentication required to view articles.'
		};
	}

	const response = await listArticles(token);
    console.log('Response from listArticles:', response);
	if (response.status === 'error') {
		console.error('Error fetching articles:', response.message);
		return {
			articles: [],
			error: response.message
		};
	}

	return {
		articles: response.data || []
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) {
			return fail(401, { error: 'Authentication required' });
		}

		const formData = await request.formData();
		const articleData = {
			name: formData.get('name') as string,
			description: formData.get('description') as string,
			price: parseFloat(formData.get('price') as string),
			category: formData.get('category') as string
		};

		// Validate required fields
		if (!articleData.name || !articleData.price || !articleData.category) {
			return fail(400, { error: 'Name, price, and category are required' });
		}

		if (articleData.price <= 0) {
			return fail(400, { error: 'Price must be greater than 0' });
		}

		const response = await createArticle(articleData, token);
		if (response.status === 'error') {
			return fail(400, {
				error: response.message,
				name: articleData.name,
				description: articleData.description,
				price: articleData.price.toString(),
				category: articleData.category
			});
		}

		return {
			success: true,
			data: response.data
		};
	},

	update: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) {
			return fail(401, { error: 'Authentication required' });
		}

		const formData = await request.formData();
		const articleId = formData.get('id') as string;
		const articleData = {
			name: formData.get('name') as string,
			description: formData.get('description') as string,
			price: parseFloat(formData.get('price') as string),
			category: formData.get('category') as string
		};

		// Validate required fields
		if (!articleId) {
			return fail(400, { error: 'Article ID is required' });
		}

		if (!articleData.name || !articleData.price || !articleData.category) {
			return fail(400, { error: 'Name, price, and category are required' });
		}

		if (articleData.price <= 0) {
			return fail(400, { error: 'Price must be greater than 0' });
		}

		const response = await updateArticle(articleId, articleData, token);
		if (response.status === 'error') {
			return fail(400, {
				error: response.message,
				id: articleId,
				name: articleData.name,
				description: articleData.description,
				price: articleData.price.toString(),
				category: articleData.category
			});
		}

		return {
			success: true,
			data: response.data
		};
	},

	delete: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) {
			return fail(401, { error: 'Authentication required' });
		}

		const formData = await request.formData();
		const articleId = formData.get('id') as string;

		if (!articleId) {
			return fail(400, { error: 'Article ID is required' });
		}

		const response = await deleteArticle(articleId, token);
		if (response.status === 'error') {
			return fail(400, {
				error: response.message,
				articleId
			});
		}

		return {
			success: true,
			deletedArticleId: articleId
		};
	}
};
