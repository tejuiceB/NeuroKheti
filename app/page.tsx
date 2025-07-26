"use client";

import { useState, useEffect } from "react";
import { Camera, TrendingUp, FileText, Mic, Smartphone, User, LogOut, Globe, Calendar, Calculator } from "lucide-react";
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import DemoPopup from "../components/DemoPopup";
import AuthModal from "../components/AuthModal";
import Dashboard from "../components/Dashboard";
import VaaniAssistant from "../components/VaaniAssistant";
import CropLifecycleNavigator from "../components/CropLifecycleNavigator";
import ROICalculator from "../components/ROICalculator";
import MarketAnalysis from "../components/MarketAnalysis";

export default function Home() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isVaaniOpen, setIsVaaniOpen] = useState(false);
  const [isCropNavigatorOpen, setIsCropNavigatorOpen] = useState(false);
  const [isROICalculatorOpen, setIsROICalculatorOpen] = useState(false);
  const [isMarketAnalysisOpen, setIsMarketAnalysisOpen] = useState(false);

  useEffect(() => {
    // Listen to authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setUserEmail(user?.email || null);
      setIsAuthLoading(false); // Set loading to false once auth state is determined
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userEmail');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Show loading state while Firebase initializes
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-2xl">N</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading NeuroKheti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-green-50 to-white ${(isDemoOpen || isAuthModalOpen || isDashboardOpen || isVaaniOpen || isCropNavigatorOpen || isROICalculatorOpen || isMarketAnalysisOpen) ? 'overflow-hidden' : ''}`}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100 relative z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div 
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={scrollToTop}
            >
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <h1 className="text-2xl font-bold text-green-800">NeuroKheti</h1>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                Contact
              </button>
            </nav>
            
            {/* Authentication Section */}
            <div className="flex items-center space-x-3">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <User className="w-5 h-5" />
                    <span className="text-sm font-medium">{userEmail?.split('@')[0]}</span>
                  </div>
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className="text-gray-600 hover:text-green-600 transition-colors px-4 py-2 rounded-lg hover:bg-green-50"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Your AI-Powered
            <span className="text-green-600 block">Agricultural Assistant</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Meet Rohan&#39;s ally in the field - an intelligent companion that creates personalized farming plans, 
            diagnoses crop diseases instantly, provides real-time market analysis, and navigates government schemes, 
            all in your native language.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => isAuthenticated ? setIsDashboardOpen(true) : setIsDemoOpen(true)}
              className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Smartphone className="w-5 h-5" />
              <span>{isAuthenticated ? 'Open Dashboard' : 'Try Demo'}</span>
            </button>
            
            {/* Crop Lifecycle Button for authenticated users */}
            {isAuthenticated && (
              <button 
                onClick={() => setIsCropNavigatorOpen(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Calendar className="w-5 h-5" />
                <span>Create Crop Plan</span>
              </button>
            )}
            
            {/* Voice Assistant Button - Only show for authenticated users */}
            {isAuthenticated && (
              <button 
                onClick={() => setIsVaaniOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Mic className="w-5 h-5" />
                <span>Talk to Vaani</span>
              </button>
            )}
            
            {!isAuthenticated && (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-50 transition-colors"
              >
                Get Started
              </button>
            )}
          </div>
          
          {/* NEW: Crop Lifecycle Feature Highlight */}
          {isAuthenticated && (
            <div className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-200">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-indigo-900">NEW: Crop Lifecycle Navigator</h3>
                  <p className="text-indigo-700">Personalized farming plans from seed to sale</p>
                </div>
              </div>
              <p className="text-indigo-800 text-lg mb-4">
                Get step-by-step farming guidance tailored to your crop, location, and soil type. 
                Never miss a critical farming activity with AI-powered reminders!
              </p>
              <div className="flex flex-wrap items-center justify-center space-x-6 text-sm text-indigo-700 mb-4">
                <span className="flex items-center space-x-1">
                  <span>🌱</span>
                  <span>Sowing to Harvest</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>📅</span>
                  <span>Custom Timeline</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>💰</span>
                  <span>Market Guidance</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>📱</span>
                  <span>Mobile Reminders</span>
                </span>
              </div>
              <button 
                onClick={() => setIsCropNavigatorOpen(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Calendar className="w-5 h-5" />
                <span>Create Your First Plan</span>
              </button>
            </div>
          )}

          {/* For non-authenticated users, show authentication prompt */}
          {!isAuthenticated && (
            <div className="mt-12 bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 border border-blue-200">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-gray-900">Unlock Vaani Voice Assistant</h3>
                  <p className="text-gray-700">Voice-first AI farming companion</p>
                </div>
              </div>
              <p className="text-gray-800 text-lg mb-4">
                Get access to Vaani, our advanced voice assistant that speaks 12+ Indian languages 
                and provides personalized farming advice through natural conversation.
              </p>
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <User className="w-5 h-5" />
                <span>Sign In to Access Vaani</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-16 bg-orange-50 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">The Challenge</h3>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto">
              Like Rohan in rural Karnataka, millions of farmers face daily challenges: identifying crop diseases, 
              timing market sales, and accessing government support - all while dealing with language barriers and remote locations.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🌱</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Crop Disease Mystery</h4>
              <p className="text-gray-600">Yellow spots on tomato leaves - is it fungus, pest, or fertilizer issue? Expert help is miles away.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Market Volatility</h4>
              <p className="text-gray-600">Prices at local mandi vary wildly. A day&#39;s delay could mean the difference between profit and loss.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Complex Schemes</h4>
              <p className="text-gray-600">Government subsidies and schemes exist but are scattered, complex, and not available in native languages.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Your Expert in Your Pocket</h3>
            <p className="text-xl text-gray-600">
              {isAuthenticated 
                ? "Five powerful features working together to revolutionize farming"
                : "Advanced AI features available after registration"
              }
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* NEW: Crop Lifecycle Navigator */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-indigo-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                  <Calendar className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-gray-900 flex items-center">
                    Crop Lifecycle Navigator
                    <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">NEW</span>
                  </h4>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Create personalized farming plans from seed to sale. Get AI-powered step-by-step guidance, 
                timely reminders for fertilizers and pesticides, and optimal selling recommendations.
              </p>
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-indigo-200 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div>
                    <p className="font-semibold text-indigo-800">Plan → Execute → Profit</p>
                    <p className="text-indigo-600 text-sm">Customized for your crop, soil, and location</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Crop Disease Diagnosis */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <Camera className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900">Instant Crop Diagnosis</h4>
              </div>
              <p className="text-gray-600 mb-6">
                Take a photo of diseased plants and get instant AI-powered analysis using multimodal Gemini models. 
                Identify pests, diseases, and get actionable advice on locally available remedies.
              </p>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-green-200 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📸</span>
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">Snap → Analyze → Act</p>
                    <p className="text-green-600 text-sm">Results in seconds, solutions in your language</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Analysis */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900">Real-Time Market Intel</h4>
              </div>
              <p className="text-gray-600 mb-6">
                Get live market prices for 15+ crops from major mandis across India. Track price trends, 
                demand levels, and receive selling recommendations powered by real-time data.
              </p>
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-blue-800">Tomatoes</p>
                        <p className="text-blue-600">₹45/kg ↗️ +12.5%</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-blue-800">Wheat</p>
                        <p className="text-blue-600">₹2,150/qt ↗️ +2.4%</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                    Live from 15+ Major Mandis
                  </span>
                </div>
              </div>
              {isAuthenticated && (
                <button
                  onClick={() => setIsMarketAnalysisOpen(true)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Live Market Data
                </button>
              )}
            </div>

            {/* Government Schemes */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-purple-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900">Scheme Navigator</h4>
              </div>
              <p className="text-gray-600 mb-6">
                Need subsidies for drip irrigation? Our AI explains relevant government schemes in simple terms, 
                lists eligibility requirements, and provides direct links to application portals.
              </p>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <p className="text-purple-800 font-medium">PM-KISAN Scheme</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <p className="text-purple-800 font-medium">Drip Irrigation Subsidy</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <p className="text-purple-800 font-medium">Crop Insurance Portal</p>
                  </div>
                </div>
              </div>
            </div>

            {/* NEW: ROI Calculator Feature */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-100">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calculator className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">ROI Calculator</h3>
                  <p className="text-gray-600">फायदा कितना होगा?</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Calculate profit before you plant! Get detailed cost analysis, yield predictions, and ROI projections for any crop based on your specific conditions.
              </p>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">💰 Complete cost breakdown analysis</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">📊 Yield predictions based on soil & climate</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">🎯 Smart investment recommendations</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">💡 Compare multiple crop options</span>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">150%+</div>
                  <div className="text-sm text-green-700">Average ROI improvement with data-driven decisions</div>
                </div>
              </div>
            </div>

            {/* Voice Interface - Modified for authentication */}
            <div className={`bg-white rounded-2xl shadow-lg p-8 border border-orange-100 ${!isAuthenticated ? 'opacity-60 relative' : ''}`}>
              {!isAuthenticated && (
                <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center z-10">
                  <div className="text-center">
                    <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-semibold mb-3">Sign in to unlock Vaani</p>
                    <button 
                      onClick={() => setIsAuthModalOpen(true)}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Get Access
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <Mic className="w-6 h-6 text-orange-600" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900">Voice-First Experience</h4>
              </div>
              <p className="text-gray-600 mb-6">
                Overcome literacy barriers with complete voice interaction. Speak in Kannada, Hindi, or any local dialect. 
                Get clear, easy-to-understand voice responses using Vertex AI Speech technology.
              </p>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Mic className="w-8 h-8 text-orange-600" />
                  </div>
                  <p className="text-orange-800 font-semibold">&quot;ಟೊಮೇಟೋ ಬೆಲೆ ಏನು?&quot; (What&apos;s tomato price?)</p>
                  <p className="text-orange-600 text-sm mt-1">Supports 10+ Indian languages</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Voice Interface Feature - Only show for authenticated users */}
      {isAuthenticated && (
        <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white relative z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mr-6">
                <span className="text-3xl font-bold">वा</span>
              </div>
              <div className="text-left">
                <h3 className="text-4xl font-bold mb-2">Vaani - वाणी</h3>
                <p className="text-xl text-purple-100">Voice-First Agricultural Intelligence</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <Mic className="w-12 h-12 mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">Natural Speech</h4>
                <p className="text-purple-100">Speak naturally in your local dialect or language</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <Globe className="w-12 h-12 mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">12+ Languages</h4>
                <p className="text-purple-100">Hindi, Kannada, Telugu, Tamil, and more</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <User className="w-12 h-12 mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">Personal Assistant</h4>
                <p className="text-purple-100">Remembers your farm and provides personalized advice</p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsVaaniOpen(true)}
              className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2 mx-auto"
            >
              <Mic className="w-5 h-5" />
              <span>Try Vaani Now</span>
            </button>
          </div>
        </section>
      )}

      {/* For non-authenticated users, show signup CTA instead */}
      {!isAuthenticated && (
        <section className="py-16 bg-gradient-to-r from-blue-600 to-green-600 text-white relative z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mr-6">
                <User className="w-12 h-12" />
              </div>
              <div className="text-left">
                <h3 className="text-4xl font-bold mb-2">Join NeuroKheti Today</h3>
                <p className="text-xl text-blue-100">Unlock advanced AI features for your farm</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <Mic className="w-12 h-12 mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">Vaani Voice Assistant</h4>
                <p className="text-blue-100">Talk naturally in your native language</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <Camera className="w-12 h-12 mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">Unlimited Diagnosis</h4>
                <p className="text-blue-100">Scan crops without limits</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">Personal Dashboard</h4>
                <p className="text-blue-100">Track your farm&apos;s progress</p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2 mx-auto"
            >
              <User className="w-5 h-5" />
              <span>Sign Up Free</span>
            </button>
          </div>
        </section>
      )}

      {/* About Section */}
      <section id="about" className="min-h-screen bg-white relative z-20 flex items-center py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-8">
            <h3 className="text-4xl font-bold text-gray-900 mb-3">About NeuroKheti</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Empowering farmers with cutting-edge AI technology to revolutionize agriculture and improve livelihoods.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center mb-8">
            {/* Story Section - Condensed */}
            <div>
              <h4 className="text-xl font-bold text-gray-900 mb-4">Our Story</h4>
              <div className="space-y-3 text-gray-600 text-sm">
                <p>
                  NeuroKheti was born from meeting Rohan, a Karnataka farmer who lost his tomato crop 
                  to an unidentified disease. Despite having a smartphone, he lacked access to agricultural 
                  expertise in his native language.
                </p>
                <p>
                  Today, we serve 500,000+ farmers across India with instant crop diagnosis, 
                  real-time market intelligence, and government scheme navigation - all in their native languages.
                </p>
              </div>
            </div>

            {/* Mission & Vision - Compact */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-lg">🎯</span>
                </div>
                <h5 className="text-sm font-bold text-green-800 mb-2">Our Mission</h5>
                <p className="text-xs text-green-700">
                  Democratize agricultural knowledge through accessible AI technology for every farmer.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-lg">🌟</span>
                </div>
                <h5 className="text-sm font-bold text-blue-800 mb-2">Our Vision</h5>
                <p className="text-xs text-blue-700">
                  Every farmer having an AI-powered agricultural expert leading to sustainable farming.
                </p>
              </div>
            </div>
          </div>

          {/* Key Features Grid - Compact */}
          <div className="mb-8">
            <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">Why Choose NeuroKheti?</h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Camera className="w-6 h-6 text-green-600" />
                </div>
                <h6 className="font-semibold text-gray-900 text-sm mb-1">95% Accuracy</h6>
                <p className="text-gray-600 text-xs">AI crop disease identification</p>
              </div>

              <div className="text-center p-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Mic className="w-6 h-6 text-blue-600" />
                </div>
                <h6 className="font-semibold text-gray-900 text-sm mb-1">12+ Languages</h6>
                <p className="text-gray-600 text-xs">Indian languages & dialects</p>
              </div>

              <div className="text-center p-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <h6 className="font-semibold text-gray-900 text-sm mb-1">Real-time Data</h6>
                <p className="text-gray-600 text-xs">Live market & weather updates</p>
              </div>

              <div className="text-center p-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
                <h6 className="font-semibold text-gray-900 text-sm mb-1">Free Forever</h6>
                <p className="text-gray-600 text-xs">Core features always free</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-16 bg-gray-50 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Powered by Advanced AI</h3>
            <p className="text-lg text-gray-600">Built on Google Cloud&#39;s cutting-edge AI infrastructure</p>
          </div
          >
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Vertex AI</h4>
              <p className="text-gray-600 text-sm">Advanced machine learning platform</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💎</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Gemini Models</h4>
              <p className="text-gray-600 text-sm">Multimodal AI for image analysis</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🗣️</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Speech AI</h4>
              <p className="text-gray-600 text-sm">Text-to-Speech & Speech-to-Text</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔧</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Agent Builder</h4>
              <p className="text-gray-600 text-sm">Conversational AI framework</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700 text-white relative z-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="text-4xl font-bold mb-6">Ready to Transform Your Farming?</h3>
          <p className="text-xl mb-8 text-green-100">
            Join thousands of farmers who&#39;ve already discovered their AI-powered agricultural companion.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <button 
                  onClick={() => setIsCropNavigatorOpen(true)}
                  className="bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors flex items-center space-x-2 justify-center"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Create Crop Plan</span>
                </button>
                <button 
                  onClick={() => setIsMarketAnalysisOpen(true)}
                  className="bg-blue-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors flex items-center space-x-2 justify-center"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>Check Market Prices</span>
                </button>
                <button 
                  onClick={() => setIsROICalculatorOpen(true)}
                  className="bg-emerald-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-emerald-600 transition-colors flex items-center space-x-2 justify-center"
                >
                  <Calculator className="w-5 h-5" />
                  <span>Calculate ROI</span>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Get Started Free
                </button>
                <button 
                  onClick={() => setIsDemoOpen(true)}
                  className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
                >
                  Try Demo
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div 
                className="flex items-center space-x-2 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={scrollToTop}
              >
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">N</span>
                </div>
                <span className="text-xl font-bold">NeuroKheti</span>
              </div>
              <p className="text-gray-400 mb-4">
                Empowering farmers with AI-driven agricultural intelligence.
              </p>
              <div className="space-y-2 text-gray-400">
                <p>📧 contact@neurokhet.com</p>
                <p>📞 +91-800-NEURO-KHETI</p>
                <p>📍 Bangalore, Karnataka, India</p>
              </div>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Features</h5>
              <ul className="space-y-2 text-gray-400">
                <li className="cursor-pointer hover:text-white transition-colors" onClick={() => scrollToSection('features')}>Crop Diagnosis</li>
                <li className="cursor-pointer hover:text-white transition-colors" onClick={() => scrollToSection('features')}>Market Analysis</li>
                <li className="cursor-pointer hover:text-white transition-colors" onClick={() => scrollToSection('features')}>Government Schemes</li>
                <li className="cursor-pointer hover:text-white transition-colors" onClick={() => scrollToSection('features')}>Voice Interface</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-gray-400">
                <li className="cursor-pointer hover:text-white transition-colors">Help Center</li>
                <li className="cursor-pointer hover:text-white transition-colors">Documentation</li>
                <li className="cursor-pointer hover:text-white transition-colors">Community</li>
                <li className="cursor-pointer hover:text-white transition-colors">Contact Us</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Connect</h5>
              <ul className="space-y-2 text-gray-400">
                <li className="cursor-pointer hover:text-white transition-colors">Twitter</li>
                <li className="cursor-pointer hover:text-white transition-colors">LinkedIn</li>
                <li className="cursor-pointer hover:text-white transition-colors">YouTube</li>
                <li className="cursor-pointer hover:text-white transition-colors">Newsletter</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 NeuroKheti. Built with ❤️ for farmers worldwide.</p>
          </div>
        </div>
      </footer>

      {/* Demo Popup */}
      <DemoPopup 
        isOpen={isDemoOpen} 
        onClose={() => setIsDemoOpen(false)} 
      />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Dashboard */}
      <Dashboard 
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        userEmail={userEmail}
      />
      
      {/* Crop Lifecycle Navigator - Only render for authenticated users */}
      {isAuthenticated && (
        <CropLifecycleNavigator 
          isOpen={isCropNavigatorOpen}
          onClose={() => setIsCropNavigatorOpen(false)}
        />
      )}
      
      {/* Vaani Assistant - Only render for authenticated users */}
      {isAuthenticated && (
        <VaaniAssistant 
          isOpen={isVaaniOpen}
          onClose={() => setIsVaaniOpen(false)}
        />
      )}

      {/* NEW: ROI Calculator - Available for all users */}
      <ROICalculator 
        isOpen={isROICalculatorOpen}
        onClose={() => setIsROICalculatorOpen(false)}
      />

      {/* Market Analysis - Available for authenticated users */}
      {isAuthenticated && (
        <MarketAnalysis 
          isOpen={isMarketAnalysisOpen}
          onClose={() => setIsMarketAnalysisOpen(false)}
        />
      )}
    </div>
  );
}