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
  const [activeTab, setActiveTab] = useState<'profiles' | 'clients' | 'create'>('profiles');

  // New client form
  const [newClient, setNewClient] = useState({
    companyName: '',
    loginId: '',
    password: '',
  });

  // Selected client for editing
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  // Show/hide credentials
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  // Editing client details
  const [editingClient, setEditingClient] = useState<{ id: string; field: 'companyName' | 'password'; value: string } | null>(null);

  const MANAGER_PASSWORD = 'gsc2024admin';

    // Persistent session: check localStorage on mount
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
        hoursPerWeek: p.hours_per_week ? String(p.hours_per_week) : undefined,
        transitionTime: p.transition_time ? String(p.transition_time) : undefined,
      }));

      setProfiles(mapped);

      // Load clients from Supabase
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) {
        console.error('Error loading clients:', clientsError);
      } else {
        const mappedClients: Client[] = (clientsData || []).map((c: Record<string, unknown>) => ({
          id: String(c.id),
          companyName: String(c.company_name || ''),
          loginId: String(c.login_id || ''),
          password: String(c.password || ''),
          hiredMembers: Array.isArray(c.hired_members) ? c.hired_members as string[] : [],
          createdAt: String(c.created_at || ''),
        }));
        setClients(mappedClients);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          company_name: newClient.companyName,
          login_id: newClient.loginId,
          password: newClient.password,
          hired_members: [],
        })
        .select()
        .single();

      if (error) {
        alert('Error creating client: ' + error.message);
        return;
      }

      if (!data) {
        alert('Error: No data returned after creating client');
        return;
      }

      setNewClient({ companyName: '', loginId: '', password: '' });
      setActiveTab('clients');
      alert(`Client created!\n\nLogin ID: ${newClient.loginId}\nPassword: ${newClient.password}`);
      // Reload all data to get fresh list from Supabase
      await loadData();
    } catch (err) {
      alert('Error creating client: ' + String(err));
    }
  };

  const deleteClient = async (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) {
        alert('Error deleting client: ' + error.message);
        return;
      }
      setClients(clients.filter((c) => c.id !== id));
      if (selectedClient?.id === id) setSelectedClient(null);
    }
  };

  const saveClientEdit = async () => {
    if (!editingClient || !editingClient.value.trim()) {
      setEditingClient(null);
      return;
    }
    const updateData = editingClient.field === 'companyName'
      ? { company_name: editingClient.value.trim() }
      : { password: editingClient.value.trim() };

    const { error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', editingClient.id);

    if (error) {
      alert('Error updating client: ' + error.message);
      return;
    }

    setClients(clients.map(c =>
      c.id === editingClient.id
        ? { ...c, [editingClient.field]: editingClient.value.trim() }
        : c
    ));
    setEditingClient(null);
  };

  const updateClientHiredMembers = async (clientId: string, newHired: string[]) => {
    const { error } = await supabase
      .from('clients')
      .update({ hired_members: newHired })
      .eq('id', clientId);

    if (error) {
      alert('Error updating: ' + error.message);
      return;
    }

    const updated = clients.map((c) =>
      c.id === clientId ? { ...c, hiredMembers: newHired } : c
    );
    setClients(updated);
    if (selectedClient?.id === clientId) {
      setSelectedClient(updated.find((c) => c.id === clientId) || null);
    }
  };

  const addProfileToClient = (clientId: string, profileId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || client.hiredMembers.includes(profileId)) return;
    updateClientHiredMembers(clientId, [...client.hiredMembers, profileId]);
  };

  const removeProfileFromClient = (clientId: string, profileId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    updateClientHiredMembers(clientId, client.hiredMembers.filter(id => id !== profileId));
  };

  const moveProfileInClient = (clientId: string, profileId: string, direction: 'up' | 'down') => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const arr = [...client.hiredMembers];
    const idx = arr.indexOf(profileId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === arr.length - 1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
    updateClientHiredMembers(clientId, arr);
  };

  const getProfileName = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    return profile?.name || 'Unknown';
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

      {/* Stats Bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">{profiles.length}</p>
              <p className="text-sm text-gray-500">Total Profiles</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{clients.length}</p>
              <p className="text-sm text-gray-500">Active Clients</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">
                {clients.reduce((sum, c) => sum + c.hiredMembers.length, 0)}
              </p>
              <p className="text-sm text-gray-500">Total Assigned Profiles</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('profiles')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'profiles'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
            }`}
          >
            All Profiles ({profiles.length})
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'clients'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
            }`}
          >
            Clients ({clients.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'create'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
            }`}
          >
            + Create Client
          </button>
        </div>

        {/* ========== ALL PROFILES TAB ========== */}
        {activeTab === 'profiles' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">All Team Profiles</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Experience</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Availability</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Skills</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Shown For</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile, index) => {
                    const shownFor = clients.filter(c => c.hiredMembers.includes(profile.id));
                    return (
                      <tr key={profile.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-4 text-sm text-gray-500">{index + 1}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-100 flex-shrink-0">
                              {profile.mediaType === 'image' && profile.mediaUrl ? (
                                <img src={profile.mediaUrl} alt={profile.name} className="w-full h-full object-cover" />
                              ) : profile.thumbnailUrl ? (
                                <img src={profile.thumbnailUrl} alt={profile.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-sm font-bold text-indigo-600">{profile.name.charAt(0)}</span>
                                </div>
                              )}
                            </div>
                            <span className="font-semibold text-gray-900 text-sm">{profile.name}</span>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-indigo-600 font-medium">{profile.role}</td>
                        <td className="py-4 text-sm text-gray-600">{profile.experience}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            profile.availability === 'Available'
                              ? 'bg-green-100 text-green-700'
                              : profile.availability === 'Busy'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {profile.availability}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {profile.skills.slice(0, 3).map((skill) => (
                              <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {skill}
                              </span>
                            ))}
                            {profile.skills.length > 3 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                                +{profile.skills.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          {shownFor.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {shownFor.map(c => (
                                <span key={c.id} className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full border border-green-200">
                                  {c.companyName}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========== CLIENTS TAB ========== */}
        {activeTab === 'clients' && (
          <div>
            {/* Client Cards with full details */}
            {clients.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-lg font-medium">No clients yet</p>
                <p className="text-sm mt-1">Create a client to get started.</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                >
                  + Create Client
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {clients.map((client) => {
                  const shownCount = client.hiredMembers.length;
                  const hiddenCount = profiles.length - client.hiredMembers.length;
                  const shownNames = client.hiredMembers.map(id => getProfileName(id));
                  const isExpanded = selectedClient?.id === client.id;
                  const passwordVisible = showPasswords[client.id];

                  return (
                    <div key={client.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                      {/* Client Header */}
                      <div
                        className="p-5 cursor-pointer hover:bg-gray-50 transition"
                        onClick={() => setSelectedClient(isExpanded ? null : client)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-lg font-bold text-indigo-600">
                                  {client.companyName.charAt(0)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {editingClient?.id === client.id && editingClient.field === 'companyName' ? (
                                  <input
                                    type="text"
                                    value={editingClient.value}
                                    onChange={(e) => setEditingClient({ ...editingClient, value: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === 'Enter') saveClientEdit(); if (e.key === 'Escape') setEditingClient(null); }}
                                    onBlur={() => saveClientEdit()}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-lg font-bold text-gray-900 border border-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    autoFocus
                                  />
                                ) : (
                                  <>
                                    <h3 className="text-lg font-bold text-gray-900">{client.companyName}</h3>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setEditingClient({ id: client.id, field: 'companyName', value: client.companyName }); }}
                                      className="text-gray-400 hover:text-indigo-600 transition"
                                      title="Edit company name"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 -mt-2 mb-3 ml-[52px]">Created: {new Date(client.createdAt).toLocaleDateString()}</p>

                            {/* Credentials */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 font-medium mb-1">Login ID</p>
                                <p className="font-mono text-sm font-bold text-gray-900">{client.loginId}</p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 font-medium mb-1">Password</p>
                                {editingClient?.id === client.id && editingClient.field === 'password' ? (
                                  <input
                                    type="text"
                                    value={editingClient.value}
                                    onChange={(e) => setEditingClient({ ...editingClient, value: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === 'Enter') saveClientEdit(); if (e.key === 'Escape') setEditingClient(null); }}
                                    onBlur={() => saveClientEdit()}
                                    onClick={(e) => e.stopPropagation()}
                                    className="font-mono text-sm font-bold text-gray-900 border border-indigo-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    autoFocus
                                  />
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <p className="font-mono text-sm font-bold text-gray-900">
                                      {passwordVisible ? client.password : '••••••••'}
                                    </p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowPasswords(prev => ({ ...prev, [client.id]: !prev[client.id] }));
                                      }}
                                      className="text-gray-400 hover:text-gray-600"
                                      title="Show/hide password"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {passwordVisible ? (
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        ) : (
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        )}
                                      </svg>
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setEditingClient({ id: client.id, field: 'password', value: client.password }); }}
                                      className="text-gray-400 hover:text-indigo-600 transition"
                                      title="Edit password"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 font-medium mb-1">Profile Access</p>
                                <p className="text-sm font-bold">
                                  <span className="text-green-600">{shownCount} shown</span>
                                  {hiddenCount > 0 && (
                                    <span className="text-red-600"> / {hiddenCount} hidden</span>
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Shown profile names - quick preview */}
                            {shownNames.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500">
                                  Shown: <span className="font-medium text-green-600">{shownNames.join(', ')}</span>
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteClient(client.id);
                              }}
                              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                              title="Delete client"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                            <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Expanded: Profile Reorder Panel */}
                      {isExpanded && (
                        <div className="border-t bg-gray-50 p-5">
                          {/* Assigned Profiles - Ordered */}
                          <p className="text-sm font-semibold text-gray-700 mb-3">
                            Assigned Profiles for {client.companyName} ({client.hiredMembers.length}):
                          </p>
                          {client.hiredMembers.length > 0 ? (
                            <div className="space-y-2 mb-6 max-h-[40vh] overflow-y-auto">
                              {client.hiredMembers.map((pid, idx) => {
                                const profile = profiles.find(p => p.id === pid);
                                if (!profile) return null;
                                return (
                                  <div
                                    key={pid}
                                    className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                                  >
                                    <span className="text-sm font-bold text-gray-400 w-6 text-center">{idx + 1}</span>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium text-gray-900 text-sm truncate">{profile.name}</p>
                                      <p className="text-xs text-gray-500 truncate">{profile.role}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); moveProfileInClient(client.id, pid, 'up'); }}
                                        disabled={idx === 0}
                                        className={`p-1.5 rounded transition ${idx === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-green-100 hover:text-gray-700'}`}
                                        title="Move up"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); moveProfileInClient(client.id, pid, 'down'); }}
                                        disabled={idx === client.hiredMembers.length - 1}
                                        className={`p-1.5 rounded transition ${idx === client.hiredMembers.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-green-100 hover:text-gray-700'}`}
                                        title="Move down"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); removeProfileFromClient(client.id, pid); }}
                                        className="p-1.5 rounded text-red-400 hover:bg-red-100 hover:text-red-600 transition ml-1"
                                        title="Remove"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 mb-6">No profiles assigned yet.</p>
                          )}

                          {/* Available Profiles - Not assigned */}
                          {(() => {
                            const unassigned = profiles.filter(p => !client.hiredMembers.includes(p.id));
                            if (unassigned.length === 0) return null;
                            return (
                              <>
                                <p className="text-sm font-semibold text-gray-700 mb-3">
                                  Available Profiles ({unassigned.length}):
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[30vh] overflow-y-auto">
                                  {unassigned.map((profile) => (
                                    <div
                                      key={profile.id}
                                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                                    >
                                      <div className="min-w-0 flex-1">
                                        <p className="font-medium text-gray-900 text-sm truncate">{profile.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{profile.role}</p>
                                      </div>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); addProfileToClient(client.id, profile.id); }}
                                        className="ml-2 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full hover:bg-green-200 transition whitespace-nowrap"
                                      >
                                        + Add
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========== CREATE CLIENT TAB ========== */}
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
      </main>
    </div>
  );
}
