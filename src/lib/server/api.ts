import { SPRING_API_URL } from '$env/static/private';

export interface ApiResponse<T = any> {
	status: 'success' | 'error';
	message: string;
	data: T | null;
	metadata?: any;
}

interface ApiRequestOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	path: string;
	body?: any;
	token?: string;
	headers?: Record<string, string>;
}

export async function apiRequest<T = any>({
	method = 'GET',
	path,
	body,
	token,
	headers = {}
}: ApiRequestOptions): Promise<ApiResponse<T>> {
	const url = `${SPRING_API_URL}${path}`;
	const requestHeaders: Record<string, string> = {
		Accept: 'application/json',
		...headers
	};

	if (body) {
		requestHeaders['Content-Type'] = 'application/json';
	}

	if (token) {
		requestHeaders['Authorization'] = `Bearer ${token}`;
	}

	try {
		const response = await fetch(url, {
			method,
			headers: requestHeaders,
			body: method !== 'GET' && method !== 'DELETE' && body ? JSON.stringify(body) : undefined
		});


		let responseBody: ApiResponse<T>;
		try {
			responseBody = await response.json();
		} catch (parseError) {
			console.error('Failed to parse JSON response:', parseError);
			return {
				status: 'error',
				message: `Failed to parse server response: ${response.statusText}`,
				data: null
			};
		}

		if (typeof responseBody?.status !== 'string' || typeof responseBody?.message !== 'string') {
			return {
				status: 'error',
				message: `Unexpected response format from server`,
				data: null
			};
		}

		return responseBody;
	} catch (error) {
		// Handle network errors
		console.error(`API Request failed [${method} ${path}]:`, error);
		return {
			status: 'error',
			message: `Network error: ${error instanceof Error ? error.message : String(error)}`,
			data: null
		};
	}
}
