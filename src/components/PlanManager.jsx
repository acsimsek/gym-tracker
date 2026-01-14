import { useState, useEffect } from 'react';
import { usePlans } from '../contexts/PlanContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

function PlanManager({ isOpen, onClose }) {
  const { plans, createPlan, updatePlan, deletePlan } = usePlans();
  const { user } = useAuth();
  const [newPlanName, setNewPlanName] = useState('');
  const [editingPlan, setEditingPlan] = useState(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setNewPlanName('');
      setEditingPlan(null);
      setEditName('');
      setMessage('');
    }
  }, [isOpen]);

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;

    setLoading(true);
    setMessage('');
    try {
      await createPlan(newPlanName.trim());
      setNewPlanName('');
      setMessage('✅ Plan created successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Error creating plan');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (plan) => {
    setEditingPlan(plan.id);
    setEditName(plan.name);
  };

  const handleSaveEdit = async (planId) => {
    if (!editName.trim()) return;

    setLoading(true);
    try {
      await updatePlan(planId, { name: editName.trim() });
      setEditingPlan(null);
      setEditName('');
      setMessage('✅ Plan updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Error updating plan');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingPlan(null);
    setEditName('');
  };

  const handleDeletePlan = async (planId, planName) => {
    // Check if plan has workouts
    try {
      const q = query(
        collection(db, 'workouts'),
        where('planId', '==', planId),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const workoutCount = querySnapshot.size;

      let confirmMessage = `Are you sure you want to delete "${planName}"?`;
      if (workoutCount > 0) {
        confirmMessage += `\n\n⚠️ Warning: This plan contains ${workoutCount} workout${workoutCount !== 1 ? 's' : ''}. Deleting this plan will NOT delete the workouts, but they will become unlinked.`;
      }

      if (window.confirm(confirmMessage)) {
        setLoading(true);
        await deletePlan(planId);
        setMessage('✅ Plan deleted successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('❌ Error deleting plan');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card-glass rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">⚙️ Manage Plans</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-white/70 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Create New Plan */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">➕ Create New Plan</h3>
          <form onSubmit={handleCreatePlan} className="flex gap-3">
            <input
              type="text"
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              placeholder="Plan name (e.g., Strength Training)"
              className="flex-1 px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/50"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newPlanName.trim()}
              className="px-6 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-500 transition-all font-semibold"
            >
              Create
            </button>
          </form>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.includes('Error') 
              ? 'bg-red-500/20 border border-red-500/50 text-red-100' 
              : 'bg-green-500/20 border border-green-500/50 text-green-100'
          }`}>
            {message}
          </div>
        )}

        {/* Plans List */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">📋 Your Plans</h3>
          {plans.length === 0 ? (
            <div className="text-center py-8 text-white/70">
              No plans yet. Create your first plan above!
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => (
                <div key={plan.id} className="glass-effect rounded-lg p-4">
                  {editingPlan === plan.id ? (
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(plan.id)}
                        disabled={loading || !editName.trim()}
                        className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-500 transition-all"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div className="text-white font-semibold">{plan.name}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartEdit(plan)}
                          className="text-blue-300 hover:text-blue-100 px-3 py-1 rounded transition-all"
                          disabled={loading}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id, plan.name)}
                          className="text-red-300 hover:text-red-100 px-3 py-1 rounded transition-all"
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlanManager;
