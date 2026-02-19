import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { loginId, password } = await request.json();
    console.log('Login attempt:', { loginId });

    // Read clients from Supabase
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('login_id', loginId)
      .eq('password', password)
      .limit(1);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, message: 'Login failed', error: String(error) },
        { status: 500 }
      );
    }

    const client = clients?.[0];
    console.log('Client found:', client);

    if (client) {
      const response = NextResponse.json({
        success: true,
        companyName: client.company_name,
        clientId: client.id,
        hiredMembers: client.hired_members || [],
      });

      // Set session cookie - sameSite: 'none' required for cross-origin iframe
      response.cookies.set('gsc_client_session', JSON.stringify({
        authenticated: true,
        clientId: client.id,
        companyName: client.company_name,
        hiredMembers: client.hired_members || [],
      }), {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    }

    console.warn('Invalid login:', { loginId, password });
    return NextResponse.json(
      { success: false, message: 'Invalid login ID or password' },
      { status: 401 }
    );
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, message: 'Login failed', error: String(err) },
      { status: 500 }
    );
  }
}
