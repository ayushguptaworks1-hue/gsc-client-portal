'use client';

import { useState, useEffect } from 'react';
import { Profile } from '@/types/profile';
import { Client } from '@/types/client';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [managerPassword, setManagerPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'clients' | 'create'>('clients');

  // New client form
  const [newClient, setNewClient] = useState({
    companyName: '',
    loginId: '',
    password: '',
  });

  // Selected client for editing
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const MANAGER_PASSWORD = 'gsc2024admin';

  useEffect(() => {
    const saved = localStorage.getItem('gsc_manager_auth');
    if (saved === 'true') {
      setAuthenticated(true);
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleManagerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (managerPassword === MANAGER_PASSWORD) {
      setAuthenticated(true);
      localStorage.setItem('gsc_manager_auth', 'true');
      loadData();
    } else {
      alert('Incorrect password');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
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

      // Load clients from localStorage
      const savedClients = localStorage.getItem('gsc_clients');
      if (savedClients) {
        setClients(JSON.parse(savedClients));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveClients = (updatedClients: Client[]) => {
    setClients(updatedClients);
    localStorage.setItem('gsc_clients', JSON.stringify(updatedClients));
    // Also save to cookie so API routes can access it
    document.cookie = `gsc_clients=${encodeURIComponent(JSON.stringify(updatedClients))}; path=/; max-age=${60 * 60 * 24 * 365}`;
  };

  const createClient = (e: React.FormEvent) => {
    e.preventDefault();
    const client: Client = {
      id: Date.now().toString(),
      companyName: newClient.companyName,
      loginId: newClient.loginId,
      password: newClient.password,
      hiredMembers: [],
      createdAt: new Date().toISOString(),
    };
    saveClients([...clients, client]);
    setNewClient({ companyName: '', loginId: '', password: '' });
    setActiveTab('clients');
    alert(`Client created!\n\nLogin ID: ${client.loginId}\nPassword: ${client.password}`);
  };

  const deleteClient = (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      saveClients(clients.filter((c) => c.id !== id));
      if (selectedClient?.id === id) setSelectedClient(null);
    }
  };

  const toggleHiredMember = (clientId: string, profileId: string) => {
    const updated = clients.map((c) => {
      if (c.id === clientId) {
        const hired = c.hiredMembers.includes(profileId)
          ? c.hiredMembers.filter((id) => id !== profileId)
          : [...c.hiredMembers, profileId];
        return { ...c, hiredMembers: hired };
      }
      return c;
    });
    saveClients(updated);
    if (selectedClient?.id === clientId) {
      setSelectedClient(updated.find((c) => c.id === clientId) || null);
    }
  };

  // Manager login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">Manager Dashboard</h1>
          <form onSubmit={handleManagerLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manager Password</label>
              <input
                type="password"
                value={managerPassword}
                onChange={(e) => setManagerPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter manager password"
                required
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white py-6 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Manager Dashboard</h1>
            <p className="text-blue-200 text-sm">Manage client access to team profiles</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('gsc_manager_auth');
              setAuthenticated(false);
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'clients'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Clients ({clients.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'create'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            + Create Client
          </button>
        </div>

        {/* Create Client Tab */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Client</h2>
            <form onSubmit={createClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={newClient.companyName}
                  onChange={(e) => setNewClient({ ...newClient, companyName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., ABC Corp"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Login ID</label>
                <input
                  type="text"
                  value={newClient.loginId}
                  onChange={(e) => setNewClient({ ...newClient, loginId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., abc-corp"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="text"
                  value={newClient.password}
                  onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., pass123"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold">
                Create Client
              </button>
            </form>
          </div>
        )}

        {/* Clients List Tab */}
        {activeTab === 'clients' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client List */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">All Clients</h2>
              {clients.length === 0 ? (
                <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
                  No clients yet. Create one first.
                </div>
              ) : (
                clients.map((client) => (
                  <div
                    key={client.id}
                    className={`bg-white rounded-xl shadow p-4 cursor-pointer transition border-2 ${
                      selectedClient?.id === client.id
                        ? 'border-indigo-500'
                        : 'border-transparent hover:border-gray-200'
                    }`}
                    onClick={() => setSelectedClient(client)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900">{client.companyName}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Login: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{client.loginId}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Password: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{client.password}</span>
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Hidden profiles: <span className="font-bold text-red-600">{client.hiredMembers.length}</span>
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteClient(client.id);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Profile Toggle Panel */}
            <div>
              {selectedClient ? (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Manage: {selectedClient.companyName}
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Toggle profiles to hide them from this client. Hidden profiles won&apos;t appear when they log in.
                  </p>

                  <div className="space-y-3">
                    {profiles.map((profile) => {
                      const isHidden = selectedClient.hiredMembers.includes(profile.id);
                      return (
                        <div
                          key={profile.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition cursor-pointer ${
                            isHidden
                              ? 'bg-red-50 border-red-200'
                              : 'bg-green-50 border-green-200'
                          }`}
                          onClick={() => toggleHiredMember(selectedClient.id, profile.id)}
                        >
                          <div>
                            <p className="font-medium text-gray-900">{profile.name}</p>
                            <p className="text-sm text-gray-500">{profile.role}</p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              isHidden
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {isHidden ? 'HIDDEN' : 'VISIBLE'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
                  Select a client to manage their profile visibility
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
