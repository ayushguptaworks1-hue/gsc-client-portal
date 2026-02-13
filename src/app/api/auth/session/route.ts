import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('gsc_client_session')?.value;

  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie);
      return NextResponse.json(session);
    } catch {
      return NextResponse.json({ authenticated: false });
    }
  }

  return NextResponse.json({ authenticated: false });
}
