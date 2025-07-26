/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, MapPin, Droplets, Mountain, Calendar, Sprout } from 'lucide-react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface CropSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CropPlanData {
  crop_name: string;
  location: string;
  soil_type: string;
  water_source: string;
  land_size: string;
  start_date: string;
  climate_type: string;
}

const CROPS = [
  { id: 'soybean', name: 'Soybean (सोयाबीन)', icon: '🌱', season: 'Kharif' },
  { id: 'cotton', name: 'Cotton (कपास)', icon: '🌿', season: 'Kharif' },
  { id: 'wheat', name: 'Wheat (गेहूं)', icon: '🌾', season: 'Rabi' },
  { id: 'tomato', name: 'Tomato (टमाटर)', icon: '🍅', season: 'Year-round' },
  { id: 'onion', name: 'Onion (प्याज)', icon: '🧅', season: 'Rabi' },
  { id: 'rice', name: 'Rice (चावल)', icon: '🌾', season: 'Kharif' },
  { id: 'sugarcane', name: 'Sugarcane (गन्ना)', icon: '🎋', season: 'Annual' },
  { id: 'maize', name: 'Maize (मक्का)', icon: '🌽', season: 'Kharif/Rabi' }
];

const SOIL_TYPES = [
  { id: 'black', name: 'Black Soil (काली मिट्टी)', description: 'Rich in cotton cultivation' },
  { id: 'red', name: 'Red Soil (लाल मिट्टी)', description: 'Good drainage, iron-rich' },
  { id: 'alluvial', name: 'Alluvial Soil (जलोढ़ मिट्टी)', description: 'River deposits, very fertile' },
  { id: 'sandy', name: 'Sandy Soil (रेतीली मिट्टी)', description: 'Quick drainage, less water retention' },
  { id: 'clayey', name: 'Clayey Soil (चिकनी मिट्टी)', description: 'High water retention' },
  { id: 'loamy', name: 'Loamy Soil (दोमट मिट्टी)', description: 'Best for most crops' }
];

const WATER_SOURCES = [
  { id: 'drip', name: 'Drip Irrigation (ड्रिप)', icon: '💧', efficiency: 'High' },
  { id: 'sprinkler', name: 'Sprinkler (स्प्रिंकलर)', icon: '🚿', efficiency: 'Medium' },
  { id: 'flood', name: 'Flood Irrigation (बाढ़)', icon: '🌊', efficiency: 'Low' },
  { id: 'rainfed', name: 'Rain-fed (बारिश)', icon: '🌧️', efficiency: 'Variable' },
  { id: 'borewell', name: 'Borewell (बोरवेल)', icon: '⚪', efficiency: 'High' },
  { id: 'canal', name: 'Canal (नहर)', icon: '🏞️', efficiency: 'Medium' }
];

const LAND_SIZES = [
  { id: 'small', name: 'Small (1-2 acres)', range: '1-2 acres' },
  { id: 'medium', name: 'Medium (3-5 acres)', range: '3-5 acres' },
  { id: 'large', name: 'Large (6-10 acres)', range: '6-10 acres' },
  { id: 'very_large', name: 'Very Large (10+ acres)', range: '10+ acres' }
];

export default function CropSetupWizard({ isOpen, onClose, onSuccess }: CropSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<CropPlanData>({
    crop_name: '',
    location: '',
    soil_type: '',
    water_source: '',
    land_size: '',
    start_date: '',
    climate_type: 'normal'
  });

  const totalSteps = 6;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Enhanced authentication check
    if (!auth.currentUser) {
      setError('Please login to create crop plan. Authentication required.');
      return;
    }

    // Ensure user is fully authenticated
    try {
      await auth.currentUser.getIdToken(true); // Force token refresh
    } catch (authError) {
      console.error('Authentication error:', authError);
      setError('Authentication expired. Please login again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate unique crop plan ID with user ID prefix for better security
      const timestamp = Date.now();
      const cropPlanId = `${auth.currentUser.uid}_crop_${timestamp}`;
      
      // Create crop plan data with enhanced structure
      const cropPlanData = {
        ...formData,
        user_id: auth.currentUser.uid,
        user_email: auth.currentUser.email || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active',
        progress: 0,
        steps_completed: [],
        current_step: 1,
        total_steps: 0,
        plan_generated: false,
        id: cropPlanId,
        // Add version for future compatibility
        version: '1.0',
        // Add ROI calculation flag
        roi_calculated: false,
        roi_suggestion_shown: false
      };

      console.log('Creating crop plan with data:', cropPlanData);

      // Save to Firestore with explicit document ID
      const cropRef = doc(db, 'user_crops', cropPlanId);
      await setDoc(cropRef, cropPlanData);

      console.log('Crop plan saved successfully to Firestore');

      // Small delay to ensure document is fully written
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate personalized plan via API with better error handling
      console.log('Starting AI plan generation...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for AI generation

      try {
        const response = await fetch('/api/generate-crop-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cropPlanId,
            cropData: formData,
            userId: auth.currentUser.uid
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error Response:', errorData);
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const result = await response.json();
        console.log('Crop plan generation result:', result);

        if (result.success && result.plan) {
          console.log(`Successfully generated ${result.totalSteps} steps for crop plan`);
          
          // Update the Firestore document with the generated plan on the client side
          try {
            console.log('Updating Firestore document with generated plan...');
            await updateDoc(cropRef, {
              steps: result.plan,
              total_steps: result.totalSteps,
              current_step: 1,
              plan_generated: true,
              updated_at: new Date().toISOString(),
              plan_generation_date: new Date().toISOString(),
              plan_version: '1.0',
              // Suggest ROI calculation
              roi_suggestion_shown: false
            });

            // Show success message with ROI calculation suggestion
            setSuccessMessage(
              `✅ Crop plan created successfully! ${result.totalSteps} steps generated for your ${formData.crop_name} cultivation.\n\n💡 Pro tip: Use our ROI Calculator to estimate your potential profits before starting!`
            );
            onSuccess();
          } catch (updateError) {
            console.error('Error updating Firestore document:', updateError);
            // Still show success since the plan was generated
          }

        } else {
          throw new Error('Plan generation failed: Invalid response structure');
        }

      } catch (fetchError) {
        console.error('Fetch error during plan generation:', fetchError);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Plan generation timed out. Please try again.');
        }
        throw new Error(`Plan generation failed: ${fetchError instanceof Error ? fetchError.message : 'Unknown error occurred'}`);
      }

    } catch (error) {
      console.error('Complete error in handleSubmit:', error);
      setError(error instanceof Error ? error.message : 'Failed to create crop plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return formData.crop_name !== '';
      case 2: return formData.location !== '';
      case 3: return formData.soil_type !== '';
      case 4: return formData.water_source !== '';
      case 5: return formData.land_size !== '';
      case 6: return formData.start_date !== '';
      default: return false;
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-50 p-4"
      onClick={handleBackgroundClick}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Crop Plan</h2>
            <p className="text-gray-600 mt-1">बीज से बाज़ार तक - एक पूरा प्लान</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {/* Step 1: Crop Selection */}
          {currentStep === 1 && (
            <div>
              <div className="flex items-center mb-4">
                <Sprout className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Choose Your Crop</h3>
              </div>
              <p className="text-gray-600 mb-6">फसल चुनें जो आप उगाना चाहते हैं</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CROPS.map((crop) => (
                  <button
                    key={crop.id}
                    onClick={() => setFormData(prev => ({ ...prev, crop_name: crop.id }))}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      formData.crop_name === crop.id
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{crop.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">{crop.name}</p>
                        <p className="text-sm text-gray-500">{crop.season} season</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div>
              <div className="flex items-center mb-4">
                <MapPin className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Your Location</h3>
              </div>
              <p className="text-gray-600 mb-6">आपकी खेत की जगह बताएं</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City/District (शहर/जिला)
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Amravati, Nagpur, Pune"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">💡 Why location matters:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Local weather patterns and rainfall</li>
                    <li>• Regional pest and disease cycles</li>
                    <li>• Nearby mandi prices and market trends</li>
                    <li>• Government schemes specific to your area</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Soil Type */}
          {currentStep === 3 && (
            <div>
              <div className="flex items-center mb-4">
                <Mountain className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Soil Type</h3>
              </div>
              <p className="text-gray-600 mb-6">आपकी मिट्टी का प्रकार चुनें</p>
              
              <div className="space-y-3">
                {SOIL_TYPES.map((soil) => (
                  <button
                    key={soil.id}
                    onClick={() => setFormData(prev => ({ ...prev, soil_type: soil.id }))}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      formData.soil_type === soil.id
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{soil.name}</p>
                        <p className="text-sm text-gray-600 mt-1">{soil.description}</p>
                      </div>
                      {formData.soil_type === soil.id && (
                        <span className="text-green-600">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Water Source */}
          {currentStep === 4 && (
            <div>
              <div className="flex items-center mb-4">
                <Droplets className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Water Source</h3>
              </div>
              <p className="text-gray-600 mb-6">सिंचाई का साधन चुनें</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WATER_SOURCES.map((water) => (
                  <button
                    key={water.id}
                    onClick={() => setFormData(prev => ({ ...prev, water_source: water.id }))}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      formData.water_source === water.id
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{water.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">{water.name}</p>
                        <p className="text-sm text-gray-500">Efficiency: {water.efficiency}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Land Size */}
          {currentStep === 5 && (
            <div>
              <div className="flex items-center mb-4">
                <Mountain className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Land Size</h3>
              </div>
              <p className="text-gray-600 mb-6">आपकी खेत का आकार</p>
              
              <div className="space-y-3">
                {LAND_SIZES.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setFormData(prev => ({ ...prev, land_size: size.id }))}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      formData.land_size === size.id
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{size.name}</p>
                        <p className="text-sm text-gray-600">{size.range}</p>
                      </div>
                      {formData.land_size === size.id && (
                        <span className="text-green-600">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Start Date */}
          {currentStep === 6 && (
            <div>
              <div className="flex items-center mb-4">
                <Calendar className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Start Date</h3>
              </div>
              <p className="text-gray-600 mb-6">कब शुरू करना चाहते हैं?</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Planning Start Date (योजना शुरू करने की तारीख)
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Summary */}
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3">📋 Plan Summary:</h4>
                  <div className="space-y-2 text-sm text-green-700">
                    <p><strong>Crop:</strong> {CROPS.find(c => c.id === formData.crop_name)?.name}</p>
                    <p><strong>Location:</strong> {formData.location}</p>
                    <p><strong>Soil:</strong> {SOIL_TYPES.find(s => s.id === formData.soil_type)?.name}</p>
                    <p><strong>Water:</strong> {WATER_SOURCES.find(w => w.id === formData.water_source)?.name}</p>
                    <p><strong>Land Size:</strong> {LAND_SIZES.find(l => l.id === formData.land_size)?.name}</p>
                    <p><strong>Start Date:</strong> {formData.start_date}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 text-sm whitespace-pre-line">{successMessage}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>

          <div className="flex space-x-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i + 1 <= currentStep ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!isStepValid() || isLoading}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Plan...
                </>
              ) : (
                'Create Plan'
              )}
            </button>
          )}
        </div>

        {/* Enhanced loading state for step 6 */}
        {currentStep === 6 && formData.start_date && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 mt-6">
            <h4 className="font-semibold text-blue-800 mb-3">🤖 AI Plan Generation Preview</h4>
            <p className="text-blue-700 text-sm mb-4">
              Your personalized plan will include specific steps for {CROPS.find(c => c.id === formData.crop_name)?.name} 
              cultivation in {formData.location} with {SOIL_TYPES.find(s => s.id === formData.soil_type)?.name}.
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-white p-3 rounded">
                <span className="font-medium text-gray-800">Includes:</span>
                <ul className="text-gray-600 mt-1 space-y-1">
                  <li>• Soil preparation guidance</li>
                  <li>• Fertilizer timing & quantities</li>
                  <li>• Pest management schedule</li>
                  <li>• Harvest optimization</li>
                </ul>
              </div>
              <div className="bg-white p-3 rounded">
                <span className="font-medium text-gray-800">AI-Powered:</span>
                <ul className="text-gray-600 mt-1 space-y-1">
                  <li>• Location-specific advice</li>
                  <li>• Soil-adapted recommendations</li>
                  <li>• Weather considerations</li>
                  <li>• Market timing guidance</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}