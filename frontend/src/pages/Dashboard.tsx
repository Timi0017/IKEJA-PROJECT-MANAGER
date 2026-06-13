import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Project {
    id: number;
    name: string;
    description: string;
}

export default function Dashboard() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const navigate = useNavigate();


    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            setProjects(response.data.projects);
        } catch(error) {
            console.error("failed to fetch projects", error);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        try{
            await api.post('/projects', {
                name: newProjectName,
                description: newProjectDesc
            });
            setIsModalOpen(false);
            setNewProjectName('');
            setNewProjectDesc('');
            fetchProjects();
        } catch(error) {
            alert("failed to create project");
        }
    };

    //logout handler
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

   return (
        <div className="min-h-screen bg-[#F5F5F7] p-8 font-sans text-gray-900">
            {/* Header Area */}
            <div className="max-w-6xl mx-auto flex justify-between items-center mb-10">
                <h1 className="text-3xl font-semibold tracking-tight">My Workspaces</h1>
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-blue-700 transition shadow-sm cursor-pointer"
                    >
                        + New Project
                    </button>
                    <button onClick={handleLogout} className="text-sm font-medium text-gray-500 hover:text-red-500 transition cursor-pointer">
                        Logout
                    </button>
                </div>
            </div>

            {/* Projects Grid Area */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-200 border-dashed">
                        <p className="text-gray-500 text-center">You have no projects yet. Create one to get started!</p>
                    </div>
                ) : (
                    projects.map((project) => (
                        <div key={project.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/60 flex flex-col justify-between h-48 hover:shadow-md transition-shadow group">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">{project.name}</h3>
                                <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">{project.description}</p>
                            </div>
                            <button 
                                onClick={() => navigate(`/projects/${project.id}`)}
                                className="mt-4 w-full bg-gray-50 text-blue-600 font-medium py-2.5 rounded-xl hover:bg-blue-50 transition group-hover:bg-blue-50 cursor-pointer"
                            >
                                View Project
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Create Project Modal (Apple/Google Style) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
                        <h2 className="text-2xl font-semibold mb-6 text-gray-900 tracking-tight">Create New Project</h2>
                        <form onSubmit={handleCreateProject} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Name</label>
                                <input 
                                    type="text" 
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                    required
                                    placeholder="e.g. Website Redesign"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                                <textarea 
                                    value={newProjectDesc}
                                    onChange={(e) => setNewProjectDesc(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none resize-none"
                                    rows={3}
                                    placeholder="What is this project about?"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-8 pt-2">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 shadow-sm transition cursor-pointer"
                                >
                                    Create Workspace
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}