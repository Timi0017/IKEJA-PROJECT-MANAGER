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
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Header Area */}
            <div className="max-w-6xl mx-auto flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800">My Workspaces</h1>
                <div className="space-x-4">
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition"
                    >
                        + New Project
                    </button>
                    <button onClick={handleLogout} className="text-gray-500 hover:text-red-500">
                        Logout
                    </button>
                </div>
            </div>

            {/* Projects Grid Area */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.length === 0 ? (
                    <p className="text-gray-500 italic col-span-full">You have no projects yet. Create one to get started!</p>
                ) : (
                    projects.map((project) => (
                        <div key={project.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-48">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{project.name}</h3>
                                <p className="text-gray-500 text-sm line-clamp-2">{project.description}</p>
                            </div>
                            <button 
                                onClick={() => navigate(`/projects/${project.id}`)}
                                className="mt-4 w-full bg-gray-100 text-gray-700 font-semibold py-2 rounded hover:bg-gray-200 transition"
                            >
                                View Project
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Create Project Modal (Hidden by default) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Project</h2>
                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                                <input 
                                    type="text" 
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea 
                                    value={newProjectDesc}
                                    onChange={(e) => setNewProjectDesc(e.target.value)}
                                    className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-500 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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