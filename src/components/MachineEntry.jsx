import React from 'react'

function MachineEntry({ machine, index, onUpdate, onRemove }) {
  const handleChange = (field, value) => {
    onUpdate(index, { ...machine, [field]: value })
  }

  return (
    <div className="glass-effect rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-white font-semibold">Machine {index + 1}</h4>
        <button
          onClick={() => onRemove(index)}
          className="text-red-300 hover:text-red-100 font-bold"
          type="button"
        >
          ✕
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-white text-sm mb-2">Machine Name</label>
          <input
            type="text"
            value={machine.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Bench Press"
            className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            required
          />
        </div>
        
        <div>
          <label className="block text-white text-sm mb-2">Settings</label>
          <input
            type="text"
            value={machine.settings}
            onChange={(e) => handleChange('settings', e.target.value)}
            placeholder="e.g., Seat 5, Angle 45°"
            className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
        
        <div>
          <label className="block text-white text-sm mb-2">Weight (kg)</label>
          <input
            type="number"
            value={machine.weight}
            onChange={(e) => handleChange('weight', e.target.value)}
            placeholder="0"
            min="0"
            step="0.5"
            className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            required
          />
        </div>
        
        <div>
          <label className="block text-white text-sm mb-2">Sets</label>
          <input
            type="number"
            value={machine.sets}
            onChange={(e) => handleChange('sets', e.target.value)}
            placeholder="0"
            min="1"
            className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            required
          />
        </div>
        
        <div>
          <label className="block text-white text-sm mb-2">Reps</label>
          <input
            type="number"
            value={machine.reps}
            onChange={(e) => handleChange('reps', e.target.value)}
            placeholder="0"
            min="1"
            className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            required
          />
        </div>
      </div>
    </div>
  )
}

export default MachineEntry
