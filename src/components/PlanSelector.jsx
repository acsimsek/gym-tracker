import { useState, useRef, useEffect } from 'react';
import { usePlans } from '../contexts/PlanContext';

function PlanSelector({ onManagePlans }) {
  const { plans, selectedPlan, selectPlan } = usePlans();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPlan = (plan) => {
    selectPlan(plan);
    setIsOpen(false);
  };

  if (plans.length === 0) {
    return (
      <div className="glass-effect px-4 py-2 rounded-lg">
        <button
          onClick={onManagePlans}
          className="text-white hover:text-white/80 transition-all text-sm font-semibold"
        >
          📋 Create a Plan
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-effect px-4 py-2 rounded-lg text-white hover:bg-white/20 transition-all font-semibold text-sm flex items-center gap-2"
      >
        📋 {selectedPlan?.name || 'Select Plan'} ▼
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 glass-effect rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="py-1">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => handleSelectPlan(plan)}
                className={`w-full px-4 py-2 text-left text-white hover:bg-white/20 transition-all ${
                  selectedPlan?.id === plan.id ? 'bg-white/10' : ''
                }`}
              >
                {plan.name}
                {selectedPlan?.id === plan.id && ' ✓'}
              </button>
            ))}
          </div>
          <div className="border-t border-white/20">
            <button
              onClick={() => {
                setIsOpen(false);
                onManagePlans();
              }}
              className="w-full px-4 py-2 text-left text-white hover:bg-white/20 transition-all text-sm"
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
