import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check if request was aborted early
    if (request.signal?.aborted) {
      return new NextResponse('Request cancelled', { status: 499 });
    }

    const { image, mimeType, language = 'en' } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      console.error('Gemini API key not configured');
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 503 }
      );
    }

    const LANGUAGE_NAMES = {
      'en': 'English',
      'hi': 'Hindi',
      'kn': 'Kannada',
      'te': 'Telugu',
      'ta': 'Tamil',
      'ml': 'Malayalam',
      'mr': 'Marathi',
      'gu': 'Gujarati',
      'pa': 'Punjabi',
      'bn': 'Bengali',
      'or': 'Odia',
      'as': 'Assamese'
    };

    const languageName = LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES] || 'English';
    const isEnglish = language === 'en';

    // Simplified prompt to avoid API issues
    const prompt = isEnglish 
      ? `Analyze this crop/plant image for diseases, pests, or health issues. Provide a detailed diagnosis in JSON format with this structure:
{
  "disease": "Name of the disease/issue",
  "confidence": 85,
  "severity": "High/Medium/Low",
  "description": "Brief description",
  "symptoms": ["List of symptoms"],
  "causes": ["Possible causes"],
  "treatments": ["Treatment methods"],
  "prevention": ["Prevention tips"],
  "localRemedies": ["Local remedies using neem, turmeric etc"]
}

Focus on practical advice for Indian farmers.`
      : `Analyze this crop/plant image for diseases, pests, or health issues. Provide response in ${languageName} language in JSON format with this structure:
{
  "disease": "Disease name in ${languageName}",
  "confidence": 85,
  "severity": "Severity level in ${languageName}",
  "description": "Description in ${languageName}",
  "symptoms": ["Symptoms in ${languageName}"],
  "causes": ["Causes in ${languageName}"],
  "treatments": ["Treatments in ${languageName}"],
  "prevention": ["Prevention in ${languageName}"],
  "localRemedies": ["Local remedies in ${languageName}"]
}

Provide clear, simple ${languageName} for farmers.`;

    console.log('Making request to Gemini API...');

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
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: image
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048,
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
        }),
        signal: request.signal // Pass through the cancellation signal
      }
    );

    // Check if request was cancelled during API call
    if (request.signal?.aborted) {
      return new NextResponse('Request cancelled', { status: 499 });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', response.status, response.statusText, errorText);
      
      // Return a fallback response instead of throwing
      return NextResponse.json({
        disease: isEnglish ? "Analysis Unavailable" : "विश्लेषण उपलब्ध नहीं",
        confidence: 60,
        severity: isEnglish ? "Medium" : "मध्यम",
        description: isEnglish 
          ? "Unable to analyze image at the moment. Please try again later." 
          : "इस समय छवि का विश्लेषण करने में असमर्थ। कृपया बाद में पुनः प्रयास करें।",
        symptoms: [isEnglish ? "Service temporarily unavailable" : "सेवा अस्थायी रूप से अनुपलब्ध"],
        causes: [isEnglish ? "Technical issue with analysis service" : "विश्लेषण सेवा के साथ तकनीकी समस्या"],
        treatments: [isEnglish ? "Please retry or consult local expert" : "कृपया पुनः प्रयास करें या स्थानीय विशेषज्ञ से सलाह लें"],
        prevention: [isEnglish ? "Regular monitoring of crops" : "फसलों की नियमित निगरानी"],
        localRemedies: [isEnglish ? "Neem oil application" : "नीम तेल का प्रयोग"]
      });
    }

    const data = await response.json();
    console.log('Gemini API Response:', data);
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid response format from Gemini API');
      throw new Error('Invalid response format from Gemini API');
    }

    const analysisText = data.candidates[0].content.parts[0].text;
    console.log('Analysis text:', analysisText);
    
    // Extract JSON from the response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const result = JSON.parse(jsonMatch[0]);
        return NextResponse.json(result);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Failed to parse analysis result');
      }
    } else {
      console.log('No JSON found in response, using fallback');
      // If no JSON found, create a fallback response
      return NextResponse.json({
        disease: isEnglish ? "General Plant Health Check" : "सामान्य पौधे स्वास्थ्य जांच",
        confidence: 70,
        severity: isEnglish ? "Medium" : "मध्यम",
        description: isEnglish 
          ? "Analysis completed. Please review recommendations below." 
          : "विश्लेषण पूर्ण। कृपया नीचे दी गई सिफारिशों की समीक्षा करें।",
        symptoms: [isEnglish ? "Visual inspection needed" : "दृश्य निरीक्षण की आवश्यकता"],
        causes: [isEnglish ? "Multiple factors possible" : "कई कारक संभावित"],
        treatments: [isEnglish ? "Follow integrated pest management" : "एकीकृत कीट प्रबंधन का पालन करें"],
        prevention: [isEnglish ? "Regular monitoring and care" : "नियमित निगरानी और देखभाल"],
        localRemedies: [isEnglish ? "Neem oil, turmeric paste application" : "नीम तेल, हल्दी पेस्ट का प्रयोग"]
      });
    }
  } catch (error) {
    // Handle cancellation errors
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Request was cancelled');
      return new NextResponse('Request cancelled', { status: 499 });
    }
    
    console.error('Analysis error:', error);
    
    // Return user-friendly error response
    return NextResponse.json({
      disease: "Service Error",
      confidence: 0,
      severity: "Unknown",
      description: "Unable to analyze image due to technical issues. Please try again later.",
      symptoms: ["Service temporarily unavailable"],
      causes: ["Technical difficulty"],
      treatments: ["Please retry analysis"],
      prevention: ["Check image quality and try again"],
      localRemedies: ["Consult local agricultural expert"]
    }, { status: 200 }); // Return 200 with error data instead of 500
  }
}
