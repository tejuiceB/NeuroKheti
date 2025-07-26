import { NextRequest, NextResponse } from 'next/server';

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

// Demo market data for 15+ crops
const DEMO_MARKET_DATA: MarketData[] = [
  {
    crop: 'Tomato',
    currentPrice: 45,
    previousPrice: 40,
    change: 5,
    changePercent: 12.5,
    trend: 'up',
    unit: '₹/kg',
    market: 'Azadpur Mandi, Delhi',
    lastUpdated: new Date().toISOString(),
    weeklyHigh: 48,
    weeklyLow: 38,
    monthlyAverage: 42,
    demandLevel: 'High',
    season: 'Peak',
    recommendation: 'Excellent time to sell. Prices expected to remain high for next 3-4 days.',
    nextMarketDay: 'Tomorrow'
  },
  {
    crop: 'Onion',
    currentPrice: 25,
    previousPrice: 28,
    change: -3,
    changePercent: -10.7,
    trend: 'down',
    unit: '₹/kg',
    market: 'Lasalgaon Mandi, Maharashtra',
    lastUpdated: new Date().toISOString(),
    weeklyHigh: 30,
    weeklyLow: 24,
    monthlyAverage: 27,
    demandLevel: 'Medium',
    season: 'Moderate',
    recommendation: 'Wait for 2-3 days. Prices may stabilize around ₹27-28/kg.',
    nextMarketDay: 'Tomorrow'
  },
  {
    crop: 'Potato',
    currentPrice: 18,
    previousPrice: 18,
    change: 0,
    changePercent: 0,
    trend: 'stable',
    unit: '₹/kg',
    market: 'Agra Mandi, Uttar Pradesh',
    lastUpdated: new Date().toISOString(),
    weeklyHigh: 20,
    weeklyLow: 17,
    monthlyAverage: 18.5,
    demandLevel: 'Medium',
    season: 'Moderate',
    recommendation: 'Stable market. Good time for steady sales.',
    nextMarketDay: 'Tomorrow'
  },
  {
    crop: 'Wheat',
    currentPrice: 2150,
    previousPrice: 2100,
    change: 50,
    changePercent: 2.4,
    trend: 'up',
    unit: '₹/quintal',
    market: 'Khanna Mandi, Punjab',
    lastUpdated: new Date().toISOString(),
    weeklyHigh: 2180,
    weeklyLow: 2080,
    monthlyAverage: 2120,
    demandLevel: 'High',
    season: 'Peak',
    recommendation: 'Good buying by government agencies. Sell now for best rates.',
    nextMarketDay: 'Monday'
  },
  {
    crop: 'Rice',
    currentPrice: 2800,
    previousPrice: 2750,
    change: 50,
    changePercent: 1.8,
    trend: 'up',
    unit: '₹/quintal',
    market: 'Karnal Mandi, Haryana',
    lastUpdated: new Date().toISOString(),
    weeklyHigh: 2850,
    weeklyLow: 2700,
    monthlyAverage: 2775,
    demandLevel: 'High',
    season: 'Peak',
    recommendation: 'Strong export demand. Ideal selling window.',
    nextMarketDay: 'Monday'
  },
  {
    crop: 'Soybean',
    currentPrice: 4500,
    previousPrice: 4350,
    change: 150,
    changePercent: 3.4,
    trend: 'up',
    unit: '₹/quintal',
    market: 'Indore Mandi, Madhya Pradesh',
    lastUpdated: new Date().toISOString(),
    weeklyHigh: 4600,
    weeklyLow: 4200,
    monthlyAverage: 4400,
    demandLevel: 'High',
    season: 'Peak',
    recommendation: 'Oil companies actively buying. Excellent rates available.',
    nextMarketDay: 'Tomorrow'
  },
  {
    crop: 'Cotton',
    currentPrice: 5500,
    previousPrice: 5400,
    change: 100,
    changePercent: 1.9,
    trend: 'up',
    unit: '₹/quintal',
    market: 'Rajkot Mandi, Gujarat',
    lastUpdated: new Date().toISOString(),
    weeklyHigh: 5650,
    weeklyLow: 5300,
    monthlyAverage: 5475,
    demandLevel: 'Medium',
    season: 'Moderate',
    recommendation: 'Textile demand improving. Gradual price increase expected.',
    nextMarketDay: 'Tomorrow'
  },
  {
    crop: 'Sugarcane',
    currentPrice: 350,
    previousPrice: 340,
    change: 10,
    changePercent: 2.9,
    trend: 'up',
    unit: '₹/quintal',
    market: 'Muzaffarnagar Mandi, UP',
    lastUpdated: new Date().toISOString(),
    weeklyHigh: 360,
    weeklyLow: 330,
    monthlyAverage: 345,
    demandLevel: 'High',
    season: 'Peak',
    recommendation: 'Sugar mills paying promptly. Good crushing season.',
    nextMarketDay: 'Tomorrow'
  },
  {
    crop: 'Maize',
    currentPrice: 2000,
    previousPrice: 1950,
    change: 50,
    changePercent: 2.6,
    trend: 'up',
    unit: '₹/quintal',
    market: 'Davangere Mandi, Karnataka',
    lastUpdated: new Date().toISOString(),
    weeklyHigh: 2050,
    weeklyLow: 1900,
    monthlyAverage: 1975,
    demandLevel: 'Medium',
    season: 'Moderate',
    recommendation: 'Poultry feed demand strong. Steady growth expected.',
    nextMarketDay: 'Tomorrow'
  },
  {
    crop: 'Turmeric',
    currentPrice: 12000,
    previousPrice: 11500,
    change: 500,
    changePercent: 4.3,
    trend: 'up',
    unit: '₹/quintal',
    market: 'Erode Mandi, Tamil Nadu',
    lastUpdated: new Date().toISOString(),
    weeklyHigh: 12200,
    weeklyLow: 11000,
    monthlyAverage: 11600,
    demandLevel: 'High',
    season: 'Peak',
    recommendation: 'Export orders increasing. Premium quality fetching best rates.',
    nextMarketDay: 'Tomorrow'
  },
  {
    crop: 'Chilli',
    currentPrice: 15000,
    previousPrice: 14500,
    change: 500,
    changePercent: 3.4,
    trend: 'up',
    unit: '₹/quintal',
    market: 'Guntur Mandi, Andhra Pradesh',
    lastUpdated: new Date().toISOString(),
    weeklyHigh: 15500,
    weeklyLow: 14000,
    monthlyAverage: 14750,
    demandLevel: 'High',
    season: 'Peak',
    recommendation: 'Spice exporters active. Quality chilli in high demand.',
    nextMarketDay: 'Tomorrow'
  },
  {
    crop: 'Garlic',
    currentPrice: 8000,
    previousPrice: 7800,
    change: 200,
    changePercent: 2.6,
    trend: 'up',
    unit: '₹/quintal',
    market: 'Indore Mandi, Madhya Pradesh',
    lastUpdated: new Date().toISOString(),
    weeklyHigh: 8200,
    weeklyLow: 7500,
    monthlyAverage: 7850,
    demandLevel: 'Medium',
    season: 'Moderate',
    recommendation: 'Steady demand from urban markets. Store properly for better rates.',
    nextMarketDay: 'Tomorrow'
  },
  {
    crop: 'Ginger',
    currentPrice: 9500,
    previousPrice: 9200,
    change: 300,
    changePercent: 3.3,
    trend: 'up',
    unit: '₹/quintal',
    market: 'Kochi Mandi, Kerala',
    lastUpdated: new Date().toISOString(),
    weeklyHigh: 9800,
    weeklyLow: 8900,
    monthlyAverage: 9350,
    demandLevel: 'High',
    season: 'Peak',
    recommendation: 'Fresh ginger in demand. Export opportunities available.',
    nextMarketDay: 'Tomorrow'
  },
  {
    crop: 'Cabbage',
    currentPrice: 12,
    previousPrice: 15,
    change: -3,
    changePercent: -20,
    trend: 'down',
    unit: '₹/kg',
    market: 'Bangalore Mandi, Karnataka',
    lastUpdated: new Date().toISOString(),
    weeklyHigh: 18,
    weeklyLow: 12,
    monthlyAverage: 15,
    demandLevel: 'Low',
    season: 'Off-Season',
    recommendation: 'Oversupply situation. Consider processing or wait for demand recovery.',
    nextMarketDay: 'Tomorrow'
  },
  {
    crop: 'Cauliflower',
    currentPrice: 20,
    previousPrice: 18,
    change: 2,
    changePercent: 11.1,
    trend: 'up',
    unit: '₹/kg',
    market: 'Delhi Mandi, Delhi',
    lastUpdated: new Date().toISOString(),
    weeklyHigh: 22,
    weeklyLow: 16,
    monthlyAverage: 19,
    demandLevel: 'Medium',
    season: 'Moderate',
    recommendation: 'Winter demand picking up. Good time to sell quality produce.',
    nextMarketDay: 'Tomorrow'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const crop = searchParams.get('crop');

    // Add random variations to simulate real-time changes
    const simulatedData = DEMO_MARKET_DATA.map(item => ({
      ...item,
      currentPrice: item.currentPrice + (Math.random() - 0.5) * (item.currentPrice * 0.02), // ±1% variation
      lastUpdated: new Date().toISOString()
    }));

    if (crop) {
      const filteredData = simulatedData.filter(item => 
        item.crop.toLowerCase().includes(crop.toLowerCase())
      );
      return NextResponse.json(filteredData);
    }

    // Return all market data
    return NextResponse.json({
      success: true,
      data: simulatedData,
      timestamp: new Date().toISOString(),
      totalCrops: simulatedData.length,
      marketStatus: 'Open',
      lastUpdate: 'Real-time'
    });

  } catch (error) {
    console.error('Market analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { crops = [], location } = await request.json();

    // Filter data based on requested crops
    const filteredData = DEMO_MARKET_DATA.filter(item =>
      crops.length === 0 || crops.some((crop: string) => 
        item.crop.toLowerCase().includes(crop.toLowerCase())
      )
    );

    // Add location-specific adjustments if provided
    if (location) {
      // Simulate location-based price variations
      const locationMultiplier = getLocationMultiplier(location);
      filteredData.forEach(item => {
        item.currentPrice = Math.round(item.currentPrice * locationMultiplier);
        item.previousPrice = Math.round(item.previousPrice * locationMultiplier);
        item.weeklyHigh = Math.round(item.weeklyHigh * locationMultiplier);
        item.weeklyLow = Math.round(item.weeklyLow * locationMultiplier);
        item.monthlyAverage = Math.round(item.monthlyAverage * locationMultiplier);
      });
    }

    return NextResponse.json({
      success: true,
      data: filteredData,
      location: location || 'All Markets',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Market analysis POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process market analysis request' },
      { status: 500 }
    );
  }
}

function getLocationMultiplier(location: string): number {
  const locationMultipliers: Record<string, number> = {
    'delhi': 1.1,
    'mumbai': 1.15,
    'bangalore': 1.05,
    'chennai': 1.08,
    'kolkata': 1.02,
    'hyderabad': 1.06,
    'pune': 1.07,
    'ahmedabad': 1.04,
    'surat': 1.03,
    'jaipur': 0.98,
    'lucknow': 0.96,
    'kanpur': 0.95,
    'nagpur': 0.97,
    'indore': 0.98,
    'bhopal': 0.97,
    'visakhapatnam': 1.01,
    'vadodara': 1.02,
    'ghaziabad': 1.08,
    'ludhiana': 0.99,
    'agra': 0.94
  };

  const locationKey = location.toLowerCase();
  return locationMultipliers[locationKey] || 1.0;
}
