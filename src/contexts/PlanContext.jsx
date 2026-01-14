import { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  getDocs,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const PlanContext = createContext({});

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
};

export const PlanProvider = ({ children }) => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch plans from Firestore
  useEffect(() => {
    if (user) {
      fetchPlans();
    }
  }, [user]);

  // Helper function to select first plan
  const selectFirstPlan = (plansList) => {
    if (plansList.length > 0) {
      setSelectedPlan(plansList[0]);
      localStorage.setItem('selectedPlanId', plansList[0].id);
    }
  };

  // Load selected plan from localStorage
  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      const savedPlanId = localStorage.getItem('selectedPlanId');
      if (savedPlanId) {
        const plan = plans.find(p => p.id === savedPlanId);
        if (plan) {
          setSelectedPlan(plan);
        } else {
          // If saved plan doesn't exist, select the first one
          selectFirstPlan(plans);
        }
      } else {
        // No saved plan, select the first one
        selectFirstPlan(plans);
      }
    }
  }, [plans, selectedPlan]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'plans'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const planData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlans(planData);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (name, description = '') => {
    try {
      const docRef = await addDoc(collection(db, 'plans'), {
        name,
        description,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      const newPlan = {
        id: docRef.id,
        name,
        description,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setPlans([newPlan, ...plans]);
      
      // Auto-select first plan if none selected
      if (!selectedPlan) {
        setSelectedPlan(newPlan);
        localStorage.setItem('selectedPlanId', newPlan.id);
      }
      
      return newPlan;
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
      
      // Update selectedPlan if it's the one being updated
      if (selectedPlan && selectedPlan.id === planId) {
        setSelectedPlan({ ...selectedPlan, ...updates, updatedAt: new Date() });
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  };

  const deletePlan = async (planId) => {
    try {
      // Check if plan has workouts
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('planId', '==', planId)
      );
      const workoutsSnapshot = await getDocs(workoutsQuery);
      
      if (workoutsSnapshot.size > 0) {
        const confirmed = window.confirm(
          `This plan has ${workoutsSnapshot.size} workout(s). Delete the plan and all its workouts?`
        );
        if (!confirmed) {
          return false;
        }
        
        // Delete all workouts for this plan
        const deletePromises = workoutsSnapshot.docs.map(doc => 
          deleteDoc(doc.ref)
        );
        await Promise.all(deletePromises);
      }
      
      // Delete the plan
      await deleteDoc(doc(db, 'plans', planId));
      
      const updatedPlans = plans.filter(p => p.id !== planId);
      setPlans(updatedPlans);
      
      // If deleted plan was selected, select another one
      if (selectedPlan && selectedPlan.id === planId) {
        if (updatedPlans.length > 0) {
          setSelectedPlan(updatedPlans[0]);
          localStorage.setItem('selectedPlanId', updatedPlans[0].id);
        } else {
          setSelectedPlan(null);
          localStorage.removeItem('selectedPlanId');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting plan:', error);
      throw error;
    }
  };

  const selectPlan = (plan) => {
    setSelectedPlan(plan);
    localStorage.setItem('selectedPlanId', plan.id);
  };

  const value = {
    plans,
    selectedPlan,
    loading,
    createPlan,
    updatePlan,
    deletePlan,
    selectPlan,
    refreshPlans: fetchPlans
  };

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
};
