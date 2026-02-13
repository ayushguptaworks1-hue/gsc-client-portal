'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Profile } from '@/types/profile';
import { supabase } from '@/lib/supabase';
import ProfileCard from '@/components/ProfileCard';

export default function GscTeamProfile() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{
    authenticated: boolean;
    companyName?: string;
    hiredMembers?: string[];
  }>({ authenticated: false });
  const router = useRouter();

  useEffect(() => {
    checkSessionAndLoad();
  }, []);

  const checkSessionAndLoad = async () => {
    try {
      // Check session
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      setSession(sessionData);

      if (!sessionData.authenticated) {
        router.push('/login');
        return;
      }

      // Load profiles from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (error) throw error;

      const mapped: Profile[] = (data || []).map((p: Record<string, unknown>) => ({
        id: String(p.id),
        name: String(p.name || ''),
        role: String(p.role || ''),
        experience: String(p.experience || ''),
        skills: Array.isArray(p.skills) ? p.skills as string[] : [],
        availability: (p.availability as Profile['availability']) || 'Available',
        mediaType: (p.media_type as 'video' | 'image') || 'image',
        mediaUrl: String(p.media_url || ''),
        thumbnailUrl: p.thumbnail_url ? String(p.thumbnail_url) : undefined,
        bio: p.bio ? String(p.bio) : undefined,
        email: p.email ? String(p.email) : undefined,
        location: p.location ? String(p.location) : undefined,
        cvUrl: p.cv_url ? String(p.cv_url) : undefined,
      }));

      setProfiles(mapped);
    } catch (error) {
      console.error('Error loading:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // INVISIBLE FILTERING - Remove hired members before display
  const visibleProfiles = profiles.filter(
    (p) => !session.hiredMembers?.includes(p.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading team profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white py-6 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">GSC Outsourcing</h1>
            <p className="text-blue-200 text-sm">
              Welcome, {session.companyName || 'Client'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Profiles */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Available Team Members</h2>
          <p className="text-gray-600 mt-1">
            Showing <span className="font-bold text-indigo-600">{visibleProfiles.length}</span> available profiles
          </p>
        </div>

        {visibleProfiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleProfiles.map(profile => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No available team members at this time.</p>
            <p className="text-gray-400 mt-2">Please contact your account manager for assistance.</p>
          </div>
        )}
      </main>
    </div>
  );
}
