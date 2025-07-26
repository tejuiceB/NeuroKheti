"use client";

import { useState, useEffect } from 'react';
import { X, Upload, Camera, Loader2, AlertCircle, CheckCircle, Smartphone, TrendingUp, FileText, Mic } from 'lucide-react';
import AuthModal from './AuthModal';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Image from 'next/image';

interface DemoPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AnalysisResult {
  disease: string;
  confidence: number;
  description: string;
  treatment: string;
  prevention: string;
}

export default function DemoPopup({ isOpen, onClose }: DemoPopupProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [demoUsed, setDemoUsed] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Listen to authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      if (user) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.removeItem('demoUsed'); // Reset demo usage for authenticated users
        setDemoUsed(false);
      } else {
        localStorage.setItem('isAuthenticated', 'false');
        // Check if demo was already used for non-authenticated users
        const demoUsedStatus = localStorage.getItem('demoUsed') === 'true';
        setDemoUsed(demoUsedStatus);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Check if user can upload
    if (!isAuthenticated && demoUsed) {
      setShowAuthModal(true);
      return;
    }

    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setResult(null);
        setError(null);
        
        // Mark demo as used for non-authenticated users
        if (!isAuthenticated) {
          localStorage.setItem('demoUsed', 'true');
          setDemoUsed(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!uploadedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Convert base64 to blob for API
      const base64 = uploadedImage.split(',')[1];

      const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=GEMINI_API_KEY`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Analyze this crop/plant image for diseases, pests, or health issues. Provide a detailed response in JSON format with the following structure:
                {
                  "disease": "Disease name or 'Healthy' if no issues detected",
                  "confidence": confidence_percentage_as_number,
                  "description": "Detailed description of the condition",
                  "treatment": "Treatment recommendations",
                  "prevention": "Prevention measures"
                }
                Focus on practical, actionable advice for farmers. If you cannot clearly identify the plant or see any issues, indicate uncertainty in your response.`
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64
                }
              }
            ]
          }]
        })
      });

      if (!apiResponse.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await apiResponse.json();
      const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (analysisText) {
        try {
          const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsedResult = JSON.parse(jsonMatch[0]);
            setResult(parsedResult);
          } else {
            setResult({
              disease: "Analysis Complete",
              confidence: 85,
              description: analysisText,
              treatment: "Please consult with a local agricultural expert for specific treatment recommendations.",
              prevention: "Maintain proper crop hygiene and regular monitoring."
            });
          }
        } catch {
          setResult({
            disease: "Analysis Complete",
            confidence: 80,
            description: analysisText,
            treatment: "Please consult with a local agricultural expert for specific treatment recommendations.",
            prevention: "Maintain proper crop hygiene and regular monitoring."
          });
        }
      } else {
        throw new Error('No analysis result received');
      }
    } catch (err) {
      setError('Failed to analyze image. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetDemo = () => {
    setUploadedImage(null);
    setResult(null);
    setError(null);
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setDemoUsed(false);
    setShowAuthModal(false);
  };

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
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Crop Disease Analysis {!isAuthenticated && '(Demo)'}
              </h2>
              <p className="text-gray-600 mt-1">
                {isAuthenticated 
                  ? 'Upload photos of your crops to get AI-powered analysis'
                  : !demoUsed 
                    ? 'Try our AI-powered analysis with one free demo'
                    : 'Login or create account to explore more features'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {!isAuthenticated && demoUsed && !uploadedImage ? (
              /* Enhanced Login/Signup Prompt */
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Smartphone className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Unlock Full Agricultural Intelligence</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                  Join NeuroKheti to access unlimited crop analysis and powerful farming insights designed for modern agriculture.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6 mb-8 max-w-3xl mx-auto">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-green-800 mb-3">Smart Crop Analysis</h4>
                    <ul className="text-sm text-green-700 space-y-2 text-left">
                      <li>• Unlimited disease detection</li>
                      <li>• Save and track diagnoses</li>
                      <li>• Advanced AI insights</li>
                      <li>• Personalized recommendations</li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-blue-800 mb-3">Market Intelligence</h4>
                    <ul className="text-sm text-blue-700 space-y-2 text-left">
                      <li>• Real-time price tracking</li>
                      <li>• Market trend analysis</li>
                      <li>• Optimal selling guidance</li>
                      <li>• Price alerts & notifications</li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-purple-800 mb-3">Government Schemes</h4>
                    <ul className="text-sm text-purple-700 space-y-2 text-left">
                      <li>• Personalized scheme finder</li>
                      <li>• Application assistance</li>
                      <li>• Eligibility checker</li>
                      <li>• Documentation support</li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Mic className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-orange-800 mb-3">Voice Assistant</h4>
                    <ul className="text-sm text-orange-700 space-y-2 text-left">
                      <li>• Multi-language support</li>
                      <li>• Voice-to-voice interaction</li>
                      <li>• Hands-free operation</li>
                      <li>• Regional dialect support</li>
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Create Free Account
                  </button>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="flex-1 border-2 border-green-600 text-green-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-50 transition-colors"
                  >
                    Sign In
                  </button>
                </div>

                <p className="text-sm text-gray-500 mt-6">
                  Join 500,000+ farmers already using NeuroKheti
                </p>
              </div>
            ) : !uploadedImage ? (
              /* Upload Section */
              <div className="text-center">
                {!isAuthenticated && !demoUsed && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl">
                    <p className="text-green-800 font-medium">
                      🎯 Free Demo - Try one analysis to see our AI in action!
                    </p>
                    <p className="text-green-700 text-sm mt-1">
                      Create an account afterwards for unlimited access and advanced features.
                    </p>
                  </div>
                )}

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 hover:border-green-400 transition-colors">
                  <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Your Crop Photo</h3>
                  <p className="text-gray-600 mb-6">
                    Take a clear photo of affected leaves, stems, or fruits for best results
                  </p>
                  <label className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                    <Upload className="w-5 h-5 mr-2" />
                    Choose Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <div className="mt-8 grid md:grid-cols-3 gap-6 text-left">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">📱 Best Photo Tips</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Good lighting (natural preferred)</li>
                      <li>• Focus on affected areas</li>
                      <li>• Include some healthy parts for comparison</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">🔍 What We Analyze</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Disease identification</li>
                      <li>• Pest damage assessment</li>
                      <li>• Nutrient deficiencies</li>
                    </ul>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">⚡ Instant Results</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• AI-powered diagnosis</li>
                      <li>• Treatment recommendations</li>
                      <li>• Prevention strategies</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              /* Analysis Section */
              <div className="space-y-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="lg:w-1/2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Uploaded Image</h3>
                    <div className="relative">
                      <Image
                        src={uploadedImage}
                        alt="Uploaded crop"
                        width={400}
                        height={256}
                        className="w-full h-64 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={resetDemo}
                        className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    
                    {!result && (
                      <button
                        onClick={analyzeImage}
                        disabled={isAnalyzing}
                        className="w-full mt-4 flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Camera className="w-5 h-5 mr-2" />
                            Analyze Image
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Results */}
                  <div className="lg:w-1/2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Analysis Results</h3>
                    
                    {isAnalyzing && (
                      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-3" />
                          <p className="text-gray-600">Analyzing your crop image...</p>
                          <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                        <div>
                          <p className="text-red-800 font-medium">Analysis Failed</p>
                          <p className="text-red-700 text-sm">{error}</p>
                        </div>
                      </div>
                    )}

                    {result && (
                      <div className="space-y-4">
                        {/* Disease Status */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                            <h4 className="font-semibold text-gray-900">Diagnosis</h4>
                          </div>
                          <p className="text-lg font-medium text-gray-800">{result.disease}</p>
                          <div className="mt-2">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Confidence Level</span>
                              <span>{result.confidence}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${result.confidence}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-900 mb-2">Description</h4>
                          <p className="text-blue-800 text-sm">{result.description}</p>
                        </div>

                        {/* Treatment */}
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="font-semibold text-green-900 mb-2">Recommended Treatment</h4>
                          <p className="text-green-800 text-sm">{result.treatment}</p>
                        </div>

                        {/* Prevention */}
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <h4 className="font-semibold text-purple-900 mb-2">Prevention Measures</h4>
                          <p className="text-purple-800 text-sm">{result.prevention}</p>
                        </div>

                        {!isAuthenticated && (
                          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <h4 className="font-semibold text-orange-900 mb-2">💡 Want to save this analysis?</h4>
                            <p className="text-orange-800 text-sm mb-3">
                              Create a free account to save your results and get unlimited analyses!
                            </p>
                            <button
                              onClick={() => setShowAuthModal(true)}
                              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                            >
                              Sign Up Free
                            </button>
                          </div>
                        )}

                        <button
                          onClick={resetDemo}
                          className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          {isAuthenticated ? 'Analyze Another Image' : 'Try Another Demo'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
            <p className="text-sm text-gray-600 text-center">
              🤖 Powered by Gemini AI • {isAuthenticated ? 'Unlimited access' : 'Experience the power of AI agriculture'}
            </p>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}
