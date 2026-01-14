import { useState } from 'react';
import { usePlan } from '../contexts/PlanContext';

function PlanManager({ onClose }) {
  const { plans, createPlan, updatePlan, deletePlan } = usePlan();
  const [newPlanName, setNewPlanName] = useState('');
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editingPlanName, setEditingPlanName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!newPlanName.trim()) {
      setMessage('⚠️ Please enter a plan name');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await createPlan(newPlanName.trim());
      setNewPlanName('');
      setMessage('✅ Plan created successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error creating plan:', error);
      setMessage('❌ Error creating plan');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (plan) => {
    setEditingPlanId(plan.id);
    setEditingPlanName(plan.name);
  };

  const handleSaveEdit = async (planId) => {
    if (!editingPlanName.trim()) {
      setMessage('⚠️ Please enter a plan name');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await updatePlan(planId, { name: editingPlanName.trim() });
      setEditingPlanId(null);
      setEditingPlanName('');
      setMessage('✅ Plan updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating plan:', error);
      setMessage('❌ Error updating plan');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
    setEditingPlanName('');
  };

  const handleDeletePlan = async (planId) => {
    setLoading(true);
    setMessage('');

    try {
      const result = await deletePlan(planId);
      if (result !== false) {
        setMessage('✅ Plan deleted successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      setMessage('❌ Error deleting plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card-glass rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 glass-effect rounded-t-xl px-6 py-4 flex justify-between items-center border-b border-white/20">
          <h2 className="text-2xl font-bold text-white">⚙️ Manage Plans</h2>
          <button
            onClick={onClose}
            className="text-white text-2xl hover:text-white/70 transition-all"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Create New Plan */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">➕ Create New Plan</h3>
            <form onSubmit={handleCreatePlan} className="flex gap-2">
              <input
                type="text"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                placeholder="Plan name..."
                className="flex-1 px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/50"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-500 transition-all font-semibold"
              >
                {loading ? '⏳' : 'Create'}
              </button>
            </form>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.includes('Error') || message.includes('⚠️')
                ? 'bg-red-500/20 border border-red-500/50 text-red-100'
                : 'bg-green-500/20 border border-green-500/50 text-green-100'
            }`}>
              {message}
            </div>
          )}

          {/* Your Plans */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">📋 Your Plans</h3>
            {plans.length === 0 ? (
              <div className="text-center py-8 text-white/70">
                No plans yet. Create your first plan to get started!
              </div>
            ) : (
              <div className="space-y-2">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="glass-effect rounded-lg p-4 flex items-center justify-between"
                  >
                    {editingPlanId === plan.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editingPlanName}
                          onChange={(e) => setEditingPlanName(e.target.value)}
                          className="flex-1 px-3 py-1 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(plan.id)}
                          disabled={loading}
                          className="px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-500 transition-all text-sm"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={loading}
                          className="px-3 py-1 rounded bg-gray-500 text-white hover:bg-gray-600 disabled:bg-gray-500 transition-all text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <div className="text-white font-semibold">{plan.name}</div>
                          {plan.description && (
                            <div className="text-white/70 text-sm">{plan.description}</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStartEdit(plan)}
                            disabled={loading}
                            className="text-blue-300 hover:text-blue-100 px-3 py-1 rounded transition-all"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            disabled={loading}
                            className="text-red-300 hover:text-red-100 px-3 py-1 rounded transition-all"
                          >
                            🗑️
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlanManager;
