import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('gsc_client_session')?.value;

  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie);
      
      // Fetch latest hiredMembers from Supabase (not stale cookie)
      if (session.clientId) {
        const { data } = await supabase
          .from('clients')
          .select('hired_members')
          .eq('id', session.clientId)
          .single();
        
        if (data) {
          session.hiredMembers = data.hired_members || [];
        }
      }
      
      return NextResponse.json(session);
    } catch {
      return NextResponse.json({ authenticated: false });
    }
  }

  return NextResponse.json({ authenticated: false });
}
