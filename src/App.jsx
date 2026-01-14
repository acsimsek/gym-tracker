import { useState } from 'react'
import WorkoutForm from './components/WorkoutForm'
import WorkoutHistory from './components/WorkoutHistory'
import ProgressChart from './components/ProgressChart'
import Login from './components/Login'
import { useAuth } from './contexts/AuthContext'

function App() {
  const [activeTab, setActiveTab] = useState('add')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { user, logout } = useAuth()

  const handleWorkoutAdded = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleWorkoutDeleted = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  // Show login if user is not authenticated
  if (!user) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center md:text-left mb-4 md:mb-0">
            💪 Gym Tracker
          </h1>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="text-white/80 text-sm">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="glass-effect text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all font-semibold text-sm"
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('add')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'add'
                ? 'bg-white text-purple-900 shadow-lg'
                : 'glass-effect text-white hover:bg-white/20'
            }`}
          >
            ➕ Add Workout
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-white text-purple-900 shadow-lg'
                : 'glass-effect text-white hover:bg-white/20'
            }`}
          >
            📋 History
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'progress'
                ? 'bg-white text-purple-900 shadow-lg'
                : 'glass-effect text-white hover:bg-white/20'
            }`}
          >
            📊 Progress
          </button>
        </div>

        {/* Tab Content */}
        <div className="card-glass rounded-xl p-6 md:p-8">
          {activeTab === 'add' && <WorkoutForm onWorkoutAdded={handleWorkoutAdded} />}
          {activeTab === 'history' && (
            <WorkoutHistory 
              refreshTrigger={refreshTrigger} 
              onWorkoutDeleted={handleWorkoutDeleted}
            />
          )}
          {activeTab === 'progress' && <ProgressChart refreshTrigger={refreshTrigger} />}
        </div>
      </div>
    </div>
  )
}

export default App
