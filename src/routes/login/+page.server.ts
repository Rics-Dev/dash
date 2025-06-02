// +page.server.ts - Remove server-side redirect
import { NODE_ENV } from '$env/static/private';
import { fail } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
  const message = event.url.searchParams.get("message") ?? "";
  const redirectTo = event.url.searchParams.get("redirectTo") ?? "/dashboard";
  return {
    message: message,
    redirectTo: redirectTo
  };
};

export const actions = {
  default: async ({ cookies, request, url }) => {
    const data = await request.formData();
    const email = data.get('email');
    const password = data.get('password');

    if (!email) {
      return fail(400, { email, missingEmail: true, message: 'Email is required' });
    }

    if (!password) {
      return fail(400, { password, missingPassword: true, message: 'Password is required' });
    }

    const result = await auth.login(email.toString(), password.toString());

    if (result.status === "error") {
      return fail(401, {
        email,
        authError: true,
        message: result.message
      });
    }

    if (!result.data?.user || result.data.user.role !== 'ADMIN') {
      return fail(403, {
        email,
        insufficientPermissions: true,
        message: 'Access Denied, Only admin users can access this application'
      });
    }

    cookies.set('AuthorizationToken', result.data.token, {
      httpOnly: true,
      path: '/',
      secure: NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: Math.floor(result.data.tokenExpiration / 1000)
    });

    cookies.set('RefreshToken', result.data.refreshToken, {
      httpOnly: true,
      path: '/',
      secure: NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: Math.floor(result.data.refreshTokenExpiration / 1000)
    });

    // Return success instead of redirecting
    const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
    return {
      success: true,
      redirectTo: redirectTo
    };
  }
} satisfies Actions;
