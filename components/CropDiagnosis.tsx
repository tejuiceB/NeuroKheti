"use client";

import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Loader2, CheckCircle, AlertTriangle, Lightbulb, Globe } from 'lucide-react';
import Image from 'next/image';

interface DiagnosisResult {
  disease: string;
  confidence: number;
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  symptoms: string[];
  causes: string[];
  treatments: string[];
  prevention: string[];
  localRemedies: string[];
}

interface CropDiagnosisProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' }
];

export default function CropDiagnosis({ isOpen, onClose }: CropDiagnosisProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DiagnosisResult | null>(null);
  const [translatedResult, setTranslatedResult] = useState<DiagnosisResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isCameraSupported, setIsCameraSupported] = useState(false);
  const [isUsingCamera, setIsUsingCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Check if camera is supported on mount (client-side only)
    if (typeof window !== 'undefined') {
      const checkCameraSupport = () => {
        return !!(
          navigator.mediaDevices &&
          navigator.mediaDevices.getUserMedia &&
          typeof navigator.mediaDevices.getUserMedia === 'function'
        );
      };
      setIsCameraSupported(checkCameraSupport());
    }
  }, []);

  // Enhanced cleanup camera stream when component unmounts or modal closes
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Camera track stopped:', track.kind);
        });
      }
    };
  }, [stream]);

  useEffect(() => {
    // Cleanup when modal closes
    if (!isOpen) {
      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // Stop camera if active
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
        setIsUsingCamera(false);
      }
      
      // Reset analysis state
      setIsAnalyzing(false);
      setIsTranslating(false);
      setError(null);
    }
  }, [isOpen, stream]);

  const startCamera = async () => {
    // Enhanced safety checks
    if (typeof window === 'undefined') {
      setError('Camera access is not available on the server.');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera access is not supported in your browser. Please use Chrome, Firefox, or Safari.');
      return;
    }

    // Check for HTTPS requirement (except localhost)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setError('Camera access requires HTTPS. Please use HTTPS or localhost for development.');
      return;
    }

    try {
      setError(null);
      setIsUsingCamera(true);

      // Enhanced camera constraints for better mobile support
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Prefer back camera
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          aspectRatio: { ideal: 16/9 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: false // Don't request audio for camera
      };

      console.log('Requesting camera with constraints:', constraints);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream obtained:', mediaStream);
      
      // Verify stream has video tracks
      const videoTracks = mediaStream.getVideoTracks();
      if (videoTracks.length === 0) {
        throw new Error('No video tracks found in stream');
      }

      console.log('Video tracks:', videoTracks);
      setStream(mediaStream);
      
      // Enhanced video element setup
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Clear any existing src
        video.srcObject = null;
        
        // Set up event listeners before setting srcObject
        video.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          video.play().catch(e => {
            console.error('Video play failed:', e);
            setError('Failed to start video playback');
          });
        };

        video.oncanplay = () => {
          console.log('Video can play');
        };

        video.onerror = (e) => {
          console.error('Video error:', e);
          setError('Video playback error occurred');
        };

        // Set the stream
        video.srcObject = mediaStream;
        
        // Additional attributes for better mobile support
        video.setAttribute('playsinline', 'true');
        video.setAttribute('muted', 'true');
        video.setAttribute('autoplay', 'true');
        
        // Force play
        setTimeout(() => {
          if (video.paused) {
            video.play().catch(e => {
              console.error('Delayed video play failed:', e);
            });
          }
        }, 100);
      } else {
        console.error('Video ref not available');
        throw new Error('Video element not available');
      }
      
    } catch (error: unknown) {
      console.error('Error accessing camera:', error);
      setIsUsingCamera(false);
      
      let errorMessage = 'Unable to access camera. ';
      
      if (error instanceof DOMException || (error && typeof error === 'object' && 'name' in error)) {
        const errorName = error instanceof DOMException ? error.name : (error as { name: string }).name;
        
        if (errorName === 'NotAllowedError') {
          errorMessage += 'Please allow camera permissions. Click the camera icon in your browser address bar and select "Allow".';
        } else if (errorName === 'NotFoundError') {
          errorMessage += 'No camera found on this device. Please ensure a camera is connected.';
        } else if (errorName === 'NotSupportedError') {
          errorMessage += 'Camera is not supported in this browser. Please try Chrome, Firefox, or Safari.';
        } else if (errorName === 'OverconstrainedError') {
          errorMessage += 'Camera constraints cannot be satisfied. Please try with a different camera.';
        } else if (errorName === 'SecurityError') {
          errorMessage += 'Camera access blocked for security reasons. Please ensure you are using HTTPS.';
        } else if (errorName === 'NotReadableError') {
          errorMessage += 'Camera is being used by another application. Please close other camera apps.';
        } else {
          const message = error instanceof Error ? error.message : 'Unknown error occurred';
          errorMessage += `Error: ${message}. Please check permissions and try again.`;
        }
      } else {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        errorMessage += `Error: ${message}. Please check permissions and try again.`;
      }
      
      setError(errorMessage);
    }
  };

  const stopCamera = () => {
    console.log('Stopping camera...');
    
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind, track.label);
      });
      setStream(null);
    }
    
    setIsUsingCamera(false);
    
    if (videoRef.current) {
      const video = videoRef.current;
      video.srcObject = null;
      video.load(); // Reset video element
    }
    
    setError(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Video or canvas element not available');
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      setError('Canvas context not available');
      return;
    }

    try {
      // Check if video is actually playing
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setError('Camera feed not ready. Please wait a moment and try again.');
        return;
      }

      console.log('Capturing photo from video:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState
      });

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob and create file
      canvas.toBlob((blob) => {
        if (blob) {
          const timestamp = Date.now();
          const file = new File([blob], `crop-photo-${timestamp}.jpg`, { 
            type: 'image/jpeg',
            lastModified: timestamp
          });
          
          setSelectedImage(file);
          setImagePreview(canvas.toDataURL('image/jpeg', 0.8));
          stopCamera();
          setError(null);
          
          console.log('Photo captured successfully:', {
            size: blob.size,
            type: blob.type
          });
        } else {
          setError('Failed to capture photo. Please try again.');
        }
      }, 'image/jpeg', 0.8);
      
    } catch (error) {
      console.error('Error capturing photo:', error);
      setError('Failed to capture photo. Please try again.');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        setError(null);
      } else {
        setError('Please select a valid image file.');
      }
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];

          // Call Gemini API for analysis with cancellation support
          const response = await fetch('/api/analyze-crop', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64Data,
              mimeType: selectedImage.type,
              language: selectedLanguage
            }),
            signal: abortControllerRef.current?.signal
          });

          if (!response.ok) {
            throw new Error('Analysis failed');
          }

          const result = await response.json();
          
          // Check if request was cancelled
          if (abortControllerRef.current?.signal.aborted) {
            return;
          }
          
          setAnalysisResult(result);
          setTranslatedResult(result);
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.log('Analysis cancelled');
            return;
          }
          console.error('Analysis error:', error);
          setError('Failed to analyze image. Please try again.');
        } finally {
          if (!abortControllerRef.current?.signal.aborted) {
            setIsAnalyzing(false);
          }
          abortControllerRef.current = null;
        }
      };
      
      reader.readAsDataURL(selectedImage);
    } catch (error) {
      console.error('Analysis error:', error);
      setError('Failed to analyze image. Please try again.');
      setIsAnalyzing(false);
      abortControllerRef.current = null;
    }
  };

  const translateResults = async (targetLanguage: string) => {
    if (!analysisResult || targetLanguage === 'en') {
      setTranslatedResult(analysisResult);
      return;
    }

    setIsTranslating(true);
    
    // Create new abort controller for translation request
    const translationController = new AbortController();
    
    try {
      const response = await fetch('/api/translate-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          result: analysisResult,
          targetLanguage
        }),
        signal: translationController.signal
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const translated = await response.json();
      
      // Check if request was cancelled
      if (translationController.signal.aborted) {
        return;
      }
      
      setTranslatedResult(translated);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Translation cancelled');
        return;
      }
      console.error('Translation error:', error);
      setError('Failed to translate results. Showing in English.');
      setTranslatedResult(analysisResult);
    } finally {
      if (!translationController.signal.aborted) {
        setIsTranslating(false);
      }
    }
  };

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    if (analysisResult) {
      translateResults(languageCode);
    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setTranslatedResult(null);
    setError(null);
    setSelectedLanguage('en');
    stopCamera();
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // Cancel ongoing requests before closing
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      onClose();
      resetAnalysis();
    }
  };

  if (!isOpen) return null;

  const currentResult = translatedResult || analysisResult;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-50 p-4"
      onClick={handleBackgroundClick}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Instant Crop Diagnosis</h2>
              <p className="text-gray-600 mt-1">AI-powered plant disease identification and treatment recommendations</p>
            </div>
            
            {/* Language Selector */}
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-gray-500" />
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isTranslating}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName}
                  </option>
                ))}
              </select>
              {isTranslating && (
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
              )}
            </div>
          </div>
          
          <button
            onClick={() => { onClose(); resetAnalysis(); }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {!selectedImage && !isUsingCamera && (
            /* Upload Section */
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 hover:border-green-400 transition-colors">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Capture or Upload Plant Photo</h3>
                <p className="text-gray-600 mb-6">
                  Take a clear photo of affected leaves, stems, or fruits for accurate diagnosis
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {isCameraSupported ? (
                    <button
                      onClick={startCamera}
                      className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Use Camera
                    </button>
                  ) : (
                    <div className="text-center">
                      <button
                        disabled
                        className="inline-flex items-center px-6 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                      >
                        <Camera className="w-5 h-5 mr-2" />
                        Camera Not Available
                      </button>
                      <p className="text-xs text-gray-500 mt-1">Use upload option instead</p>
                    </div>
                  )}
                  
                  <label className="inline-flex items-center px-6 py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors cursor-pointer">
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Photo
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              
              {/* Tips */}
              <div className="mt-8 grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">📷 Photo Tips</h4>
                  <ul className="text-blue-700 space-y-1">
                    <li>• Use natural lighting</li>
                    <li>• Focus on affected areas</li>
                    <li>• Include surrounding healthy parts</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">🌱 Best Results</h4>
                  <ul className="text-green-700 space-y-1">
                    <li>• Clear, high-resolution images</li>
                    <li>• Multiple angles if needed</li>
                    <li>• Close-up of symptoms</li>
                  </ul>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-2">⚡ AI Analysis</h4>
                  <ul className="text-orange-700 space-y-1">
                    <li>• Powered by Gemini AI</li>
                    <li>• 95% accuracy rate</li>
                    <li>• Results in seconds</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {isUsingCamera && (
            /* Enhanced Camera Section */
            <div className="text-center">
              <div className="relative inline-block bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="max-w-full max-h-[500px] rounded-lg"
                  style={{ 
                    minHeight: '300px',
                    backgroundColor: '#000',
                    objectFit: 'cover'
                  }}
                />
                
                {/* Loading overlay */}
                {!stream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p>Starting camera...</p>
                    </div>
                  </div>
                )}
                
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Camera overlay for better UX */}
                <div className="absolute inset-0 border-2 border-green-400 rounded-lg pointer-events-none">
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-green-400"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-green-400"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-green-400"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-green-400"></div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 mt-4">
                Position the affected plant area within the frame for best results
              </p>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={capturePhoto}
                  disabled={!stream}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center text-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Camera className="w-6 h-6 mr-2" />
                  Capture Photo
                </button>
                <button
                  onClick={stopCamera}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {selectedImage && !analysisResult && (
            /* Preview and Analyze Section */
            <div className="text-center">
              <div className="mb-6">
                <Image
                  src={imagePreview!}
                  alt="Selected crop"
                  width={256}
                  height={256}
                  className="max-w-full max-h-64 mx-auto rounded-lg shadow-lg object-contain"
                />
              </div>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className={`px-8 py-3 rounded-lg transition-all duration-200 flex items-center font-semibold text-lg min-w-[200px] justify-center ${
                    isAnalyzing
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span>Analyze Crop</span>
                    </>
                  )}
                </button>
                <button
                  onClick={resetAnalysis}
                  disabled={isAnalyzing}
                  className={`border border-gray-300 text-gray-700 px-6 py-3 rounded-lg transition-colors ${
                    isAnalyzing
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  Choose Different Photo
                </button>
              </div>

              {/* Progress indicator during analysis */}
              {isAnalyzing && (
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-blue-900">AI Analysis in Progress</h4>
                      <p className="text-blue-700 text-sm">Processing your crop image with advanced AI models...</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-sm text-blue-800">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>Scanning image for plant diseases and pests</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-blue-800">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <span>Analyzing symptoms and patterns</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-blue-800">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      <span>Generating treatment recommendations</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-white rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <span className="flex items-center space-x-1">
                        <span>🤖</span>
                        <span>Powered by Gemini AI</span>
                      </span>
                      <span className="mx-2">•</span>
                      <span className="flex items-center space-x-1">
                        <span>🎯</span>
                        <span>95% Accuracy</span>
                      </span>
                      <span className="mx-2">•</span>
                      <span className="flex items-center space-x-1">
                        <span>⚡</span>
                        <span>Results in seconds</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentResult && (
            /* Results Section with Language Support */
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Image
                  src={imagePreview!}
                  alt="Analyzed crop"
                  width={128}
                  height={128}
                  className="w-32 h-32 object-cover rounded-lg shadow-lg"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className={`w-6 h-6 ${
                      currentResult.severity === 'High' ? 'text-red-500' :
                      currentResult.severity === 'Medium' ? 'text-yellow-500' : 'text-green-500'
                    }`} />
                    <h3 className="text-xl font-bold text-gray-900">{currentResult.disease}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      currentResult.severity === 'High' ? 'bg-red-100 text-red-800' :
                      currentResult.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {currentResult.severity} Severity
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{currentResult.description}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{currentResult.confidence}% confidence</span>
                    {selectedLanguage !== 'en' && (
                      <>
                        <span className="mx-2">•</span>
                        <Globe className="w-4 h-4 text-blue-500" />
                        <span className="text-blue-600">
                          {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.nativeName}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Language Selection Quick Buttons */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Language Switch:</h4>
                <div className="flex flex-wrap gap-2">
                  {SUPPORTED_LANGUAGES.slice(0, 6).map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        selectedLanguage === lang.code
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-green-50 border border-gray-200'
                      }`}
                      disabled={isTranslating}
                    >
                      {lang.nativeName}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-red-50 rounded-lg p-6">
                  <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    {selectedLanguage === 'hi' ? 'लक्षण और कारण' :
                     selectedLanguage === 'kn' ? 'ಲಕ್ಷಣಗಳು ಮತ್ತು ಕಾರಣಗಳು' :
                     selectedLanguage === 'te' ? 'లక్షణాలు మరియు కారణాలు' :
                     selectedLanguage === 'ta' ? 'அறிகுறிகள் மற்றும் காரணங்கள்' :
                     'Symptoms & Causes'}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-1">
                        {selectedLanguage === 'hi' ? 'देखे गए लक्षण:' :
                         selectedLanguage === 'kn' ? 'ಕಂಡುಬರುವ ಲಕ್ಷಣಗಳು:' :
                         selectedLanguage === 'te' ? 'కనిపించే లక్షణాలు:' :
                         selectedLanguage === 'ta' ? 'காணப்படும் அறிகுறிகள்:' :
                         'Observed Symptoms:'}
                      </p>
                      <ul className="text-sm text-red-600 space-y-1">
                        {currentResult.symptoms.map((symptom, index) => (
                          <li key={index}>• {symptom}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-1">
                        {selectedLanguage === 'hi' ? 'संभावित कारण:' :
                         selectedLanguage === 'kn' ? 'ಸಂಭವನೀಯ ಕಾರಣಗಳು:' :
                         selectedLanguage === 'te' ? 'సంభావ్య కారణాలు:' :
                         selectedLanguage === 'ta' ? 'சாத்தியமான காரணங்கள்:' :
                         'Possible Causes:'}
                      </p>
                      <ul className="text-sm text-red-600 space-y-1">
                        {currentResult.causes.map((cause, index) => (
                          <li key={index}>• {cause}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    {selectedLanguage === 'hi' ? 'उपचार और रोकथाम' :
                     selectedLanguage === 'kn' ? 'ಚಿಕಿತ್ಸೆ ಮತ್ತು ತಡೆಗಟ್ಟುವಿಕೆ' :
                     selectedLanguage === 'te' ? 'చికిత్స మరియు నివారణ' :
                     selectedLanguage === 'ta' ? 'சிகிச்சை மற்றும் தடுப்பு' :
                     'Treatment & Prevention'}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-green-700 mb-1">
                        {selectedLanguage === 'hi' ? 'सुझाए गए उपचार:' :
                         selectedLanguage === 'kn' ? 'ಶಿಫಾರಸು ಮಾಡಿದ ಚಿಕಿತ್ಸೆಗಳು:' :
                         selectedLanguage === 'te' ? 'సిఫార్సు చేయబడిన చికిత్సలు:' :
                         selectedLanguage === 'ta' ? 'பரிந்துரைக்கப்பட்ட சிகிச்சைகள்:' :
                         'Recommended Treatments:'}
                      </p>
                      <ul className="text-sm text-green-600 space-y-1">
                        {currentResult.treatments.map((treatment, index) => (
                          <li key={index}>• {treatment}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-700 mb-1">
                        {selectedLanguage === 'hi' ? 'रोकथाम के तरीके:' :
                         selectedLanguage === 'kn' ? 'ತಡೆಗಟ್ಟುವ ವಿಧಾನಗಳು:' :
                         selectedLanguage === 'te' ? 'నివారణ పద్ధతులు:' :
                         selectedLanguage === 'ta' ? 'தடுப்பு முறைகள்:' :
                         'Prevention Methods:'}
                      </p>
                      <ul className="text-sm text-green-600 space-y-1">
                        {currentResult.prevention.map((method, index) => (
                          <li key={index}>• {method}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                  🌿 {selectedLanguage === 'hi' ? 'स्थानीय और जैविक उपचार' :
                      selectedLanguage === 'kn' ? 'ಸ್ಥಳೀಯ ಮತ್ತು ಸಾವಯವ ಪರಿಹಾರಗಳು' :
                      selectedLanguage === 'te' ? 'స్థానిక మరియు సేంద్రీయ పరిష్కారాలు' :
                      selectedLanguage === 'ta' ? 'உள்ளூர் மற்றும் இயற்கை தீர்வுகள்' :
                      'Local & Organic Remedies'}
                </h4>
                <ul className="text-sm text-blue-600 space-y-1">
                  {currentResult.localRemedies.map((remedy, index) => (
                    <li key={index}>• {remedy}</li>
                  ))}
                </ul>
              </div>

              {/* Voice Pronunciation (for non-English languages) */}
              {selectedLanguage !== 'en' && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🔊</span>
                    <h5 className="font-semibold text-purple-800">
                      {selectedLanguage === 'hi' ? 'आवाज़ में सुनें' :
                       selectedLanguage === 'kn' ? 'ಧ್ವನಿಯಲ್ಲಿ ಕೇಳಿ' :
                       selectedLanguage === 'te' ? 'వాయిస్‌లో వినండి' :
                       selectedLanguage === 'ta' ? 'குரலில் கேளுங்கள்' :
                       'Listen in Voice'}
                    </h5>
                  </div>
                  <button
                    onClick={() => {
                      if ('speechSynthesis' in window) {
                        const utterance = new SpeechSynthesisUtterance(
                          `${currentResult.disease}. ${currentResult.description}`
                        );
                        utterance.lang = selectedLanguage;
                        speechSynthesis.speak(utterance);
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm"
                  >
                    <span>🎵</span>
                    {selectedLanguage === 'hi' ? 'मुख्य परिणाम सुनें' :
                     selectedLanguage === 'kn' ? 'ಮುಖ್ಯ ಫಲಿತಾಂಶವನ್ನು ಕೇಳಿ' :
                     selectedLanguage === 'te' ? 'ప్రధాన ఫలితాన్ని వినండి' :
                     selectedLanguage === 'ta' ? 'முக்கிய முடிவைக் கேளுங்கள்' :
                     'Listen to Key Results'}
                  </button>
                </div>
              )}

              <div className="flex gap-4 justify-center pt-4">
                <button
                  onClick={resetAnalysis}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  {selectedLanguage === 'hi' ? 'दूसरी तस्वीर का विश्लेषण करें' :
                   selectedLanguage === 'kn' ? 'ಇನ್ನೊಂದು ಚಿತ್ರವನ್ನು ವಿಶ್ಲೇಷಿಸಿ' :
                   selectedLanguage === 'te' ? 'మరొక చిత్రాన్ని విశ్లేషించండి' :
                   selectedLanguage === 'ta' ? 'மற்றொரு படத்தை பகுப்பாய்வு செய்யவும்' :
                   'Analyze Another Photo'}
                </button>
                <button
                  onClick={() => window.print()}
                  className="border border-green-600 text-green-600 px-6 py-2 rounded-lg hover:bg-green-50 transition-colors"
                >
                  {selectedLanguage === 'hi' ? 'परिणाम सहेजें' :
                   selectedLanguage === 'kn' ? 'ಫಲಿತಾಂಶಗಳನ್ನು ಉಳಿಸಿ' :
                   selectedLanguage === 'te' ? 'ఫలితాలను సేవ్ చేయండి' :
                   selectedLanguage === 'ta' ? 'முடிவுகளை சேமிக்கவும்' :
                   'Save Results'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm font-medium">{error}</p>
              {error.includes('camera') && (
                <div className="mt-2 text-xs text-red-500">
                  <p className="font-medium">Troubleshooting tips:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Ensure camera permissions are granted in your browser</li>
                    <li>Try refreshing the page and allowing camera access</li>
                    <li>Check if another application is using the camera</li>
                    <li>For mobile devices, try switching between front and back cameras</li>
                    <li>Use HTTPS or localhost for camera access</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
