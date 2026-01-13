import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { format } from 'date-fns'
import MachineEntry from './MachineEntry'

function WorkoutForm({ onWorkoutAdded }) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [machines, setMachines] = useState([
    { name: '', settings: '', weight: '', sets: '', reps: '' }
  ])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAddMachine = () => {
    setMachines([...machines, { name: '', settings: '', weight: '', sets: '', reps: '' }])
  }

  const handleRemoveMachine = (index) => {
    if (machines.length > 1) {
      setMachines(machines.filter((_, i) => i !== index))
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
        m.name && m.weight && m.sets && m.reps
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

      // Add to Firestore
      await addDoc(collection(db, 'workouts'), {
        date: date,
        machines: processedMachines,
        totalWeight: totalWeight,
        createdAt: serverTimestamp()
      })

      setMessage('✅ Workout added successfully!')
      
      // Reset form
      setMachines([{ name: '', settings: '', weight: '', sets: '', reps: '' }])
      setDate(format(new Date(), 'yyyy-MM-dd'))
      
      if (onWorkoutAdded) {
        onWorkoutAdded()
      }

      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error adding workout:', error)
      setMessage('❌ Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Add New Workout</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-white text-sm font-semibold mb-2">
            Workout Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full md:w-64 px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            required
          />
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">Machines</h3>
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

        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={handleAddMachine}
            className="px-6 py-3 rounded-lg bg-white/20 text-white border border-white/30 hover:bg-white/30 transition-all font-semibold"
          >
            ➕ Add Another Machine
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-500 transition-all font-semibold shadow-lg"
          >
            {loading ? '⏳ Saving...' : '💾 Save Workout'}
          </button>
        </div>

        {message && (
          <div className={`mt-4 p-4 rounded-lg ${
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

export default WorkoutForm
