import { apiRequest } from './api';

/**
 * List all articles
 */
export async function listArticles(token: string) {
	return apiRequest({
		method: 'GET',
		path: '/api/articles',
		token
	});
}

/**
 * Get article by ID
 */
export async function getArticle(articleId: string, token: string) {
	return apiRequest({
		method: 'GET',
		path: `/api/articles/${articleId}`,
		token
	});
}

/**
 * Create new article
 */
export async function createArticle(articleData: Partial<Article>, token: string) {
	return apiRequest({
		method: 'POST',
		path: '/api/articles',
		body: articleData,
		token
	});
}

/**
 * Update article
 */
export async function updateArticle(
	articleId: string,
	articleData: Partial<Article>,
	token: string
) {
	return apiRequest({
		method: 'PUT',
		path: `/api/articles/${articleId}`,
		body: articleData,
		token
	});
}

/**
 * Delete article by ID
 */
export async function deleteArticle(articleId: string, token: string) {
	return apiRequest({
		method: 'DELETE',
		path: `/api/articles/${articleId}`,
		token
	});
}
