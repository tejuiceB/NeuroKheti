"use client";

import { useState, useEffect } from 'react';
import { X, Calculator, MapPin, Droplets, Banknote, TrendingUp, TrendingDown, Save } from 'lucide-react';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface ROICalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedCrop?: string;
}

interface ROIInputs {
  crop: string;
  location: string;
  soilType: string;
  waterSource: string;
  fertilityRating: string;
  landSize: number;
  costs: {
    seeds: number;
    fertilizer: number;
    pesticides: number;
    labor: number;
    irrigation: number;
    transport: number;
    misc: number;
  };
}

interface ROIResult {
  totalCost: number;
  expectedYield: number;
  expectedPrice: number;
  expectedIncome: number;
  netProfit: number;
  roiPercent: number;
  recommendation: 'highly_recommended' | 'recommended' | 'caution' | 'not_recommended';
}

const CROPS = [
  { value: 'soybean', label: 'Soybean (सोयाबीन)', avgYield: 8, avgPrice: 4500 },
  { value: 'cotton', label: 'Cotton (कपास)', avgYield: 6, avgPrice: 5500 },
  { value: 'wheat', label: 'Wheat (गेहूं)', avgYield: 12, avgPrice: 2200 },
  { value: 'rice', label: 'Rice (चावल)', avgYield: 15, avgPrice: 2800 },
  { value: 'maize', label: 'Maize (मक्का)', avgYield: 10, avgPrice: 2000 },
  { value: 'tomato', label: 'Tomato (टमाटर)', avgYield: 25, avgPrice: 1500 },
  { value: 'onion', label: 'Onion (प्याज)', avgYield: 20, avgPrice: 1800 },
  { value: 'sugarcane', label: 'Sugarcane (गन्ना)', avgYield: 50, avgPrice: 350 }
];

const SOIL_TYPES = [
  { value: 'black', label: 'Black Soil (काली मिट्टी)', yieldMultiplier: 1.1 },
  { value: 'red', label: 'Red Soil (लाल मिट्टी)', yieldMultiplier: 0.9 },
  { value: 'alluvial', label: 'Alluvial Soil (जलोढ़ मिट्टी)', yieldMultiplier: 1.0 },
  { value: 'sandy', label: 'Sandy Soil (रेतीली मिट्टी)', yieldMultiplier: 0.8 },
  { value: 'loamy', label: 'Loamy Soil (दोमट मिट्टी)', yieldMultiplier: 1.0 }
];

const WATER_SOURCES = [
  { value: 'rainfed', label: 'Rain-fed (बारिश पर निर्भर)', yieldMultiplier: 0.8 },
  { value: 'drip', label: 'Drip Irrigation (टपक सिंचाई)', yieldMultiplier: 1.2 },
  { value: 'canal', label: 'Canal Irrigation (नहर)', yieldMultiplier: 1.0 },
  { value: 'borewell', label: 'Borewell (बोरवेल)', yieldMultiplier: 1.1 },
  { value: 'sprinkler', label: 'Sprinkler (फव्वारा)', yieldMultiplier: 1.1 }
];

const FERTILITY_RATINGS = [
  { value: 'low', label: 'Low (कम)', yieldMultiplier: 0.7 },
  { value: 'medium', label: 'Medium (मध्यम)', yieldMultiplier: 1.0 },
  { value: 'high', label: 'High (उच्च)', yieldMultiplier: 1.3 }
];

export default function ROICalculator({ isOpen, onClose, preSelectedCrop }: ROICalculatorProps) {
  const [step, setStep] = useState(1);
  const [inputs, setInputs] = useState<ROIInputs>({
    crop: preSelectedCrop || '',
    location: '',
    soilType: '',
    waterSource: '',
    fertilityRating: '',
    landSize: 1,
    costs: {
      seeds: 0,
      fertilizer: 0,
      pesticides: 0,
      labor: 0,
      irrigation: 0,
      transport: 0,
      misc: 0
    }
  });
  const [result, setResult] = useState<ROIResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [, setSavedCalculations] = useState<any[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'roi_calculations'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const calculations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedCalculations(calculations);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (preSelectedCrop) {
      setInputs(prev => ({ ...prev, crop: preSelectedCrop }));
    }
  }, [preSelectedCrop]);

  const updateCostDefaults = (crop: string, soilType: string, waterSource: string) => {
    const cropData = CROPS.find(c => c.value === crop);
    if (!cropData) return;

    // Default costs per acre based on crop type
    const defaultCosts = {
      soybean: { seeds: 1000, fertilizer: 2000, pesticides: 1500, labor: 3000, irrigation: 0, transport: 600, misc: 500 },
      cotton: { seeds: 1500, fertilizer: 2500, pesticides: 2000, labor: 4000, irrigation: 1000, transport: 800, misc: 700 },
      wheat: { seeds: 800, fertilizer: 1800, pesticides: 1200, labor: 2500, irrigation: 800, transport: 500, misc: 400 },
      rice: { seeds: 1200, fertilizer: 2200, pesticides: 1800, labor: 3500, irrigation: 1500, transport: 700, misc: 600 },
      maize: { seeds: 900, fertilizer: 1600, pesticides: 1000, labor: 2800, irrigation: 600, transport: 500, misc: 500 },
      tomato: { seeds: 2000, fertilizer: 3000, pesticides: 2500, labor: 5000, irrigation: 2000, transport: 1000, misc: 1000 },
      onion: { seeds: 1800, fertilizer: 2800, pesticides: 2200, labor: 4500, irrigation: 1800, transport: 900, misc: 800 },
      sugarcane: { seeds: 3000, fertilizer: 4000, pesticides: 2000, labor: 6000, irrigation: 2500, transport: 1200, misc: 1200 }
    };

    const baseCosts = defaultCosts[crop as keyof typeof defaultCosts] || defaultCosts.soybean;
    
    // Adjust irrigation cost based on water source
    let irrigationCost = baseCosts.irrigation;
    if (waterSource === 'rainfed') irrigationCost = 0;
    else if (waterSource === 'drip') irrigationCost = baseCosts.irrigation * 1.5;

    setInputs(prev => ({
      ...prev,
      costs: {
        ...baseCosts,
        irrigation: irrigationCost
      }
    }));
  };

  const calculateROI = async () => {
    setIsCalculating(true);

    const cropData = CROPS.find(c => c.value === inputs.crop);
    const soilData = SOIL_TYPES.find(s => s.value === inputs.soilType);
    const waterData = WATER_SOURCES.find(w => w.value === inputs.waterSource);
    const fertilityData = FERTILITY_RATINGS.find(f => f.value === inputs.fertilityRating);

    if (!cropData || !soilData || !waterData || !fertilityData) {
      setIsCalculating(false);
      return;
    }

    // Calculate expected yield with multipliers
    const baseYield = cropData.avgYield;
    const yieldMultiplier = soilData.yieldMultiplier * waterData.yieldMultiplier * fertilityData.yieldMultiplier;
    const expectedYield = baseYield * yieldMultiplier * inputs.landSize;

    // Calculate total cost
    const totalCost = Object.values(inputs.costs).reduce((sum, cost) => sum + cost, 0) * inputs.landSize;

    // Expected income
    const expectedPrice = cropData.avgPrice;
    const expectedIncome = expectedYield * expectedPrice;

    // Net profit and ROI
    const netProfit = expectedIncome - totalCost;
    const roiPercent = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

    // Recommendation logic
    let recommendation: ROIResult['recommendation'];
    if (roiPercent > 150) recommendation = 'highly_recommended';
    else if (roiPercent > 50) recommendation = 'recommended';
    else if (roiPercent > 0) recommendation = 'caution';
    else recommendation = 'not_recommended';

    const calculatedResult: ROIResult = {
      totalCost,
      expectedYield,
      expectedPrice,
      expectedIncome,
      netProfit,
      roiPercent,
      recommendation
    };

    setResult(calculatedResult);
    setIsCalculating(false);
  };

  const saveCalculation = async () => {
    if (!auth.currentUser || !result) return;

    try {
      await addDoc(collection(db, 'roi_calculations'), {
        userId: auth.currentUser.uid,
        inputs,
        result,
        createdAt: new Date().toISOString(),
        userEmail: auth.currentUser.email
      });
      alert('ROI calculation saved successfully!');
    } catch (error) {
      console.error('Error saving calculation:', error);
      alert('Failed to save calculation');
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const nextStep = () => {
    if (step === 2) {
      updateCostDefaults(inputs.crop, inputs.soilType, inputs.waterSource);
    }
    if (step === 3) {
      calculateROI();
    }
    setStep(step + 1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'highly_recommended': return 'text-green-600 bg-green-50';
      case 'recommended': return 'text-blue-600 bg-blue-50';
      case 'caution': return 'text-yellow-600 bg-yellow-50';
      case 'not_recommended': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRecommendationText = (rec: string) => {
    switch (rec) {
      case 'highly_recommended': return '🚀 Highly Recommended - Excellent Returns Expected';
      case 'recommended': return '✅ Recommended - Good Investment Opportunity';
      case 'caution': return '⚠️ Proceed with Caution - Low Returns';
      case 'not_recommended': return '❌ Not Recommended - High Risk of Loss';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-50 p-4"
      onClick={handleBackgroundClick}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calculator className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">ROI Calculator</h2>
              <p className="text-gray-600">फायदा कितना होगा? - Calculate your crop profitability</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= stepNum ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNum ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Crop Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Step 1: Select Your Crop</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CROPS.map((crop) => (
                  <button
                    key={crop.value}
                    onClick={() => setInputs(prev => ({ ...prev, crop: crop.value }))}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      inputs.crop === crop.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">{crop.label}</div>
                    <div className="text-sm text-gray-600">
                      Avg Yield: {crop.avgYield} quintals/acre | Price: ₹{crop.avgPrice}/quintal
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Environmental Factors */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Step 2: Farm Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location (जिला)
                  </label>
                  <input
                    type="text"
                    value={inputs.location}
                    onChange={(e) => setInputs(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter your district"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Land Size (एकड़)
                  </label>
                  <input
                    type="number"
                    value={inputs.landSize}
                    onChange={(e) => setInputs(prev => ({ ...prev, landSize: parseFloat(e.target.value) || 1 }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter acres"
                    min="0.1"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Soil Type</label>
                  <select
                    value={inputs.soilType}
                    onChange={(e) => setInputs(prev => ({ ...prev, soilType: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select soil type</option>
                    {SOIL_TYPES.map((soil) => (
                      <option key={soil.value} value={soil.value}>{soil.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Droplets className="w-4 h-4 inline mr-1" />
                    Water Source
                  </label>
                  <select
                    value={inputs.waterSource}
                    onChange={(e) => setInputs(prev => ({ ...prev, waterSource: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select water source</option>
                    {WATER_SOURCES.map((water) => (
                      <option key={water.value} value={water.value}>{water.label}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Soil Fertility</label>
                  <select
                    value={inputs.fertilityRating}
                    onChange={(e) => setInputs(prev => ({ ...prev, fertilityRating: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select fertility level</option>
                    {FERTILITY_RATINGS.map((fertility) => (
                      <option key={fertility.value} value={fertility.value}>{fertility.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Cost Inputs */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Step 3: Input Costs (per acre)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Banknote className="w-4 h-4 inline mr-1" />
                    Seeds Cost (बीज)
                  </label>
                  <input
                    type="number"
                    value={inputs.costs.seeds}
                    onChange={(e) => setInputs(prev => ({ 
                      ...prev, 
                      costs: { ...prev.costs, seeds: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="₹1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fertilizer (खाद)</label>
                  <input
                    type="number"
                    value={inputs.costs.fertilizer}
                    onChange={(e) => setInputs(prev => ({ 
                      ...prev, 
                      costs: { ...prev.costs, fertilizer: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="₹2000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pesticides (दवा)</label>
                  <input
                    type="number"
                    value={inputs.costs.pesticides}
                    onChange={(e) => setInputs(prev => ({ 
                      ...prev, 
                      costs: { ...prev.costs, pesticides: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="₹1500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Labor (मजदूरी)</label>
                  <input
                    type="number"
                    value={inputs.costs.labor}
                    onChange={(e) => setInputs(prev => ({ 
                      ...prev, 
                      costs: { ...prev.costs, labor: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="₹3000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Irrigation (सिंचाई)</label>
                  <input
                    type="number"
                    value={inputs.costs.irrigation}
                    onChange={(e) => setInputs(prev => ({ 
                      ...prev, 
                      costs: { ...prev.costs, irrigation: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="₹1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transport to Mandi</label>
                  <input
                    type="number"
                    value={inputs.costs.transport}
                    onChange={(e) => setInputs(prev => ({ 
                      ...prev, 
                      costs: { ...prev.costs, transport: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="₹600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Miscellaneous (अन्य)</label>
                  <input
                    type="number"
                    value={inputs.costs.misc}
                    onChange={(e) => setInputs(prev => ({ 
                      ...prev, 
                      costs: { ...prev.costs, misc: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="₹500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {step === 4 && (
            <div className="space-y-6">
              {isCalculating ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Calculating your ROI...</p>
                </div>
              ) : result && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">ROI Analysis Results</h3>
                  
                  {/* Recommendation Banner */}
                  <div className={`p-4 rounded-lg mb-6 ${getRecommendationColor(result.recommendation)}`}>
                    <div className="text-lg font-semibold">
                      {getRecommendationText(result.recommendation)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3">Investment Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Total Cost:</span>
                          <span className="font-semibold text-gray-800">{formatCurrency(result.totalCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Land Size:</span>
                          <span className="text-gray-800">{inputs.landSize} acres</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Cost per Acre:</span>
                          <span className="text-gray-800">{formatCurrency(result.totalCost / inputs.landSize)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3">Expected Returns</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Expected Yield:</span>
                          <span className="text-gray-800">{result.expectedYield.toFixed(1)} quintals</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Price per Quintal:</span>
                          <span className="text-gray-800">{formatCurrency(result.expectedPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Total Income:</span>
                          <span className="font-semibold text-gray-800">{formatCurrency(result.expectedIncome)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profit Analysis */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-gray-800">
                          {formatCurrency(result.netProfit)}
                        </div>
                        <div className="text-sm text-gray-600">Net Profit</div>
                        <div className="text-xs text-gray-500">
                          {result.netProfit >= 0 ? (
                            <span className="text-green-600 flex items-center justify-center">
                              <TrendingUp className="w-4 h-4 mr-1" />
                              Profit
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center justify-center">
                              <TrendingDown className="w-4 h-4 mr-1" />
                              Loss
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-2xl font-bold text-gray-800">
                          {result.roiPercent.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">ROI</div>
                        <div className="text-xs text-gray-500">Return on Investment</div>
                      </div>
                      
                      <div>
                        <div className="text-2xl font-bold text-gray-800">
                          {(result.expectedIncome / result.totalCost).toFixed(1)}x
                        </div>
                        <div className="text-sm text-gray-600">Multiplier</div>
                        <div className="text-xs text-gray-500">Income vs Investment</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button
                      onClick={saveCalculation}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Save className="w-5 h-5" />
                      <span>Save Calculation</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setStep(1);
                        setResult(null);
                        setInputs({
                          crop: '',
                          location: '',
                          soilType: '',
                          waterSource: '',
                          fertilityRating: '',
                          landSize: 1,
                          costs: {
                            seeds: 0,
                            fertilizer: 0,
                            pesticides: 0,
                            labor: 0,
                            irrigation: 0,
                            transport: 0,
                            misc: 0
                          }
                        });
                      }}
                      className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Calculate Another Crop
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          {step < 4 && (
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <button
                onClick={nextStep}
                disabled={
                  (step === 1 && !inputs.crop) ||
                  (step === 2 && (!inputs.location || !inputs.soilType || !inputs.waterSource || !inputs.fertilityRating))
                }
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {step === 3 ? 'Calculate ROI' : 'Next'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
