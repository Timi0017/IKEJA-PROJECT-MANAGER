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
  // --- Team Members State ---
  const [members, setMembers] = useState<{id: number, username: string, role: string}[]>([]);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState<boolean>(false);
  const [inviteUsername, setInviteUsername] = useState<string>("");
  const [inviteRole, setInviteRole] = useState<string>("Viewer");
  const [inviteMessage, setInviteMessage] = useState<{type: "success"|"error", text: string} | null>(null);
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

  const fetchMembers = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/members`);
      setMembers(response.data.members || []);
    } catch (err) {
      console.error("Failed to load members", err);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteMessage(null);
    try {
      // Notice we are passing query parameters via the URL here because your backend doesn't use a Pydantic BaseModel for this route yet!
      await api.post(`/projects/${projectId}/members?invitee_username=${inviteUsername}&role=${inviteRole}`);
      setInviteMessage({ type: "success", text: `${inviteUsername} invited successfully!` });
      setInviteUsername("");
      fetchMembers(); // Refresh the list instantly
    } catch (err: any) {
      setInviteMessage({ type: "error", text: err.response?.data?.detail || "Failed to invite user." });
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
      const response = await api.post(`/tasks`, {
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

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      // Fire DELETE request to your backend task endpoint
      await api.delete(`/tasks/${taskId}`);
      
      // Optimistically remove it from the UI
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (err: any) {
      // Check if the backend specifically blocked them for being a Viewer
      if (err.response && err.response.status === 403) {
        alert("Viewers are not allowed to delete tasks. Please contact an Admin.");
      } else {
        console.error("Failed to delete task:", err);
        alert("Could not delete task. Please try again.");
      }
    }
  };

  // Trigger the fetch automatically when the component mounts or projectId shifts
  useEffect(() => {
    if (projectId) {
      fetchTasks();
      fetchMembers();
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
    <>
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

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsTeamModalOpen(true)}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium px-5 py-2.5 rounded-full text-sm transition shadow-sm cursor-pointer flex items-center space-x-2"
          >
            <span>👥 Team ({members.length})</span>
          </button>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-full text-sm transition shadow-sm cursor-pointer"
        >
          + New Task
        </button>
        </div>
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
                
                {/* --- REPLACED HEADER SECTION --- */}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug pr-2">{task.title}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">{task.priority}</span>
                    
                    {/* The Delete Bin Icon */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Delete Task"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {/* --- END REPLACED HEADER SECTION --- */}

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
                
                {/* ---  HEADER SECTION --- */}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug pr-2">{task.title}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">{task.priority}</span>
                    
                    {/* The Delete Bin Icon */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Delete Task"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                  </div>
                </div>
                {/* --- END HEADER SECTION --- */}

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
              // Added "group" to the className here so the hover works!
              <div key={task.id} className="bg-white border border-gray-200/60 p-4 rounded-xl shadow-sm opacity-75 hover:opacity-100 transition-opacity group">
                
                {/* --- REPLACED HEADER SECTION --- */}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-600 line-through text-sm leading-snug pr-2">{task.title}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">{task.priority}</span>
                    
                    {/* The Delete Bin Icon */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Delete Task"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {/* --- END REPLACED HEADER SECTION --- */}

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

{/* Team Management Modal */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Manage Team</h3>
              <button 
                onClick={() => { setIsTeamModalOpen(false); setInviteMessage(null); }} 
                className="text-gray-400 hover:text-gray-700 transition text-2xl leading-none cursor-pointer p-1 rounded-full hover:bg-gray-200/50"
              >
                &times;
              </button>
            </div>

            <div className="p-6">
              {/* Invite Section */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Invite User</h4>
                <form onSubmit={handleInviteUser} className="flex space-x-2">
                  <input 
                    type="text" 
                    value={inviteUsername} 
                    onChange={e => setInviteUsername(e.target.value)} 
                    placeholder="Username" 
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    required
                  />
                  <select 
                    value={inviteRole} 
                    onChange={e => setInviteRole(e.target.value)}
                    className="px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-sm cursor-pointer"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Member">Member</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">
                    Add
                  </button>
                </form>
                {inviteMessage && (
                  <p className={`mt-2 text-xs font-medium ${inviteMessage.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {inviteMessage.text}
                  </p>
                )}
              </div>

              {/* Member List Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Current Team</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {members.map(member => (
                    <div key={member.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                          {member.username.substring(0, 2)}
                        </div>
                        <span className="font-medium text-gray-800 text-sm">{member.username}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${
                        member.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 
                        member.role === 'Member' ? 'bg-blue-100 text-blue-700' : 
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
  