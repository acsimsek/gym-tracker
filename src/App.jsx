import { useState } from 'react'
import WorkoutForm from './components/WorkoutForm'
import WorkoutHistory from './components/WorkoutHistory'
import ProgressChart from './components/ProgressChart'

function App() {
  const [activeTab, setActiveTab] = useState('add')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleWorkoutAdded = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleWorkoutDeleted = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-8">
          💪 Gym Tracker
        </h1>

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
