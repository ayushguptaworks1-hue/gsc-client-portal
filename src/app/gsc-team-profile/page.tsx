'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Profile } from '@/types/profile';
import { supabase } from '@/lib/supabase';
import ProfileCard from '@/components/ProfileCard';
import FilterPanel from '@/components/FilterPanel';

export default function GscTeamProfile() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [session, setSession] = useState<{
    authenticated: boolean;
    companyName?: string;
    hiredMembers?: string[];
  }>({ authenticated: false });
  const [filters, setFilters] = useState({
    role: '',
    availability: '',
    selectedSkills: [] as string[],
    searchQuery: ''
  });
  const router = useRouter();

  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    checkSessionAndLoad();
  }, []);

  const checkSessionAndLoad = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      setSession(sessionData);

      if (!sessionData.authenticated) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

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

  // INVISIBLE FILTERING - Remove hired members BEFORE any user filters
  const availableProfiles = useMemo(() => {
    return profiles.filter(p => !session.hiredMembers?.includes(p.id));
  }, [profiles, session.hiredMembers]);

  const roles = useMemo(() => {
    return Array.from(new Set(availableProfiles.map(p => p.role)));
  }, [availableProfiles]);

  const skills = useMemo(() => {
    const skillsSet = new Set<string>();
    availableProfiles.forEach(p => p.skills.forEach(skill => skillsSet.add(skill)));
    return Array.from(skillsSet).sort();
  }, [availableProfiles]);

  const filteredProfiles = useMemo(() => {
    return availableProfiles.filter(profile => {
      if (filters.searchQuery && !profile.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
      if (filters.role && profile.role !== filters.role) return false;
      if (filters.availability && profile.availability !== filters.availability) return false;
      if (filters.selectedSkills.length > 0) {
        const hasAll = filters.selectedSkills.every(skill => profile.skills.includes(skill));
        if (!hasAll) return false;
      }
      return true;
    });
  }, [filters, availableProfiles]);

  const totalPages = Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentProfiles = filteredProfiles.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white overflow-auto">
      {/* Main Content - Clean layout for iframe */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <FilterPanel
              roles={roles}
              skills={skills}
              initialFilters={filters}
              onFilterChange={setFilters}
            />
          </aside>

          {/* Profiles Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
              <p className="text-gray-700 text-lg">
                Showing <span className="font-bold text-indigo-600">{currentProfiles.length}</span> of{' '}
                <span className="font-bold">{filteredProfiles.length}</span> profiles
              </p>
            </div>

            {/* Pagination - Top */}
            {totalPages > 1 && currentProfiles.length > 0 && (
              <div className="mb-6 flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                >
                  Previous
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg font-medium text-sm ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                >
                  Next
                </button>
              </div>
            )}

            {currentProfiles.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentProfiles.map(profile => (
                    <ProfileCard key={profile.id} profile={profile} />
                  ))}
                </div>

                {/* Pagination - Bottom */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      Previous
                    </button>
                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-lg font-medium ${
                            currentPage === page
                              ? 'bg-indigo-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg shadow-md">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">No profiles found</h3>
                <p className="mt-2 text-gray-600">Try adjusting your filters to see more results.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
