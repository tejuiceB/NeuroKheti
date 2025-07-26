"use client";

import { useState } from 'react';
import { Camera, TrendingUp, FileText, Mic, X, User, Settings, History, Calendar, Globe, Calculator } from 'lucide-react';
import CropDiagnosis from './CropDiagnosis';
import VaaniAssistant from './VaaniAssistant';
import CropLifecycleNavigator from './CropLifecycleNavigator';
import ROICalculator from './ROICalculator';
import MarketAnalysis from './MarketAnalysis';

interface DashboardProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
}

export default function Dashboard({ isOpen, onClose, userEmail }: DashboardProps) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  const features = [
    {
      id: 'crop-lifecycle',
      title: 'Crop Lifecycle Navigator',
      description: 'Step-by-step farming guide',
      icon: Calendar,
      color: 'indigo',
      stats: 'Seed to Market',
      bgGradient: 'from-indigo-400 to-indigo-600'
    },
    {
      id: 'crop-diagnosis',
      title: 'Crop Diagnosis',
      description: 'AI-powered disease identification',
      icon: Camera,
      color: 'green',
      stats: '95% Accuracy',
      bgGradient: 'from-green-400 to-green-600'
    },
    {
      id: 'market-analysis',
      title: 'Market Analysis',
      description: 'Real-time price tracking',
      icon: TrendingUp,
      color: 'blue',
      stats: 'Live Data',
      bgGradient: 'from-blue-400 to-blue-600'
    },
    {
      id: 'scheme-navigator',
      title: 'Government Schemes',
      description: 'Find and apply for subsidies',
      icon: FileText,
      color: 'purple',
      stats: '500+ Schemes',
      bgGradient: 'from-purple-400 to-purple-600'
    },
    {
      id: 'vaani-assistant',
      title: 'Vaani Assistant',
      description: 'Voice-first AI companion',
      icon: Mic,
      color: 'purple',
      stats: '12+ Languages',
      bgGradient: 'from-purple-500 to-pink-500'
    }
  ];

  const recentActivity = [
    { type: 'lifecycle', crop: 'Soybean Plan', status: 'Step 3/10', date: '1 hour ago' },
    { type: 'diagnosis', crop: 'Tomato', disease: 'Late Blight', date: '2 hours ago' },
    { type: 'market', crop: 'Wheat', price: '₹2,150/quintal', date: '5 hours ago' },
    { type: 'scheme', name: 'PM-KUSUM Solar', status: 'Applied', date: '1 day ago' }
  ];

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-50 p-4"
        onClick={handleBackgroundClick}
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">NeuroKheti Dashboard</h2>
                <p className="text-gray-600">Welcome back, {userEmail?.split('@')[0]}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">12+ Languages</span>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-500" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Crop Lifecycle Feature Banner - New Feature Highlight */}
            <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-xl font-semibold text-indigo-900">NEW: Crop Lifecycle Navigator</h3>
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">BETA</span>
                  </div>
                  <p className="text-indigo-700 text-sm mb-3">
                    Get personalized step-by-step farming guidance from seed to sale. Create custom plans for your crops with AI-powered recommendations.
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-indigo-600">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>Custom Timeline</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>🌱</span>
                      <span>Seed to Market</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>📱</span>
                      <span>Mobile Reminders</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveFeature('crop-lifecycle')}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 font-semibold"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Create Plan</span>
                </button>
              </div>
            </div>

            {/* NEW: ROI Calculator Feature Banner */}
            <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calculator className="w-8 h-8 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-xl font-semibold text-green-900">ROI Calculator</h3>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">NEW</span>
                  </div>
                  <p className="text-green-700 text-sm mb-3">
                    फायदा कितना होगा? Calculate profit before you plant. Get detailed cost analysis and ROI projections for any crop.
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-green-600">
                    <span className="flex items-center space-x-1">
                      <span>💰</span>
                      <span>Profit Calculator</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>📊</span>
                      <span>Investment Analysis</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>🎯</span>
                      <span>Smart Decisions</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveFeature('roi-calculator')}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  Calculate ROI
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100">Active Plans</p>
                    <p className="text-2xl font-bold">2</p>
                  </div>
                  <Calendar className="w-8 h-8 text-indigo-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Analyses Today</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                  <Camera className="w-8 h-8 text-green-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Price Alerts</p>
                    <p className="text-2xl font-bold">3</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Voice Queries</p>
                    <p className="text-2xl font-bold">8</p>
                  </div>
                  <Mic className="w-8 h-8 text-orange-200" />
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Features */}
              <div className="lg:col-span-2">
                <h3 className="text-xl font-bold text-gray-900 mb-6">AI-Powered Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {features.map((feature) => {
                    const IconComponent = feature.icon;
                    const isNew = feature.id === 'crop-lifecycle';
                    const isVaani = feature.id === 'vaani-assistant';
                    
                    return (
                      <div
                        key={feature.id}
                        onClick={() => setActiveFeature(feature.id)}
                        className={`bg-white rounded-xl shadow-lg border p-6 hover:shadow-xl transition-all duration-200 cursor-pointer hover:-translate-y-1 ${
                          isNew ? 'border-indigo-200 ring-2 ring-indigo-100' :
                          isVaani ? 'border-purple-200 ring-2 ring-purple-100' : 
                          'border-gray-100'
                        }`}
                      >
                        <div className="flex items-center mb-4">
                          <div className={`w-12 h-12 bg-gradient-to-r ${feature.bgGradient} rounded-lg flex items-center justify-center mr-4`}>
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                              {feature.title}
                              {isNew && <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">NEW</span>}
                              {isVaani && <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">VOICE</span>}
                            </h4>
                            <p className="text-sm text-gray-600">{feature.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full bg-${feature.color}-100 text-${feature.color}-800`}>
                            {feature.stats}
                          </span>
                          <div className="flex items-center space-x-2">
                            {(feature.id === 'crop-diagnosis' || feature.id === 'vaani-assistant') && (
                              <div className="flex items-center space-x-1">
                                <Globe className="w-3 h-3 text-green-600" />
                                <span className="text-xs text-green-600">12+ Languages</span>
                              </div>
                            )}
                            <button className={`text-${feature.color}-600 hover:text-${feature.color}-700 font-medium text-sm`}>
                              Open →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions - Crop Lifecycle prominent */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center mb-4">
                    <Calendar className="w-5 h-5 text-gray-600 mr-2" />
                    <h4 className="text-lg font-semibold text-gray-900">Quick Actions</h4>
                  </div>
                  <div className="space-y-2">
                    <button 
                      onClick={() => setActiveFeature('crop-lifecycle')}
                      className="w-full text-left p-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center border border-indigo-200"
                    >
                      <Calendar className="w-4 h-4 text-indigo-600 mr-3" />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-indigo-900">Create Crop Plan</span>
                        <p className="text-xs text-indigo-600">NEW: Step-by-step guidance</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => setActiveFeature('vaani-assistant')}
                      className="w-full text-left p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors flex items-center border border-purple-200"
                    >
                      <Mic className="w-4 h-4 text-purple-600 mr-3" />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-purple-900">Talk to Vaani</span>
                        <p className="text-xs text-purple-600">Voice assistant ready</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => setActiveFeature('crop-diagnosis')}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                    >
                      <Camera className="w-4 h-4 text-green-600 mr-3" />
                      <span className="text-sm text-gray-700">Quick Diagnosis</span>
                    </button>
                    <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                      <TrendingUp className="w-4 h-4 text-blue-600 mr-3" />
                      <span className="text-sm text-gray-700">Check Prices</span>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center mb-4">
                    <History className="w-5 h-5 text-gray-600 mr-2" />
                    <h4 className="text-lg font-semibold text-gray-900">Recent Activity</h4>
                  </div>
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.type === 'lifecycle' ? 'bg-indigo-500' :
                          activity.type === 'diagnosis' ? 'bg-green-500' :
                          activity.type === 'market' ? 'bg-blue-500' : 'bg-purple-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.type === 'lifecycle' && `${activity.crop} - ${activity.status}`}
                            {activity.type === 'diagnosis' && `${activity.crop} - ${activity.disease}`}
                            {activity.type === 'market' && `${activity.crop} - ${activity.price}`}
                            {activity.type === 'scheme' && `${activity.name} - ${activity.status}`}
                          </p>
                          <p className="text-xs text-gray-500">{activity.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Components */}
      <CropLifecycleNavigator 
        isOpen={activeFeature === 'crop-lifecycle'} 
        onClose={() => setActiveFeature(null)} 
      />
      
      <CropDiagnosis 
        isOpen={activeFeature === 'crop-diagnosis'} 
        onClose={() => setActiveFeature(null)} 
      />
      
      <MarketAnalysis 
        isOpen={activeFeature === 'market-analysis'} 
        onClose={() => setActiveFeature(null)} 
      />
      
      <VaaniAssistant 
        isOpen={activeFeature === 'vaani-assistant'} 
        onClose={() => setActiveFeature(null)} 
      />

      <ROICalculator 
        isOpen={activeFeature === 'roi-calculator'} 
        onClose={() => setActiveFeature(null)} 
      />
    </>
  );
}
