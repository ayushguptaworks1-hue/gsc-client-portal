import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { loginId, password } = await request.json();

    // Read clients from cookie (set by dashboard)
    const storedClientsData = request.cookies.get('gsc_clients')?.value;
    let allClients: Array<{
      id: string;
      companyName: string;
      loginId: string;
      password: string;
      hiredMembers: string[];
    }> = [];
    
    if (storedClientsData) {
      try {
        allClients = JSON.parse(decodeURIComponent(storedClientsData));
      } catch {
        // ignore parse errors
      }
    }

    const client = allClients.find(
      (c) => c.loginId === loginId && c.password === password
    );

    if (client) {
      const response = NextResponse.json({
        success: true,
        companyName: client.companyName,
      });

      // Set session cookie
      response.cookies.set('gsc_client_session', JSON.stringify({
        authenticated: true,
        clientId: client.id,
        companyName: client.companyName,
        hiredMembers: client.hiredMembers,
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: 'Invalid login ID or password' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Login failed' },
      { status: 500 }
    );
  }
}
