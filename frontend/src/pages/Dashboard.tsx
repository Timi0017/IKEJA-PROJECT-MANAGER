import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();

    const handleLogout = () => {
        // 1. Destroy the JWT token from the vault
        localStorage.removeItem('token');
        
        // 2. Kick the user back to the login screen
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">My Workspaces</h1>
                    <button 
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow"
                    >
                        Logout
                    </button>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <p className="text-gray-600">
                        Authentication successful! You have securely bypassed the Bouncer. 
                        In Bit 2, we will fetch your database projects and display them here.
                    </p>
                </div>
            </div>
        </div>
    );
}