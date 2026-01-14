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
      const createdPlan = { id: docRef.id, ...newPlan, createdAt: new Date(), updatedAt: new Date() };
      setPlans([...plans, createdPlan]);
      
      // Auto-select the first plan created
      if (plans.length === 0) {
        setSelectedPlan(createdPlan);
        localStorage.setItem('selectedPlanId', createdPlan.id);
      }
      
      return createdPlan;
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
      
      setPlans(plans.map(p => 
        p.id === planId ? { ...p, ...updates, updatedAt: new Date() } : p
      ));
      
      if (selectedPlan?.id === planId) {
        setSelectedPlan({ ...selectedPlan, ...updates, updatedAt: new Date() });
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  };

  const deletePlan = async (planId) => {
    try {
      await deleteDoc(doc(db, 'plans', planId));
      const newPlans = plans.filter(p => p.id !== planId);
      setPlans(newPlans);
      
      // If deleted plan was selected, select another plan
      if (selectedPlan?.id === planId) {
        if (newPlans.length > 0) {
          setSelectedPlan(newPlans[0]);
          localStorage.setItem('selectedPlanId', newPlans[0].id);
        } else {
          setSelectedPlan(null);
          localStorage.removeItem('selectedPlanId');
        }
      }
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
