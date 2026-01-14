import { useState, useEffect } from 'react'
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore'
import { db } from '../firebase'
import { format, parseISO } from 'date-fns'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { usePlans } from '../contexts/PlanContext'
import { useAuth } from '../contexts/AuthContext'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

function ProgressChart({ refreshTrigger }) {
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalWeight: 0,
    avgWeight: 0,
    machineUses: {}
  })
  const { selectedPlan } = usePlans()
  const { user } = useAuth()

  useEffect(() => {
    if (selectedPlan) {
      fetchWorkouts()
    } else {
      setWorkouts([])
      setLoading(false)
    }
  }, [refreshTrigger, selectedPlan])

  const fetchWorkouts = async () => {
    if (!selectedPlan) return
    
    setLoading(true)
    try {
      const q = query(
        collection(db, 'workouts'),
        where('planId', '==', selectedPlan.id),
        where('userId', '==', user.uid),
        orderBy('date', 'asc')
      )
      const querySnapshot = await getDocs(q)
      const workoutData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setWorkouts(workoutData)
      calculateStats(workoutData)
    } catch (error) {
      console.error('Error fetching workouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (workoutData) => {
    const totalWorkouts = workoutData.length
    const totalWeight = workoutData.reduce((sum, w) => sum + (w.totalWeight || 0), 0)
    const avgWeight = totalWorkouts > 0 ? totalWeight / totalWorkouts : 0

    // Calculate machine usage and average weight per machine
    const machineUses = {}
    workoutData.forEach(workout => {
      workout.machines?.forEach(machine => {
        if (!machineUses[machine.name]) {
          machineUses[machine.name] = { count: 0, totalWeight: 0 }
        }
        machineUses[machine.name].count++
        machineUses[machine.name].totalWeight += machine.weight * machine.sets * machine.reps
      })
    })

    setStats({ totalWorkouts, totalWeight, avgWeight, machineUses })
  }

  // Prepare data for total weight over time chart
  const weightOverTimeData = {
    labels: workouts.map(w => {
      try {
        return w.date ? format(parseISO(w.date), 'MMM dd') : 'Unknown'
      } catch {
        return w.date || 'Unknown'
      }
    }),
    datasets: [
      {
        label: 'Total Weight Lifted (kg)',
        data: workouts.map(w => w.totalWeight || 0),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.3)',
        fill: true,
        tension: 0.4
      }
    ]
  }

  // Prepare data for average weight per day chart
  const avgWeightPerDayData = {
    labels: workouts.map(w => {
      try {
        return w.date ? format(parseISO(w.date), 'MMM dd') : 'Unknown'
      } catch {
        return w.date || 'Unknown'
      }
    }),
    datasets: [
      {
        label: 'Average Weight per Day (kg)',
        data: workouts.map(w => {
          // Calculate average weight across all machines for this workout
          if (!w.machines || w.machines.length === 0) return 0
          const validWeights = w.machines
            .map(m => parseFloat(m.weight))
            .filter(weight => !isNaN(weight) && weight > 0)
          if (validWeights.length === 0) return 0
          const totalWeight = validWeights.reduce((sum, weight) => sum + weight, 0)
          return totalWeight / validWeights.length
        }),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2
      }
    ]
  }

  // Prepare data for most used machines chart
  const machineNames = Object.keys(stats.machineUses)
  const machineCounts = machineNames.map(name => stats.machineUses[name].count)
  const mostUsedMachinesData = {
    labels: machineNames,
    datasets: [
      {
        label: 'Times Used',
        data: machineCounts,
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: 'white',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: { color: 'rgba(255, 255, 255, 0.8)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        ticks: { color: 'rgba(255, 255, 255, 0.8)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  }

  const horizontalChartOptions = {
    ...chartOptions,
    indexAxis: 'y'
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-white text-xl">⏳ Loading progress data...</div>
      </div>
    )
  }

  if (!selectedPlan) {
    return (
      <div className="text-center py-12">
        <div className="text-white text-xl mb-4">📋 Select a Plan</div>
        <div className="text-white/70">Choose a plan from the dropdown above to view its progress</div>
      </div>
    )
  }

  if (workouts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-white text-xl mb-4">📊 No data yet</div>
        <div className="text-white/70">Add some workouts to "{selectedPlan.name}" to see your progress!</div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Progress & Statistics</h2>

      {/* Show selected plan */}
      <div className="mb-6 glass-effect rounded-lg p-4">
        <div className="text-white/70 text-sm">Showing progress for:</div>
        <div className="text-white font-semibold text-lg">📋 {selectedPlan.name}</div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-effect rounded-lg p-4">
          <div className="text-white/70 text-sm mb-1">Total Workouts</div>
          <div className="text-white text-2xl font-bold">{stats.totalWorkouts}</div>
        </div>
        <div className="glass-effect rounded-lg p-4">
          <div className="text-white/70 text-sm mb-1">Total Weight</div>
          <div className="text-white text-2xl font-bold">{stats.totalWeight.toFixed(0)} kg</div>
        </div>
        <div className="glass-effect rounded-lg p-4">
          <div className="text-white/70 text-sm mb-1">Avg / Session</div>
          <div className="text-white text-2xl font-bold">{stats.avgWeight.toFixed(0)} kg</div>
        </div>
        <div className="glass-effect rounded-lg p-4">
          <div className="text-white/70 text-sm mb-1">Machine Uses</div>
          <div className="text-white text-2xl font-bold">{Object.keys(stats.machineUses).length}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-8">
        {/* Total Weight Over Time */}
        <div className="glass-effect rounded-lg p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Total Weight Lifted Over Time</h3>
          <div className="bg-white/5 rounded-lg p-4">
            <Line data={weightOverTimeData} options={chartOptions} />
          </div>
        </div>

        {/* Average Weight Per Day */}
        <div className="glass-effect rounded-lg p-6">
          <h3 className="text-white font-semibold text-lg mb-4">📊 Average Weight per Day</h3>
          <div className="bg-white/5 rounded-lg p-4">
            <Bar data={avgWeightPerDayData} options={chartOptions} />
          </div>
        </div>

        {/* Most Used Machines */}
        {machineNames.length > 0 && (
          <div className="glass-effect rounded-lg p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Most Frequently Used Machines</h3>
            <div className="bg-white/5 rounded-lg p-4">
              <Bar data={mostUsedMachinesData} options={horizontalChartOptions} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProgressChart
