/* eslint-disable prefer-const */
import { NextRequest, NextResponse } from 'next/server';

interface CropData {
  crop_name: string;
  location: string;
  soil_type: string;
  water_source: string;
  land_size: string;
  start_date: string;
}

interface CropStep {
  id: string;
  title: string;
  description: string;
  scheduled_date: string;
  status: 'upcoming' | 'current';
  category: 'sowing' | 'fertilizer' | 'pesticide' | 'irrigation' | 'harvest' | 'market' | 'growth';
  materials?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { cropPlanId, cropData, userId } = await request.json();

    console.log('Generating crop plan for:', { cropPlanId, userId, cropData });

    if (!process.env.GEMINI_API_KEY) {
      console.error('Gemini API key not configured');
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 503 }
      );
    }

    if (!cropPlanId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Generate personalized crop plan using Gemini AI
    console.log('Generating AI plan...');
    const plan = await generateCropPlan(cropData);
    console.log('AI plan generated successfully with', plan.steps.length, 'steps');
    
    // For now, we'll return the generated plan without updating Firestore
    // The client will handle updating the document using the regular Firebase SDK
    console.log('Returning generated plan to client for storage');

    return NextResponse.json({
      success: true,
      plan: plan.steps,
      totalSteps: plan.steps.length,
      message: 'Crop plan generated successfully',
      cropPlanId: cropPlanId
    });

  } catch (error) {
    console.error('Error generating crop plan:', error);
    return NextResponse.json({
      error: `Failed to generate crop plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

async function generateCropPlan(cropData: CropData): Promise<{ steps: CropStep[] }> {
  const prompt = `Create a detailed, practical step-by-step crop cultivation plan for ${cropData.crop_name} farming in ${cropData.location}, India with these specific conditions:

📍 Location: ${cropData.location}
🌱 Crop: ${cropData.crop_name}
🏔️ Soil Type: ${cropData.soil_type}
💧 Water Source: ${cropData.water_source}
📏 Land Size: ${cropData.land_size}
📅 Start Date: ${cropData.start_date}

Generate 10-15 specific, actionable steps covering the complete crop lifecycle from land preparation to market sale. Include:

1. **Land Preparation & Sowing** (Days 0-7)
2. **Fertilizer Applications** with specific NPK ratios and local fertilizer names
3. **Irrigation Schedule** adapted to ${cropData.water_source}
4. **Pest & Disease Management** with timing and specific pesticide/fungicide names available in India
5. **Growth Monitoring** checkpoints
6. **Harvest Timing** based on crop maturity
7. **Post-Harvest Handling** and storage
8. **Market Selling Strategy** with optimal timing

For each step, provide:
- Exact timing (calculate specific dates from start date: ${cropData.start_date})
- Specific materials/chemicals with Indian brand names where relevant
- Detailed instructions for ${cropData.soil_type} soil and ${cropData.water_source} irrigation
- Quantities appropriate for ${cropData.land_size} farm size

Return ONLY a valid JSON object in this exact format:
{
  "steps": [
    {
      "title": "Clear step title",
      "description": "Detailed 2-3 sentence description with specific instructions",
      "category": "sowing|fertilizer|pesticide|irrigation|harvest|market|growth",
      "days_from_start": exact_number_of_days_from_start_date,
      "materials": ["Specific material/chemical names", "With quantities if applicable"]
    }
  ]
}

Focus on:
- Practical advice for Indian farming conditions
- Local availability of materials
- Cost-effective solutions
- Weather considerations for ${cropData.location}
- Traditional knowledge combined with modern practices

Generate 10-15 comprehensive steps covering the full crop cycle.`;

  try {
    console.log('Making API call to Gemini for crop plan generation...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 32,
            topP: 0.8,
            maxOutputTokens: 4096,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error(`Failed to generate plan from AI: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Gemini API response received successfully');
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid API response structure:', data);
      throw new Error('Invalid response structure from Gemini API');
    }
    
    const planText = data.candidates[0].content.parts[0].text;
    console.log('AI generated plan text length:', planText.length);
    
    // Extract JSON from response - improved parsing
    let jsonMatch = planText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      // Try to find JSON with different patterns
      jsonMatch = planText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonMatch[0] = jsonMatch[1];
      }
    }
    
    if (jsonMatch) {
      try {
        const aiPlan = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed AI plan with', aiPlan.steps?.length || 0, 'steps');
        
        if (!aiPlan.steps || !Array.isArray(aiPlan.steps)) {
          throw new Error('Invalid plan structure: missing steps array');
        }
        
        // Convert AI response to our format with proper date calculation
        const startDate = new Date(cropData.start_date);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const steps: CropStep[] = aiPlan.steps.map((step: any, index: number) => {
          const daysFromStart = step.days_from_start || (index * 7); // Fallback to weekly intervals
          const stepDate = new Date(startDate);
          stepDate.setDate(startDate.getDate() + daysFromStart);
          
          return {
            id: `step_${index + 1}`,
            title: step.title || `Step ${index + 1}`,
            description: step.description || 'No description provided',
            scheduled_date: stepDate.toISOString(),
            status: index === 0 ? 'current' as const : 'upcoming' as const,
            category: step.category || 'sowing',
            materials: Array.isArray(step.materials) ? step.materials : []
          };
        });

        console.log(`Generated ${steps.length} steps for crop plan`);
        return { steps };
        
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError);
        console.error('Raw JSON text (first 500 chars):', jsonMatch[0].substring(0, 500));
        throw new Error('Failed to parse AI-generated plan');
      }
    } else {
      console.log('No JSON found in AI response, using fallback plan');
      return generateFallbackPlan(cropData);
    }
  } catch (error) {
    console.error('AI plan generation failed:', error);
    console.log('Falling back to template-based plan');
    return generateFallbackPlan(cropData);
  }
}

function generateFallbackPlan(cropData: CropData): { steps: CropStep[] } {
  console.log('Generating enhanced fallback plan for:', cropData.crop_name);
  
  const startDate = new Date(cropData.start_date);
  const steps: CropStep[] = [];

  // Enhanced crop-specific plans
  if (cropData.crop_name === 'wheat') {
    const wheatSteps = [
      { title: 'Land Preparation', description: `Deep plowing of ${cropData.soil_type} soil to 20-25 cm depth. Remove weeds and level field for uniform ${cropData.water_source} irrigation.`, category: 'sowing', days: 0, materials: ['Tractor', 'Plough', 'Leveller'] },
      { title: 'Seed Treatment & Sowing', description: `Treat wheat seeds with fungicide. Sow certified variety (HD 2967/Raj 3765) with 100-125 kg/hectare seed rate using seed drill.`, category: 'sowing', days: 3, materials: ['Certified Wheat Seeds 100-125 kg/ha', 'Fungicide (Thiram)', 'Seed Drill'] },
      { title: 'Basal Fertilizer Application', description: `Apply DAP 125 kg/ha + MOP 50 kg/ha as basal dose before sowing. Mix well with soil.`, category: 'fertilizer', days: 2, materials: ['DAP 125 kg/ha', 'MOP 50 kg/ha'] },
      { title: 'First Irrigation', description: `Light irrigation after sowing using ${cropData.water_source} system. Ensure uniform water distribution.`, category: 'irrigation', days: 4, materials: ['Water', 'Drip irrigation equipment'] },
      { title: 'Weed Management', description: `Apply pre-emergence herbicide Pendimethalin 1 kg/ha within 3 days of sowing. Hand weeding at 30-35 days if needed.`, category: 'pesticide', days: 5, materials: ['Pendimethalin 1 kg/ha', 'Sprayer'] },
      { title: 'Crown Root Irrigation', description: `Critical irrigation at crown root initiation stage (20-25 days). Monitor soil moisture.`, category: 'irrigation', days: 22, materials: ['Water'] },
      { title: 'First Top Dressing', description: `Apply Urea 100 kg/ha at tillering stage (30-35 days after sowing). Apply in rows and irrigate.`, category: 'fertilizer', days: 32, materials: ['Urea 100 kg/ha'] },
      { title: 'Tillering Stage Irrigation', description: `Irrigation during active tillering. Maintain optimal soil moisture for maximum tiller production.`, category: 'irrigation', days: 35, materials: ['Water'] },
      { title: 'Pest Monitoring', description: `Monitor for aphids, termites, and shoot fly. Apply Imidacloprid 17.8% SL 125ml/acre if pest threshold reached.`, category: 'pesticide', days: 45, materials: ['Imidacloprid 17.8% SL 125ml/acre', 'Sprayer'] },
      { title: 'Jointing Stage Irrigation', description: `Critical irrigation at jointing stage (60-65 days). Essential for proper head formation.`, category: 'irrigation', days: 62, materials: ['Water'] },
      { title: 'Flag Leaf Stage Care', description: `Monitor flag leaf emergence. Apply fungicide if rust or powdery mildew observed.`, category: 'pesticide', days: 75, materials: ['Mancozeb 2.5 kg/ha', 'Sprayer'] },
      { title: 'Flowering Stage Irrigation', description: `Irrigation during flowering and grain filling stage. Critical for yield determination.`, category: 'irrigation', days: 85, materials: ['Water'] },
      { title: 'Grain Filling Support', description: `Monitor grain filling. Apply light irrigation if weather is dry. Avoid late nitrogen application.`, category: 'irrigation', days: 95, materials: ['Water'] },
      { title: 'Pre-Harvest Preparation', description: `Stop irrigation 10-15 days before harvest. Check grain moisture and maturity indicators.`, category: 'harvest', days: 105, materials: ['Moisture meter'] },
      { title: 'Harvesting', description: `Harvest when grains are hard and golden yellow. Use combine harvester for ${cropData.land_size} field size.`, category: 'harvest', days: 120, materials: ['Combine harvester', 'Storage bags'] },
      { title: 'Post-Harvest & Storage', description: `Clean grains, dry to 12% moisture content. Store in dry, cool place with proper ventilation.`, category: 'harvest', days: 125, materials: ['Cleaning equipment', 'Storage facilities', 'Drying floor'] },
      { title: 'Market Analysis & Sale', description: `Monitor wheat prices at ${cropData.location} mandi. Consider government procurement or private sale based on better rates.`, category: 'market', days: 130, materials: ['Transportation', 'Market information'] }
    ];

    wheatSteps.forEach((step, index) => {
      const stepDate = new Date(startDate);
      stepDate.setDate(startDate.getDate() + step.days);
      
      steps.push({
        id: `step_${index + 1}`,
        title: step.title,
        description: step.description,
        scheduled_date: stepDate.toISOString(),
        status: index === 0 ? 'current' : 'upcoming',
        category: step.category as CropStep['category'],
        materials: step.materials
      });
    });
  } else if (cropData.crop_name === 'soybean') {
    const soybeanSteps = [
      { title: 'Land Preparation & Deep Plowing', description: `Prepare ${cropData.soil_type} soil with deep plowing 15-20 cm. Apply farmyard manure 5-10 tons per acre. Level the field using a leveller for uniform sowing.`, category: 'sowing', days: 0, materials: ['Tractor/Bullock', 'Plough', 'Leveller', 'Farmyard Manure 5-10 tons'] },
      { title: 'Seed Treatment & Sowing', description: `Treat soybean seeds with Rhizobium culture and fungicide. Sow with 45-60 cm row spacing and 5 cm depth. Use 75-80 kg seeds per acre.`, category: 'sowing', days: 3, materials: ['Certified Soybean Seeds 75-80 kg', 'Rhizobium Culture', 'Thiram/Carbendazim'] },
      { title: 'First Irrigation', description: `Light irrigation immediately after sowing for good germination. Use ${cropData.water_source} system efficiently.`, category: 'irrigation', days: 4, materials: ['Water', 'Irrigation Equipment'] },
      { title: 'Basal Fertilizer Application', description: `Apply DAP 100 kg + Muriate of Potash 60 kg per acre as basal dose. Mix well with soil.`, category: 'fertilizer', days: 5, materials: ['DAP 100 kg/acre', 'Muriate of Potash 60 kg/acre'] },
      { title: 'First Weeding', description: `Manual weeding or use pre-emergence herbicide Pendimethalin 3.5 liters per acre within 2 days of sowing.`, category: 'pesticide', days: 15, materials: ['Pendimethalin 3.5L/acre', 'Hand tools for weeding'] },
      { title: 'Nitrogen Top Dressing', description: `Apply Urea 40 kg per acre during flowering stage for better pod formation.`, category: 'fertilizer', days: 30, materials: ['Urea 40 kg/acre'] },
      { title: 'Pest Monitoring & Control', description: `Monitor for aphids, jassids, and caterpillars. Spray Imidacloprid 17.8% SL 100ml in 200L water per acre if needed.`, category: 'pesticide', days: 35, materials: ['Imidacloprid 17.8% SL 100ml', 'Sprayer', 'Water 200L'] },
      { title: 'Second Irrigation', description: `Provide irrigation during flowering and pod development stage. Critical for yield.`, category: 'irrigation', days: 40, materials: ['Water', 'Irrigation system'] },
      { title: 'Disease Management', description: `Monitor for rust and blight. Apply Mancozeb 2.5 kg per acre if disease symptoms appear.`, category: 'pesticide', days: 50, materials: ['Mancozeb 2.5 kg/acre', 'Fungicide sprayer'] },
      { title: 'Final Irrigation', description: `Last irrigation during pod filling stage. Stop irrigation 10 days before harvest.`, category: 'irrigation', days: 70, materials: ['Water'] },
      { title: 'Pre-Harvest Monitoring', description: `Check crop maturity. Pods should turn brown and rattle when shaken. Plan harvest timing.`, category: 'harvest', days: 95, materials: ['Maturity indicators'] },
      { title: 'Harvesting', description: `Harvest when 95% pods are mature and brown. Use combine harvester or manual methods. Avoid delays to prevent shattering.`, category: 'harvest', days: 100, materials: ['Combine Harvester/Manual tools', 'Storage bags'] },
      { title: 'Drying & Storage', description: `Sun dry harvested soybean to 10-12% moisture content. Store in clean, dry godowns with proper fumigation.`, category: 'harvest', days: 105, materials: ['Drying floor', 'Storage bags', 'Moisture meter', 'Fumigants'] },
      { title: 'Market Analysis & Sale', description: `Check current mandi prices for soybean in ${cropData.location}. Sell at optimal price considering transport costs.`, category: 'market', days: 110, materials: ['Market price information', 'Transportation'] }
    ];

    soybeanSteps.forEach((step, index) => {
      const stepDate = new Date(startDate);
      stepDate.setDate(startDate.getDate() + step.days);
      
      steps.push({
        id: `step_${index + 1}`,
        title: step.title,
        description: step.description,
        scheduled_date: stepDate.toISOString(),
        status: index === 0 ? 'current' : 'upcoming',
        category: step.category as CropStep['category'],
        materials: step.materials
      });
    });
  } else {
    // Generic enhanced plan for other crops
    const genericSteps = [
      { title: 'Land Preparation', description: `Prepare field with deep plowing suited for ${cropData.soil_type} soil. Apply organic matter.`, category: 'sowing', days: 0, materials: ['Tractor/Plough', 'Organic manure'] },
      { title: 'Seed Treatment & Sowing', description: `Treat seeds with appropriate fungicide. Sow with recommended spacing for optimal growth.`, category: 'sowing', days: 3, materials: ['Certified seeds', 'Seed treatment chemicals'] },
      { title: 'Initial Irrigation', description: `Provide adequate water using ${cropData.water_source} for germination and establishment.`, category: 'irrigation', days: 5, materials: ['Water', 'Irrigation equipment'] },
      { title: 'Fertilizer Application', description: `Apply balanced NPK fertilizer based on soil test recommendations for ${cropData.soil_type} soil.`, category: 'fertilizer', days: 15, materials: ['NPK fertilizer', 'Organic supplements'] },
      { title: 'Weed Management', description: `Control weeds manually or using appropriate herbicides. Keep field weed-free.`, category: 'pesticide', days: 20, materials: ['Herbicides', 'Hand tools'] },
      { title: 'Pest Monitoring', description: `Regular monitoring for pests and diseases. Apply need-based treatment.`, category: 'pesticide', days: 30, materials: ['Insecticides', 'Fungicides', 'Sprayer'] },
      { title: 'Mid-Season Care', description: `Provide additional fertilizer and irrigation support during critical growth stages.`, category: 'fertilizer', days: 45, materials: ['Micronutrients', 'Water'] },
      { title: 'Harvest Preparation', description: `Monitor crop maturity and prepare for harvest. Arrange labor and equipment.`, category: 'harvest', days: 75, materials: ['Harvest tools', 'Storage containers'] },
      { title: 'Harvesting', description: `Harvest crop at optimal maturity to ensure best quality and market value.`, category: 'harvest', days: 80, materials: ['Harvest equipment', 'Transportation'] },
      { title: 'Post-Harvest & Marketing', description: `Proper handling, storage and marketing of produce to get best prices in ${cropData.location}.`, category: 'market', days: 85, materials: ['Storage facilities', 'Market information'] }
    ];

    genericSteps.forEach((step, index) => {
      const stepDate = new Date(startDate);
      stepDate.setDate(startDate.getDate() + step.days);
      
      steps.push({
        id: `step_${index + 1}`,
        title: step.title,
        description: step.description,
        scheduled_date: stepDate.toISOString(),
        status: index === 0 ? 'current' : 'upcoming',
        category: step.category as CropStep['category'],
        materials: step.materials
      });
    });
  }

  console.log(`Generated enhanced fallback plan with ${steps.length} steps`);
  return { steps };
}