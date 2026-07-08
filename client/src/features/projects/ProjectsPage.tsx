import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Folder, Loader2, Pencil, Trash2 } from 'lucide-react';
import api from '@/lib/api';

type Project = { _id: string; name: string; color: string; taskCount: number };

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', color: '#6366f1' });
  const [editId, setEditId] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data } = await api.get('/projects');
    setProjects(data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editId) {
      await api.put(`/projects/${editId}`, form);
    } else {
      await api.post('/projects', form);
    }
    setForm({ name: '', color: '#6366f1' });
    setShowForm(false);
    setEditId(null);
    fetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? Its tasks will be moved to Inbox.')) return;
    await api.delete(`/projects/${id}`);
    setProjects(p => p.filter(pr => pr._id !== id));
  };

  const startEdit = (pr: Project) => {
    setForm({ name: pr.name, color: pr.color });
    setEditId(pr._id);
    setShowForm(true);
  };

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <button id="new-project-btn" onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', color: '#6366f1' }); }}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
          <Plus size={16} /> New project
        </button>
      </div>

      {/* Create / edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">{editId ? 'Edit project' : 'New project'}</h2>
          <div className="flex gap-4">
            <input id="project-name-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Project name" required
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition text-sm" />
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-2">Color</p>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110 ring-offset-[#0a0a0f]"
                  style={{ backgroundColor: c, outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: 3 }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 bg-white/5 border border-white/10 text-gray-300 py-2 rounded-lg text-sm transition">Cancel</button>
            <button id="save-project-btn" type="submit"
              className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2 rounded-lg text-sm font-medium transition">
              {editId ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <Folder size={48} className="mx-auto text-gray-700 mb-4" />
          <p className="text-gray-400 font-medium">No projects yet</p>
          <p className="text-gray-600 text-sm mt-1">Create a project to group and organize your tasks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(pr => (
            <div key={pr._id}
              className="group relative bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl p-5 cursor-pointer transition-all"
              onClick={() => navigate(`/projects/${pr._id}`)}>
              {/* Color accent */}
              <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center" style={{ backgroundColor: pr.color + '22' }}>
                <Folder size={20} style={{ color: pr.color }} />
              </div>
              <h3 className="text-white font-semibold mb-1">{pr.name}</h3>
              <p className="text-gray-500 text-sm">{pr.taskCount} task{pr.taskCount !== 1 ? 's' : ''}</p>

              {/* Actions */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button id={`edit-project-${pr._id}`} onClick={e => { e.stopPropagation(); startEdit(pr); }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition">
                  <Pencil size={14} />
                </button>
                <button id={`delete-project-${pr._id}`} onClick={e => { e.stopPropagation(); handleDelete(pr._id); }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
