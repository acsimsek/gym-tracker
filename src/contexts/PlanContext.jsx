import { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const PlanContext = createContext({});

export const usePlans = () => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlans must be used within a PlanProvider');
  }
  return context;
};

export const PlanProvider = ({ children }) => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load plans from Firestore
  useEffect(() => {
    if (user) {
      loadPlans();
    } else {
      setPlans([]);
      setSelectedPlan(null);
      setLoading(false);
    }
  }, [user]);

  // Load selected plan from localStorage
  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      const savedPlanId = localStorage.getItem('selectedPlanId');
      if (savedPlanId) {
        const plan = plans.find(p => p.id === savedPlanId);
        if (plan) {
          setSelectedPlan(plan);
        } else {
          // If saved plan doesn't exist, select first plan
          setSelectedPlan(plans[0]);
          localStorage.setItem('selectedPlanId', plans[0].id);
        }
      } else if (plans.length > 0) {
        // Auto-select first plan if none selected
        setSelectedPlan(plans[0]);
        localStorage.setItem('selectedPlanId', plans[0].id);
      }
    }
  }, [plans, selectedPlan]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'plans'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const plansData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlans(plansData);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (name, description = '') => {
    try {
      const newPlan = {
        name,
        description,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'plans'), newPlan);
      
      // Reload plans to get correct server timestamps
      await loadPlans();
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating plan:', error);
      throw error;
    }
  };

  const updatePlan = async (planId, updates) => {
    try {
      const planRef = doc(db, 'plans', planId);
      await updateDoc(planRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      // Refetch plans to get the correct timestamps from Firestore
      await loadPlans();
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  };

  const deletePlan = async (planId) => {
    try {
      await deleteDoc(doc(db, 'plans', planId));
      
      // If deleted plan was selected, clear selection before reload
      if (selectedPlan?.id === planId) {
        setSelectedPlan(null);
        localStorage.removeItem('selectedPlanId');
      }
      
      // Reload plans to maintain consistency
      await loadPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      throw error;
    }
  };

  const selectPlan = (plan) => {
    setSelectedPlan(plan);
    if (plan) {
      localStorage.setItem('selectedPlanId', plan.id);
    } else {
      localStorage.removeItem('selectedPlanId');
    }
  };

  const value = {
    plans,
    selectedPlan,
    loading,
    createPlan,
    updatePlan,
    deletePlan,
    selectPlan,
    refreshPlans: loadPlans
  };

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
};
