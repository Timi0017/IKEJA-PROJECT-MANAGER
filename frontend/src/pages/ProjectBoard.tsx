import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
// import api from "../api";

interface Task {
id: string;
  title: string;
  description: string;
  status: string; // "To-Do", "In Progress", "Done"
  priority: string; // "Low", "Medium", "High"
  project_id: string;
}

export default function ProjectBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // state hooks for the data and loading screens
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // Reaching out to your backend endpoint
      const response = await api.get(`/projects/${projectId}/tasks`);
      setTasks(response.data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load project tasks. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger the fetch automatically when the component mounts or projectId shifts
  useEffect(() => {
    if (projectId) {
      fetchTasks();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        <p className="animate-pulse">Loading project board...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-400 p-4">
        <p className="text-red-400 font-medium mb-4">{error}</p>
        <button onClick={fetchTasks} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm">
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <button 
            onClick={() => navigate("/dashboard")} 
            className="text-sm text-indigo-400 hover:underline mb-2 block"
          >
            &larr; Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold tracking-tight">Project Workspace</h1>
          <p className="text-xs text-slate-400 mt-1">Project ID: {projectId}</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition shadow-md">
          + New Task
        </button>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: To-Do */}
        <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-xl flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-200 text-lg">To-Do</h2>
            <span className="bg-slate-700 text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
              {tasks.filter(t => t.status === "To-Do").length}
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {tasks.filter(t => t.status === "To-Do").map(task => (
              <div key={task.id} className="bg-slate-800 border border-slate-700/60 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-white text-sm">{task.title}</h3>
                  <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-medium">{task.priority}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">{task.description}</p>
                <div className="flex justify-end space-x-1.5">
                  <button className="text-[11px] bg-slate-700 hover:bg-indigo-600 px-2 py-1 rounded text-slate-300 transition">Move &rarr;</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-xl flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-200 text-lg">In Progress</h2>
            <span className="bg-slate-700 text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
              {tasks.filter(t => t.status === "In Progress").length}
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {tasks.filter(t => t.status === "In Progress").map(task => (
              <div key={task.id} className="bg-slate-800 border border-slate-700/60 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-white text-sm">{task.title}</h3>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-medium">{task.priority}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">{task.description}</p>
                <div className="flex justify-end space-x-1.5">
                  <button className="text-[11px] bg-slate-700 hover:bg-indigo-600 px-2 py-1 rounded text-slate-300 transition">Move &rarr;</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Done */}
        <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-xl flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-200 text-lg">Done</h2>
            <span className="bg-slate-700 text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
              {tasks.filter(t => t.status === "Done").length}
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {tasks.filter(t => t.status === "Done").map(task => (
              <div key={task.id} className="bg-slate-800 border border-slate-700/60 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-white text-sm">{task.title}</h3>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-medium">{task.priority}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">{task.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}