import { useState, useEffect } from 'react'
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { format, parseISO } from 'date-fns'

function WorkoutHistory({ refreshTrigger, onWorkoutDeleted }) {
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedWorkout, setExpandedWorkout] = useState(null)

  useEffect(() => {
    fetchWorkouts()
  }, [refreshTrigger])

  const fetchWorkouts = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'workouts'), orderBy('date', 'desc'))
      const querySnapshot = await getDocs(q)
      const workoutData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setWorkouts(workoutData)
    } catch (error) {
      console.error('Error fetching workouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (workoutId) => {
    if (window.confirm('Are you sure you want to delete this workout?')) {
      try {
        await deleteDoc(doc(db, 'workouts', workoutId))
        setWorkouts(workouts.filter(w => w.id !== workoutId))
        if (onWorkoutDeleted) {
          onWorkoutDeleted()
        }
      } catch (error) {
        console.error('Error deleting workout:', error)
        alert('Failed to delete workout')
      }
    }
  }

  const toggleExpand = (workoutId) => {
    setExpandedWorkout(expandedWorkout === workoutId ? null : workoutId)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-white text-xl">⏳ Loading workouts...</div>
      </div>
    )
  }

  if (workouts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-white text-xl mb-4">📭 No workouts yet</div>
        <div className="text-white/70">Add your first workout to get started!</div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Workout History</h2>
      
      <div className="space-y-4">
        {workouts.map((workout) => {
          const isExpanded = expandedWorkout === workout.id
          let workoutDate
          try {
            workoutDate = workout.date ? format(parseISO(workout.date), 'MMMM dd, yyyy') : 'Unknown date'
          } catch {
            workoutDate = workout.date || 'Unknown date'
          }

          return (
            <div key={workout.id} className="glass-effect rounded-lg overflow-hidden">
              {/* Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-white/10 transition-all"
                onClick={() => toggleExpand(workout.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-white font-semibold text-lg mb-1">
                      📅 {workoutDate}
                    </div>
                    <div className="text-white/80 text-sm">
                      {workout.machines?.length || 0} machine{workout.machines?.length !== 1 ? 's' : ''} • 
                      {' '}{workout.totalWeight?.toFixed(1) || 0} kg total
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(workout.id)
                      }}
                      className="text-red-300 hover:text-red-100 px-3 py-1 rounded"
                    >
                      🗑️
                    </button>
                    <div className="text-white text-xl">
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/20">
                  <div className="mt-4 space-y-3">
                    {workout.machines?.map((machine, index) => (
                      <div key={index} className="bg-white/10 rounded-lg p-3">
                        <div className="text-white font-semibold mb-2">
                          🏋️ {machine.name}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          {machine.settings && (
                            <div className="text-white/80">
                              ⚙️ {machine.settings}
                            </div>
                          )}
                          <div className="text-white/80">
                            ⚖️ {machine.weight} kg
                          </div>
                          <div className="text-white/80">
                            📊 {machine.sets} sets
                          </div>
                          <div className="text-white/80">
                            🔢 {machine.reps} reps
                          </div>
                        </div>
                        <div className="text-white/60 text-xs mt-2">
                          Total: {(machine.weight * machine.sets * machine.reps).toFixed(1)} kg
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default WorkoutHistory
