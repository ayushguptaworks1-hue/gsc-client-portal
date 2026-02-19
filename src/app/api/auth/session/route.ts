import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('gsc_client_session')?.value;
  console.log('Session cookie:', sessionCookie);

  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie);
      console.log('Session parsed:', session);
      // Fetch latest hiredMembers from Supabase (not stale cookie)
      if (session.clientId) {
        const { data, error } = await supabase
          .from('clients')
          .select('hired_members')
          .eq('id', session.clientId)
          .single();
        if (error) {
          console.error('Supabase error:', error);
        }
        if (data) {
          session.hiredMembers = data.hired_members || [];
        }
      }
      return NextResponse.json(session);
    } catch (err) {
      console.error('Session parse error:', err);
      return NextResponse.json({ authenticated: false, error: String(err) });
    }
  }

  console.warn('No session cookie found');
  return NextResponse.json({ authenticated: false });
}
