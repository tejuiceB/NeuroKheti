"use client";

import { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle, Plus, Trash2, RefreshCw } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import CropSetupWizard from './CropSetupWizard';

interface CropLifecycleNavigatorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CropStep {
  id: string;
  title: string;
  description: string;
  scheduled_date: string;
  completed_date?: string;
  status: 'upcoming' | 'current' | 'completed' | 'overdue';
  category: 'sowing' | 'fertilizer' | 'pesticide' | 'irrigation' | 'harvest' | 'market';
  materials?: string[];
  notes?: string;
}

interface CropPlan {
  id: string;
  crop_name: string;
  location: string;
  soil_type: string;
  water_source: string;
  land_size: string;
  start_date: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  current_step: number;
  total_steps: number;
  plan_generated: boolean;
  steps?: CropStep[];
  created_at: string;
  updated_at: string;
}

const CROP_NAMES = {
  'soybean': 'Soybean (सोयाबीन)',
  'cotton': 'Cotton (कपास)',
  'wheat': 'Wheat (गेहूं)',
  'tomato': 'Tomato (टमाटर)',
  'onion': 'Onion (प्याज)',
  'rice': 'Rice (चावल)',
  'sugarcane': 'Sugarcane (गन्ना)',
  'maize': 'Maize (मक्का)'
};

const STEP_ICONS = {
  'sowing': '🌱',
  'fertilizer': '🌿',
  'pesticide': '🛡️',
  'irrigation': '💧',
  'harvest': '🌾',
  'market': '💰'
};

export default function CropLifecycleNavigator({ isOpen, onClose }: CropLifecycleNavigatorProps) {
  const [cropPlans, setCropPlans] = useState<CropPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<CropPlan | null>(null);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser || !isOpen) {
      setIsLoading(false);
      return;
    }

    console.log('Setting up Firestore listener for user:', auth.currentUser.uid);

    const q = query(
      collection(db, 'user_crops'),
      where('user_id', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Firestore snapshot received, documents:', snapshot.size);
      
      const plans: CropPlan[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Document data:', doc.id, data);
        plans.push({ id: doc.id, ...data } as CropPlan);
      });
      
      // Sort by creation date (newest first)
      plans.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log('Processed plans:', plans);
      setCropPlans(plans);
      setIsLoading(false);
      setError(null);
    }, (error) => {
      console.error('Error fetching crop plans:', error);
      setError('Failed to load crop plans. Please check your internet connection and try again.');
      setIsLoading(false);
    });

    return () => {
      console.log('Cleaning up Firestore listener');
      unsubscribe();
    };
  }, [isOpen]);

  const handleStepComplete = async (planId: string, stepId: string) => {
    if (!auth.currentUser) {
      setError('Authentication required');
      return;
    }

    try {
      const planRef = doc(db, 'user_crops', planId);
      const plan = cropPlans.find(p => p.id === planId);
      
      if (!plan || !plan.steps) return;

      const updatedSteps = plan.steps.map(step => 
        step.id === stepId 
          ? { ...step, status: 'completed' as const, completed_date: new Date().toISOString() }
          : step
      );

      const completedSteps = updatedSteps.filter(step => step.status === 'completed').length;
      const progress = Math.round((completedSteps / updatedSteps.length) * 100);

      await updateDoc(planRef, {
        steps: updatedSteps,
        progress,
        current_step: completedSteps + 1,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating step:', error);
      setError('Failed to update step. Please try again.');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this crop plan?')) return;

    try {
      await deleteDoc(doc(db, 'user_crops', planId));
    } catch (error) {
      console.error('Error deleting plan:', error);
      setError('Failed to delete plan');
    }
  };

  const regeneratePlan = async (planId: string) => {
    try {
      setIsLoading(true);
      const plan = cropPlans.find(p => p.id === planId);
      if (!plan) return;

      const response = await fetch('/api/generate-crop-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cropPlanId: planId.split('_')[1],
          cropData: {
            crop_name: plan.crop_name,
            location: plan.location,
            soil_type: plan.soil_type,
            water_source: plan.water_source,
            land_size: plan.land_size,
            start_date: plan.start_date
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate plan');
      }

      setError(null);
    } catch (error) {
      console.error('Error regenerating plan:', error);
      setError('Failed to regenerate plan');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysFromNow = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Add authentication check
  if (!auth.currentUser) {
    return (
      <div className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-md w-full p-8 shadow-2xl border border-white/50">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Authentication Required</h3>
          <p className="text-gray-600 mb-6">Please sign in to access the Crop Lifecycle Navigator.</p>
          <button
            onClick={onClose}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-50 p-4"
        onClick={handleBackgroundClick}
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Crop Lifecycle Navigator</h2>
              <p className="text-gray-600 mt-1">बीज से बाज़ार तक - आपका पूरा प्लान</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your crop plans...</p>
              </div>
            ) : cropPlans.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Start Your First Crop Plan</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Create a personalized step-by-step guide for your crop from sowing to selling. 
                  Get timely reminders and expert advice at each stage.
                </p>
                <button
                  onClick={() => setIsSetupWizardOpen(true)}
                  className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create New Plan</span>
                </button>
              </div>
            ) : !selectedPlan ? (
              /* Plan List View */
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Your Crop Plans</h3>
                  <button
                    onClick={() => setIsSetupWizardOpen(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Plan</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cropPlans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200 cursor-pointer hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl">
                            {plan.crop_name === 'soybean' ? '🌱' :
                             plan.crop_name === 'cotton' ? '🌿' :
                             plan.crop_name === 'wheat' ? '🌾' :
                             plan.crop_name === 'tomato' ? '🍅' :
                             plan.crop_name === 'onion' ? '🧅' :
                             plan.crop_name === 'rice' ? '🌾' :
                             plan.crop_name === 'sugarcane' ? '🎋' :
                             plan.crop_name === 'maize' ? '🌽' : '🌱'}
                          </span>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {CROP_NAMES[plan.crop_name as keyof typeof CROP_NAMES] || plan.crop_name}
                            </h4>
                            <p className="text-sm text-gray-500">{plan.location}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          plan.status === 'active' ? 'bg-green-100 text-green-800' :
                          plan.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {plan.status}
                        </span>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{plan.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${plan.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {plan.plan_generated && plan.steps && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            Step {plan.current_step} of {plan.total_steps}
                          </p>
                          <p className="text-sm font-medium text-gray-800">
                            Next: {plan.steps.find(s => s.status === 'current' || s.status === 'upcoming')?.title}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          Started {formatDate(plan.start_date)}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              regeneratePlan(plan.id);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Regenerate Plan"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePlan(plan.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete Plan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Plan Detail View */
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setSelectedPlan(null)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      ←
                    </button>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {CROP_NAMES[selectedPlan.crop_name as keyof typeof CROP_NAMES] || selectedPlan.crop_name}
                      </h3>
                      <p className="text-gray-600">{selectedPlan.location} • Started {formatDate(selectedPlan.start_date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{selectedPlan.progress}%</div>
                    <div className="text-sm text-gray-500">Complete</div>
                  </div>
                </div>

                {selectedPlan.plan_generated && selectedPlan.steps ? (
                  <div className="space-y-4">
                    {selectedPlan.steps.map((step, index) => {
                      const daysFromNow = getDaysFromNow(step.scheduled_date);
                      const isOverdue = daysFromNow < 0 && step.status !== 'completed';
                      
                      return (
                        <div
                          key={step.id}
                          className={`p-6 rounded-lg border-2 transition-all ${
                            step.status === 'completed' ? 'border-green-200 bg-green-50' :
                            step.status === 'current' ? 'border-blue-200 bg-blue-50' :
                            isOverdue ? 'border-red-200 bg-red-50' :
                            'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="text-2xl">
                                  {STEP_ICONS[step.category] || '📋'}
                                </span>
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900">
                                    Step {index + 1}: {step.title}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {formatDate(step.scheduled_date)}
                                    {daysFromNow === 0 && ' (Today)'}
                                    {daysFromNow === 1 && ' (Tomorrow)'}
                                    {daysFromNow > 1 && ` (in ${daysFromNow} days)`}
                                    {daysFromNow < 0 && isOverdue && ` (${Math.abs(daysFromNow)} days overdue)`}
                                  </p>
                                </div>
                              </div>
                              
                              <p className="text-gray-700 mb-3">{step.description}</p>
                              
                              {step.materials && step.materials.length > 0 && (
                                <div className="mb-3">
                                  <h5 className="font-medium text-gray-800 mb-1">Required Materials:</h5>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {step.materials.map((material, idx) => (
                                      <li key={idx}>• {material}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4">
                              {step.status === 'completed' ? (
                                <div className="flex items-center space-x-2 text-green-600">
                                  <CheckCircle className="w-6 h-6" />
                                  <span className="text-sm font-medium">Completed</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleStepComplete(selectedPlan.id, step.id)}
                                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                >
                                  Mark Complete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Generating your personalized plan...</p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Setup Wizard */}
      <CropSetupWizard 
        isOpen={isSetupWizardOpen}
        onClose={() => setIsSetupWizardOpen(false)}
        onSuccess={() => {
          setIsSetupWizardOpen(false);
          // Refresh will happen automatically via Firestore listener
        }}
      />
    </>
  );
}
