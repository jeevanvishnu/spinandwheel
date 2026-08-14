import React, { useEffect, useState } from 'react';

interface Segment {
  _id: string;
  label: string;
  imageURL?: string;
  count?: number;
  afterWin?: string;
}

export default function AdminSpin() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const [formData, setFormData] = useState({ label: '', imageURL: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [isManagingLimits, setIsManagingLimits] = useState(false);
  const [limitSelection, setLimitSelection] = useState<{_id: string, count: number, afterWin: string} | null>(null);
  const [isSavingLimits, setIsSavingLimits] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [passkeyError, setPasskeyError] = useState('');

  const fetchSegments = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/segments`);
      if (!response.ok) throw new Error('Failed to fetch segments');
      const data = await response.json();
      setSegments(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    setFormError('');

    if (formData.label.trim().length < 2) {
      setFormError('Label must be at least 2 characters long');
      return;
    }

    setIsSaving(true);

    try {
      const url = editingSegment
        ? `${import.meta.env.VITE_API_URL}/admin/segments/${editingSegment._id}`
        : `${import.meta.env.VITE_API_URL}/admin/segments`;
      
      const method = editingSegment ? 'PUT' : 'POST';

      const data = new FormData();
      data.append('label', formData.label);
      if (formData.imageURL) {
        data.append('imageURL', formData.imageURL); // keep old url if no new file
      }
      if (imageFile) {
        data.append('image', imageFile);
      }

      const response = await fetch(url, {
        method,
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save segment');
      }

      await fetchSegments();
      setIsAdding(false);
      setEditingSegment(null);
      setFormData({ label: '', imageURL: '' });
      setImageFile(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save segment');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const segmentId = deleteConfirm;

    setIsDeleting(segmentId);
    setDeleteError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/segments/${segmentId}`, {
        method: 'DELETE',
      });
      
      // If 404, it's already deleted, so we can proceed to remove it from the UI.
      if (!response.ok && response.status !== 404) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete');
      }
      
      setSegments(segments.filter(s => s._id !== segmentId));
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.message || 'Failed to delete segment');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSaveLimits = async () => {
    if (!limitSelection) return;
    setIsSavingLimits(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/segments/bulk-counts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counts: [limitSelection] })
      });
      if (!response.ok) throw new Error('Failed to update limit');
      await fetchSegments();
      setIsManagingLimits(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save limit');
    } finally {
      setIsSavingLimits(false);
    }
  };

  const handleEditClick = (segment: Segment) => {
    setEditingSegment(segment);
    setFormData({
      label: segment.label,
      imageURL: segment.imageURL || '',
      count: segment.count || 0
    });
    setImageFile(null);
    setIsAdding(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 w-full max-w-md animate-in fade-in zoom-in duration-200">
          <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">Admin Verification</h2>
          <p className="text-sm text-slate-500 mb-6 text-center">Please enter the passkey to access the wheel configuration.</p>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/verify-passkey`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passkey: passkeyInput })
              });
              if (response.ok) {
                setIsAuthenticated(true);
              } else {
                const data = await response.json();
                setPasskeyError(data.error || 'Incorrect passkey');
              }
            } catch (err) {
              setPasskeyError('Server error, please try again later');
            }
          }} className="space-y-4">
            <div>
              <input
                type="password"
                value={passkeyInput}
                onChange={(e) => {
                  setPasskeyInput(e.target.value);
                  setPasskeyError('');
                }}
                placeholder="Enter passkey"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-center text-lg tracking-widest font-mono"
              />
              {passkeyError && <p className="text-red-500 text-sm mt-2 text-center font-medium animate-in slide-in-from-top-1">{passkeyError}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md shadow-slate-900/20"
            >
              Unlock Access
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-red-50 text-red-500 p-4 rounded-lg shadow-sm border border-red-100">
          <p className="font-bold">Error loading data</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Spin Wheel Configuration</h1>
            <p className="text-slate-500 mt-1">Manage the segments and prizes on the spinning wheel.</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => {
                if (segments.length > 0) {
                  setLimitSelection({ 
                    _id: segments[0]._id, 
                    count: segments[0].count === undefined ? 0 : segments[0].count,
                    afterWin: segments[0].afterWin || 'disable'
                  });
                  setIsManagingLimits(true);
                } else {
                  alert("Please add a segment first.");
                }
              }}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-6 rounded-xl transition-colors shadow-md shadow-slate-900/20"
            >
              ⚙️ Manage Limits
            </button>
            <button
              onClick={() => {
                setEditingSegment(null);
                setFormData({ label: '', imageURL: '' });
                setImageFile(null);
                setIsAdding(true);
              }}
              className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-6 rounded-xl transition-colors shadow-md shadow-rose-500/20"
            >
              + Add Segment
            </button>
            <a href="/admin/view" className="text-rose-500 hover:text-rose-600 font-semibold underline text-sm ml-2">
              View Participants
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {segments.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl p-8 text-center border border-slate-200">
              <p className="text-slate-500 mb-4">No wheel segments configured yet.</p>
              <button
                onClick={() => setIsAdding(true)}
                className="bg-rose-50 text-rose-500 font-bold py-2 px-6 rounded-xl hover:bg-rose-100 transition-colors"
              >
                Create your first segment
              </button>
            </div>
          ) : (
            segments.map((segment) => (
              <div key={segment._id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{segment.label}</h3>
                    <p className={`text-xs font-bold px-2.5 py-0.5 rounded-md mt-1 border inline-block ${
                      (segment.count === undefined || segment.count === 0) 
                        ? (segment.afterWin === 'random' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-600 border-red-100')
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {(segment.count === undefined || segment.count === 0) 
                        ? (segment.afterWin === 'random' ? 'Win Randomly' : 'Disabled')
                        : `Rigged: Spin #${segment.count} (${segment.afterWin === 'random' ? 'then Random' : 'then Disable'})`}
                    </p>
                  </div>
                  {segment.imageURL && (
                    <img 
                      src={segment.imageURL.startsWith('/') ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${segment.imageURL}` : segment.imageURL} 
                      alt="" 
                      className="w-10 h-10 rounded-full object-cover shadow-sm bg-slate-100" 
                    />
                  )}
                </div>
                
                <div className="flex justify-end gap-2 mt-auto pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleEditClick(segment)}
                    className="text-xs font-bold text-blue-500 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(segment._id)}
                    className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsAdding(false)} />

          <div className="relative max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-1">
              {editingSegment ? 'Edit Segment' : 'Add New Segment'}
            </h2>
            <p className="text-xs text-slate-500 mb-5">Configure the prize details.</p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-500 text-sm border border-red-100 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Prize Label</label>
                <input
                  type="text"
                  required
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g. 50g Almonds"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Image Upload (Optional)</label>
                <div className="flex items-center gap-4">
                  {imageFile ? (
                    <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-12 h-12 rounded-lg object-cover shadow-sm" />
                  ) : formData.imageURL ? (
                    <img 
                      src={formData.imageURL.startsWith('/') ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${formData.imageURL}` : formData.imageURL} 
                      alt="Current" 
                      className="w-12 h-12 rounded-lg object-cover shadow-sm" 
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                      }
                    }}
                    className="flex-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  disabled={isSaving}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-colors text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 px-4 rounded-xl transition-colors shadow-md shadow-rose-500/20 text-sm disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : (editingSegment ? 'Save Changes' : 'Create Segment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE LIMITS MODAL */}
      {isManagingLimits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsManagingLimits(false)} />

          <div className="relative max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Prize Settings & Limits</h2>
            <p className="text-xs text-slate-500 mb-5">Rig a prize to be won on a specific spin number, keep it randomly winnable, or disable it entirely.</p>

            <div className="overflow-y-auto flex-1 mb-4 pr-2">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Segment</label>
                  <select
                    value={limitSelection?._id || ''}
                    onChange={(e) => {
                      const sel = segments.find(s => s._id === e.target.value);
                      if (sel) {
                        setLimitSelection({ 
                          _id: sel._id, 
                          count: sel.count === undefined ? 0 : sel.count,
                          afterWin: sel.afterWin || 'disable'
                        });
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-semibold"
                  >
                    {segments.map(s => (
                      <option key={s._id} value={s._id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                {limitSelection && (
                  <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">
                        {segments.find(s => s._id === limitSelection._id)?.label || 'Unknown'}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        limitSelection.count > 0 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : limitSelection.afterWin === 'random'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {limitSelection.count > 0 
                          ? `Rigged (Spin #${limitSelection.count})` 
                          : limitSelection.afterWin === 'random'
                          ? 'Win Randomly' 
                          : 'Disabled'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Rig to Specific Spin?</label>
                        <select
                          value={limitSelection.count > 0 ? 'yes' : 'no'}
                          onChange={(e) => {
                            if (e.target.value === 'yes') {
                              setLimitSelection({ ...limitSelection, count: 1, afterWin: 'disable' });
                            } else {
                              setLimitSelection({ ...limitSelection, count: 0, afterWin: 'random' });
                            }
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-800 focus:outline-none"
                        >
                          <option value="no">No (Standard/Random or Disabled)</option>
                          <option value="yes">Yes (Rigged)</option>
                        </select>
                      </div>

                      {limitSelection.count > 0 ? (
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Spin Number</label>
                          <input
                            type="number"
                            min="1"
                            value={limitSelection.count}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              setLimitSelection({ ...limitSelection, count: val });
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                          <select
                            value={limitSelection.afterWin}
                            onChange={(e) => {
                              setLimitSelection({ ...limitSelection, afterWin: e.target.value });
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-800 focus:outline-none"
                          >
                            <option value="random">Enabled (Winnable Randomly)</option>
                            <option value="disable">Disabled Entirely</option>
                          </select>
                        </div>
                      )}

                      {limitSelection.count > 0 && (
                        <div className="col-span-full">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">After Winning Spin #{limitSelection.count}</label>
                          <select
                            value={limitSelection.afterWin}
                            onChange={(e) => {
                              setLimitSelection({ ...limitSelection, afterWin: e.target.value });
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-800 focus:outline-none"
                          >
                            <option value="disable">Disable Entirely (Never Win Again)</option>
                            <option value="random">Make Winnable Randomly</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsManagingLimits(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLimits}
                disabled={isSavingLimits}
                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl transition-colors shadow-md text-sm disabled:opacity-50"
              >
                {isSavingLimits ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => {
            setDeleteConfirm(null);
            setDeleteError('');
          }} />

          <div className="relative max-w-sm w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 p-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-lg leading-6 font-bold text-slate-900 mb-2">Delete Segment</h3>
            
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this segment? This action cannot be undone.
            </p>

            {deleteError && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 text-red-500 text-sm border border-red-100 font-medium">
                {deleteError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeleteError('');
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting !== null}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-4 rounded-xl transition-colors shadow-md shadow-red-500/20 text-sm disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
