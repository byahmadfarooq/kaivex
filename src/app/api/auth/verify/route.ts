import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE, verifyPin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();

    if (!pin || !verifyPin(pin)) {
      return NextResponse.json({ success: false, error: 'Invalid PIN' }, { status: 401 });
    }

    const sessionToken = await createSessionToken('ahmad');
    const response = NextResponse.json({ success: true, message: 'Authenticated' });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (err) {
    console.error('Auth verification error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}