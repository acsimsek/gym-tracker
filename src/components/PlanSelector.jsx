import { useState, useRef, useEffect } from 'react';
import { usePlan } from '../contexts/PlanContext';

function PlanSelector({ onManagePlans }) {
  const { plans, selectedPlan, selectPlan } = usePlan();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectPlan = (plan) => {
    selectPlan(plan);
    setIsOpen(false);
  };

  if (!selectedPlan) {
    return (
      <button
        onClick={onManagePlans}
        className="glass-effect text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all font-semibold text-sm"
      >
        ➕ Create Plan
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-effect text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all font-semibold text-sm flex items-center gap-2"
      >
        📋 Plan: {selectedPlan.name}
        <span className="text-xs">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 glass-effect rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="py-2">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => handleSelectPlan(plan)}
                className={`w-full text-left px-4 py-2 text-white hover:bg-white/20 transition-all ${
                  selectedPlan.id === plan.id ? 'bg-white/10 font-semibold' : ''
                }`}
              >
                {plan.name}
                {selectedPlan.id === plan.id && ' ✓'}
              </button>
            ))}
          </div>
          
          <div className="border-t border-white/20">
            <button
              onClick={() => {
                setIsOpen(false);
                onManagePlans();
              }}
              className="w-full text-left px-4 py-2 text-white hover:bg-white/20 transition-all font-semibold"
            >
              ⚙️ Manage Plans
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanSelector;
