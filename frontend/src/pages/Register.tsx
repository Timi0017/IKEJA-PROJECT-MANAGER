import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Hit your FastAPI POST /register endpoint
            await api.post('/register', {
                username: username,
                password: password
            });
            
            alert("Registration successful! Please log in.");
            navigate('/login');
        } catch (error:any) {
            console.error("Reg error:", error.response?.data);
            alert("Registration failed. Username might already exist.");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7] font-sans p-4">
            <div className="w-full max-w-md bg-white p-10 rounded-[2rem] shadow-xl border border-gray-100 transition-all">
                
                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">Create Account</h2>
                    <p className="text-sm text-gray-500">Join your team's workspace today.</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <input 
                            type="text" 
                            placeholder="Username" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder-gray-400"
                            required
                        />
                    </div>
                    <div>
                        <input 
                            type="password" 
                            placeholder="Password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder-gray-400"
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-blue-600 text-white font-medium text-lg py-3.5 rounded-xl hover:bg-blue-700 shadow-sm hover:shadow-md transition-all cursor-pointer mt-2"
                    >
                        Register
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
                        Already have an account? <span className="text-blue-600">Log in</span>
                    </Link>
                </div>

            </div>
        </div>
    );
}