type Role = 'USER' | 'ADMIN';
type AuthProvider = 'LOCAL' | 'OAuth2';

interface AuthResponse {
	token: string;
	tokenExpiration: number;
	refreshToken: string;
	refreshTokenExpiration: number;
	user: User;
}

interface Account {
	id?: number;
	accountNumber: string;
	balance: number;
	userId: number;
	cardId?: number;
}

interface Article {
	id?: number;
	name: string;
	description?: string;
	price: number;
	category: string;
}

interface Card {
	id?: number;
	pan: string;
	panToken: string;
	cvv: string;
	createdAt: string; // ISO date string
	expiryDate: string; // ISO date string
	accountId?: number;
}

interface CartItem {
	articleId: number;
	quantity: number;
}

interface CheckoutRequest {
	items: CartItem[];
	pan: string;
	expiryDate: string;
	cvv: string;
	usePoints?: boolean;
}

interface Profile {
	id?: number;
	firstName: string;
	lastName: string;
	phone?: string;
	userId: number;
}

interface PurchaseRequest {
	pan: string;
	cvv: string;
	expiryDate: string;
}

interface Reward {
	id?: number;
	name: string;
	description?: string;
	pointsRequired: number;
	category: string;
	available: boolean;
}

interface Transaction {
	id?: number;
	amount: number;
	timestamp: string; // ISO date string
	referenceNumber: string;
	authorizationCode?: string;
	responseCode?: string;
	pan?: string;
	userId: number;
	transactionItems?: TransactionItem[];
}

interface TransactionItem {
	id?: number;
	article: Article;
	quantity: number;
}

interface User {
	id?: number;
	username: string;
	email: string;
	password?: string;
	enabled?: boolean;
	role?: string;
	loyaltyPoints?: number;
	authProvider?: string;
	profileId?: number;
	accountId?: number;
	created_at?: string; // ISO date string for user creation
	last_login?: string; // ISO date string for last login
}

// Auth
interface LoginUser {
	email: string;
	password: string;
}

interface RegisterUser {
	email: string;
	password: string;
	username: string;
	enabled?: boolean;
}

interface VerifyUser {
	email: string;
	verificationCode: string;
}

// ISO
interface ISORequest {
	pan: string;
	cvv: string;
	expiryDate: string; // MMYY
	amount: number;
}

interface ISOResponse {
	responseCode?: string;
	stan?: string;
	rrn?: string;
	authCode?: string;
	addedLoyaltyPoints?: number;
	deductedLoyaltyPoints?: number;
}

// Update
interface UpdateUser {
	username?: string;
	email?: string;
	password?: string;
	loyaltyPoints?: number;
	enabled?: boolean;
}
