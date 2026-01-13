import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import MachineEntry from './MachineEntry'

function EditWorkoutForm({ workout, onSave, onCancel }) {
  const [date, setDate] = useState(workout.date)
  const [machines, setMachines] = useState(workout.machines || [])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAddMachine = () => {
    setMachines([...machines, { name: '', settings: '', weight: '', sets: '', reps: '' }])
  }

  const handleRemoveMachine = (index) => {
    if (machines.length > 1) {
      setMachines(machines.filter((_, i) => i !== index))
    } else {
      alert('At least one machine entry is required')
    }
  }

  const handleUpdateMachine = (index, updatedMachine) => {
    const newMachines = [...machines]
    newMachines[index] = updatedMachine
    setMachines(newMachines)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Validate machines
      const validMachines = machines.filter(m => 
        m.name && m.weight != null && m.weight !== '' && 
        m.sets != null && m.sets !== '' && 
        m.reps != null && m.reps !== ''
      )

      if (validMachines.length === 0) {
        throw new Error('Please fill in at least one machine completely')
      }

      // Process machines data
      const processedMachines = validMachines.map(m => ({
        name: m.name,
        settings: m.settings || '',
        weight: parseFloat(m.weight),
        sets: parseInt(m.sets),
        reps: parseInt(m.reps)
      }))

      // Calculate total weight lifted
      const totalWeight = processedMachines.reduce((sum, m) => 
        sum + (m.weight * m.sets * m.reps), 0
      )

      // Update in Firestore
      const workoutRef = doc(db, 'workouts', workout.id)
      await updateDoc(workoutRef, {
        date: date,
        machines: processedMachines,
        totalWeight: totalWeight
      })

      setMessage('✅ Workout updated successfully!')
      
      setTimeout(() => {
        onSave()
      }, 500)
    } catch (error) {
      console.error('Error updating workout:', error)
      setMessage('❌ Error: ' + error.message)
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/5 rounded-lg p-4 mt-2 border-2 border-purple-500/50">
      <h3 className="text-xl font-semibold text-white mb-4">✏️ Edit Workout</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-white text-sm font-semibold mb-2">
            Workout Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full md:w-64 px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        <div className="mb-4">
          <h4 className="text-lg font-semibold text-white mb-3">Machines</h4>
          {machines.map((machine, index) => (
            <MachineEntry
              key={index}
              machine={machine}
              index={index}
              onUpdate={handleUpdateMachine}
              onRemove={handleRemoveMachine}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <button
            type="button"
            onClick={handleAddMachine}
            className="px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 hover:bg-white/30 transition-all font-semibold text-sm"
          >
            ➕ Add Machine
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-white/20 text-white border border-white/30 hover:bg-white/30 disabled:bg-gray-500 transition-all font-semibold"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-500 transition-all font-semibold shadow-lg"
          >
            {loading ? '⏳ Saving...' : '💾 Save Changes'}
          </button>
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.includes('Error') 
              ? 'bg-red-500/20 border border-red-500/50 text-red-100' 
              : 'bg-green-500/20 border border-green-500/50 text-green-100'
          }`}>
            {message}
          </div>
        )}
      </form>
    </div>
  )
}

export default EditWorkoutForm
