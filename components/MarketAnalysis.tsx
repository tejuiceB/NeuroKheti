"use client";

import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Minus, RefreshCw, Search, MapPin, Calendar, BarChart3, AlertCircle, CheckCircle } from 'lucide-react';

interface MarketAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MarketData {
  crop: string;
  currentPrice: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
  market: string;
  lastUpdated: string;
  weeklyHigh: number;
  weeklyLow: number;
  monthlyAverage: number;
  demandLevel: 'High' | 'Medium' | 'Low';
  season: 'Peak' | 'Off-Season' | 'Moderate';
  recommendation: string;
  nextMarketDay: string;
}

export default function MarketAnalysis({ isOpen, onClose }: MarketAnalysisProps) {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [filteredData, setFilteredData] = useState<MarketData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'up' | 'down' | 'high-demand'>('all');
  const [selectedCrop, setSelectedCrop] = useState<MarketData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMarketData();
    }
  }, [isOpen]);

  useEffect(() => {
    filterData();
  }, [marketData, searchTerm, selectedFilter]);

  const fetchMarketData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/market-analysis');
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      
      const result = await response.json();
      setMarketData(result.data || []);
    } catch (error) {
      console.error('Error fetching market data:', error);
      setError('Failed to load market data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterData = () => {
    let filtered = marketData;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.crop.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.market.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply trend filter
    switch (selectedFilter) {
      case 'up':
        filtered = filtered.filter(item => item.trend === 'up');
        break;
      case 'down':
        filtered = filtered.filter(item => item.trend === 'down');
        break;
      case 'high-demand':
        filtered = filtered.filter(item => item.demandLevel === 'High');
        break;
      default:
        break;
    }

    setFilteredData(filtered);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'down':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'High':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Real-Time Market Analysis</h2>
              <p className="text-gray-600 mt-1">Live prices from major mandis across India</p>
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
          {/* Controls */}
          <div className="mb-6 space-y-4">
            {/* Search and Refresh */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search crops or markets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <button
                onClick={fetchMarketData}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:bg-gray-400"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Crops', icon: BarChart3 },
                { key: 'up', label: 'Price Rising', icon: TrendingUp },
                { key: 'down', label: 'Price Falling', icon: TrendingDown },
                { key: 'high-demand', label: 'High Demand', icon: AlertCircle }
              ].map((filter) => {
                const IconComponent = filter.icon;
                return (
                  <button
                    key={filter.key}
                    onClick={() => setSelectedFilter(filter.key as 'all' | 'up' | 'down' | 'high-demand')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                      selectedFilter === filter.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{filter.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Market Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 text-sm font-medium">Rising Prices</p>
                  <p className="text-2xl font-bold text-green-800">
                    {filteredData.filter(item => item.trend === 'up').length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-700 text-sm font-medium">Falling Prices</p>
                  <p className="text-2xl font-bold text-red-800">
                    {filteredData.filter(item => item.trend === 'down').length}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700 text-sm font-medium">High Demand</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {filteredData.filter(item => item.demandLevel === 'High').length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-700 text-sm font-medium">Total Markets</p>
                  <p className="text-2xl font-bold text-purple-800">{filteredData.length}</p>
                </div>
                <MapPin className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading market data...</p>
            </div>
          )}

          {/* Market Data Grid */}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredData.map((item, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedCrop(item)}
                  className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.crop}</h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {item.market}
                      </p>
                    </div>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getTrendColor(item.trend)}`}>
                      {getTrendIcon(item.trend)}
                      <span>{item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Current Price</span>
                      <span className="text-lg font-bold text-gray-900">
                        ₹{item.currentPrice.toFixed(0)}{item.unit.replace('₹', '')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Change</span>
                      <span className={`text-sm font-medium ${
                        item.change > 0 ? 'text-green-600' : item.change < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {item.change > 0 ? '+' : ''}₹{item.change.toFixed(0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Demand</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDemandColor(item.demandLevel)}`}>
                        {item.demandLevel}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Week: ₹{item.weeklyLow}-{item.weeklyHigh}</span>
                        <span>Avg: ₹{item.monthlyAverage}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading && !error && filteredData.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No markets found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Detailed Crop View Modal */}
        {selectedCrop && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{selectedCrop.crop} Market Details</h3>
                  <button
                    onClick={() => setSelectedCrop(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Current Price</p>
                      <p className="text-2xl font-bold text-gray-900">₹{selectedCrop.currentPrice.toFixed(0)}{selectedCrop.unit.replace('₹', '')}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Price Change</p>
                      <p className={`text-2xl font-bold ${
                        selectedCrop.change > 0 ? 'text-green-600' : selectedCrop.change < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {selectedCrop.change > 0 ? '+' : ''}₹{selectedCrop.change.toFixed(0)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-900">Market Recommendation</h4>
                    </div>
                    <p className="text-blue-800">{selectedCrop.recommendation}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Price Range (Week)</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">High:</span>
                          <span className="font-medium">₹{selectedCrop.weeklyHigh}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Low:</span>
                          <span className="font-medium">₹{selectedCrop.weeklyLow}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Average:</span>
                          <span className="font-medium">₹{selectedCrop.monthlyAverage}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Market Info</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Demand:</span>
                          <span className={`font-medium px-2 py-1 rounded text-xs ${getDemandColor(selectedCrop.demandLevel)}`}>
                            {selectedCrop.demandLevel}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Season:</span>
                          <span className="font-medium">{selectedCrop.season}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Next Market:</span>
                          <span className="font-medium">{selectedCrop.nextMarketDay}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        Last Updated: {new Date(selectedCrop.lastUpdated).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
