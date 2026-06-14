import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

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

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "Low" });


  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${projectId}/tasks`);
      setTasks(response.data.tasks || []);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load project tasks. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleMoveTask = async (taskId: string, currentStatus: string, direction: "forward" | "backward") => {
    let nextStatus = currentStatus;

    if (direction === "forward") {
      if (currentStatus === "To-Do") nextStatus = "In Progress";
      else if (currentStatus === "In Progress") nextStatus = "Done";
    } else if (direction === "backward") {
      if (currentStatus === "Done") nextStatus = "In Progress";
      else if (currentStatus === "In Progress") nextStatus = "To-Do";
    }

    // If we are at the edges (can't move back from To-Do or forward from Done), stop execution
    if (nextStatus === currentStatus) return;

    try {
      // Fire PUT update to backend task status route
      await api.put(`/tasks/${taskId}`, {
        task_status: nextStatus
      });

      // Optimistically update the UI state arrays
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, status: nextStatus } : task
        )
      );
    } catch (err) {
      console.error("Failed to update task status:", err);
      alert("Could not change task status. Please try again.");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try{
      setIsSubmitting(true);
      const response = await api.post(`/projects/${projectId}/tasks`, {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        status: "To-Do",
        project_id: parseInt(projectId || "0", 10)
      });
      
      setTasks(prevTasks => [...prevTasks, response.data.task || response.data]);

      setIsModalOpen(false);
      setNewTask({ title: "", description: "", priority: "Low" });
    } catch (err) {
      console.error("Failed to create task:", err);
      alert("Could not create the task. Please try again");
    } finally{
      setIsSubmitting(false);
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
    <div className="min-h-screen bg-[#F5F5F7] text-gray-900 p-6 font-sans">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-8 border-b border-gray-200 pb-6">
        <div>
          <button 
            onClick={() => navigate("/dashboard")} 
            className="text-sm font-medium text-blue-600 hover:text-blue-800 mb-2 flex items-center transition cursor-pointer"
          >
            &larr; Back to Dashboard
          </button>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Project Workspace</h1>
          <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-200/50 inline-block px-2 py-0.5 rounded">ID: {projectId}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-full text-sm transition shadow-sm cursor-pointer"
        >
          + New Task
        </button>
      </div>

      {/* Kanban Columns Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: To-Do */}
        <div className="bg-gray-100/70 border border-gray-200 p-5 rounded-2xl flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-800 text-lg">To-Do</h2>
            <span className="bg-white text-gray-600 shadow-sm text-xs px-3 py-1 rounded-full font-semibold">
              {tasks.filter(t => t.status === "To-Do").length}
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {tasks.filter(t => t.status === "To-Do").map(task => (
              <div key={task.id} className="bg-white border border-gray-200/60 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug">{task.title}</h3>
                  <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">{task.priority}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">{task.description}</p>
                <div className="flex justify-end border-t border-gray-50 pt-3">
                    <button 
                        onClick={() => handleMoveTask(task.id, task.status, "forward")}
                        className="text-xs font-medium text-gray-500 hover:text-blue-600 transition cursor-pointer"
                    >
                        Start Task &rarr;
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="bg-blue-50/50 border border-blue-100/50 p-5 rounded-2xl flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-blue-900 text-lg">In Progress</h2>
            <span className="bg-white text-blue-600 shadow-sm text-xs px-3 py-1 rounded-full font-semibold">
              {tasks.filter(t => t.status === "In Progress").length}
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {tasks.filter(t => t.status === "In Progress").map(task => (
              <div key={task.id} className="bg-white border border-blue-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug">{task.title}</h3>
                  <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">{task.priority}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">{task.description}</p>
                <div className="flex justify-between items-center border-t border-gray-50 pt-3">
                    <button 
                        onClick={() => handleMoveTask(task.id, task.status, "backward")}
                        className="text-xs font-medium text-gray-400 hover:text-gray-700 transition cursor-pointer"
                    >
                        &larr; Revert
                    </button>
                    <button 
                        onClick={() => handleMoveTask(task.id, task.status, "forward")}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg"
                    >
                        Complete &rarr;
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Done */}
        <div className="bg-gray-100/70 border border-gray-200 p-5 rounded-2xl flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-800 text-lg">Done</h2>
            <span className="bg-white text-emerald-600 shadow-sm text-xs px-3 py-1 rounded-full font-semibold">
              {tasks.filter(t => t.status === "Done").length}
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {tasks.filter(t => t.status === "Done").map(task => (
              <div key={task.id} className="bg-white border border-gray-200/60 p-4 rounded-xl shadow-sm opacity-75 hover:opacity-100 transition-opacity">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-600 line-through text-sm leading-snug">{task.title}</h3>
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">{task.priority}</span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">{task.description}</p>

                <div className="flex justify-start border-t border-gray-50 pt-3">
                    <button 
                        onClick={() => handleMoveTask(task.id, task.status, "backward")}
                        className="text-[11px] font-medium text-gray-400 hover:text-amber-600 transition cursor-pointer"
                    >
                        &larr; Reopen
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Task Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Create New Task</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-700 transition text-2xl leading-none cursor-pointer p-1 rounded-full hover:bg-gray-200/50"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTask} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Task Title</label>
                <input 
                  required 
                  type="text" 
                  value={newTask.title} 
                  onChange={e => setNewTask({...newTask, title: e.target.value})} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" 
                  placeholder="e.g. Configure database constraints" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-gray-400 font-normal">(Optional)</span></label>
                <textarea 
                  value={newTask.description} 
                  onChange={e => setNewTask({...newTask, description: e.target.value})} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none h-24 resize-none" 
                  placeholder="Brief details about the task..." 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                <select 
                  value={newTask.priority} 
                  onChange={e => setNewTask({...newTask, priority: e.target.value})} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none cursor-pointer appearance-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
            
          </div>
        </div>
      )}
    </div>
  );
}
  