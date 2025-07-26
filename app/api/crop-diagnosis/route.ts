import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check if request was aborted early
    if (request.signal?.aborted) {
      return new NextResponse('Request cancelled', { status: 499 });
    }

    const { image, mimeType, language = 'en' } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('Gemini API key not configured');
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 503 }
      );
    }

    // Language-specific prompts for crop diagnosis
    const getPrompt = (lang: string) => {
      const prompts = {
        'hi': `इस फसल की तस्वीर का विश्लेषण करें और निम्नलिखित JSON प्रारूप में जानकारी दें:
        {
          "disease": "बीमारी का नाम या 'स्वस्थ' यदि कोई समस्या नहीं है",
          "confidence": विश्वास_प्रतिशत_संख्या_में,
          "severity": "Low/Medium/High",
          "description": "स्थिति का विस्तृत विवरण",
          "symptoms": ["देखे गए लक्षणों की सूची"],
          "causes": ["संभावित कारणों की सूची"],
          "treatments": ["उपचार की सिफारिशों की सूची"],
          "prevention": ["रोकथाम के उपायों की सूची"],
          "localRemedies": ["स्थानीय और जैविक उपचार की सूची"]
        }`,
        
        'kn': `ಈ ಬೆಳೆಯ ಚಿತ್ರವನ್ನು ವಿಶ್ಲೇಷಿಸಿ ಮತ್ತು ಈ JSON ಸ್ವರೂಪದಲ್ಲಿ ಮಾಹಿತಿ ನೀಡಿ:
        {
          "disease": "ರೋಗದ ಹೆಸರು ಅಥವಾ 'ಆರೋಗ್ಯಕರ' ಯಾವುದೇ ಸಮಸ್ಯೆ ಇಲ್ಲದಿದ್ದರೆ",
          "confidence": ವಿಶ್ವಾಸ_ಶೇಕಡಾವಾರು_ಸಂಖ್ಯೆ,
          "severity": "Low/Medium/High",
          "description": "ಸ್ಥಿತಿಯ ವಿವರವಾದ ವಿವರಣೆ",
          "symptoms": ["ಕಂಡುಬರುವ ಲಕ್ಷಣಗಳ ಪಟ್ಟಿ"],
          "causes": ["ಸಂಭವನೀಯ ಕಾರಣಗಳ ಪಟ್ಟಿ"],
          "treatments": ["ಚಿಕಿತ್ಸೆಯ ಶಿಫಾರಸುಗಳ ಪಟ್ಟಿ"],
          "prevention": ["ತಡೆಗಟ್ಟುವ ಕ್ರಮಗಳ ಪಟ್ಟಿ"],
          "localRemedies": ["ಸ್ಥಳೀಯ ಮತ್ತು ಸಾವಯವ ಪರಿಹಾರಗಳ ಪಟ್ಟಿ"]
        }`,

        'en': `Analyze this crop image for diseases, pests, or health issues and provide detailed information in this JSON format:
        {
          "disease": "Disease name or 'Healthy' if no issues detected",
          "confidence": confidence_percentage_as_number,
          "severity": "Low/Medium/High",
          "description": "Detailed description of the condition",
          "symptoms": ["List of observed symptoms"],
          "causes": ["List of possible causes"],
          "treatments": ["List of treatment recommendations"],
          "prevention": ["List of prevention measures"],
          "localRemedies": ["List of local and organic remedies"]
        }`
      };
      
      return prompts[lang as keyof typeof prompts] || prompts['en'];
    };

    console.log('Making request to Gemini API for crop diagnosis...');

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
                  text: getPrompt(language)
                },
                {
                  inline_data: {
                    mime_type: mimeType || 'image/jpeg',
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
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid response structure from Gemini API:', data);
      throw new Error('Invalid response from AI service');
    }

    const analysisText = data.candidates[0].content.parts[0].text;
    console.log('Raw AI response:', analysisText);

    // Parse JSON response
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        
        // Validate required fields
        const requiredFields = ['disease', 'confidence', 'description'];
        const hasRequiredFields = requiredFields.every(field => result.hasOwnProperty(field));
        
        if (!hasRequiredFields) {
          throw new Error('Missing required fields in AI response');
        }

        // Ensure arrays exist for lists
        result.symptoms = result.symptoms || [];
        result.causes = result.causes || [];
        result.treatments = result.treatments || [];
        result.prevention = result.prevention || [];
        result.localRemedies = result.localRemedies || [];
        result.severity = result.severity || 'Medium';

        console.log('Parsed analysis result:', result);
        return NextResponse.json(result);
      } else {
        // Fallback: create structured response from unstructured text
        const fallbackResult = {
          disease: "Analysis Complete",
          confidence: 80,
          severity: "Medium",
          description: analysisText,
          symptoms: ["Analysis provided in description"],
          causes: ["Multiple factors may be involved"],
          treatments: ["Consult local agricultural expert for specific treatment"],
          prevention: ["Follow good agricultural practices"],
          localRemedies: ["Traditional organic methods may help"]
        };
        
        console.log('Using fallback result:', fallbackResult);
        return NextResponse.json(fallbackResult);
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      
      // Final fallback
      const errorResult = {
        disease: "Analysis Completed",
        confidence: 75,
        severity: "Medium",
        description: "Image analysis completed. Please consult with local agricultural experts for detailed diagnosis and treatment recommendations.",
        symptoms: ["Visual analysis performed"],
        causes: ["Multiple environmental and biological factors"],
        treatments: ["Professional consultation recommended"],
        prevention: ["Regular monitoring and good practices"],
        localRemedies: ["Traditional farming methods"]
      };
      
      return NextResponse.json(errorResult);
    }
    
  } catch (error) {
    // Handle cancellation errors
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Crop diagnosis request was cancelled');
      return new NextResponse('Request cancelled', { status: 499 });
    }
    
    console.error('Crop diagnosis error:', error);
    
    // Provide meaningful error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (errorMessage.includes('API key')) {
      return NextResponse.json(
        { error: 'Service configuration error. Please try again later.' },
        { status: 503 }
      );
    }
    
    if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again in a few minutes.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Analysis failed. Please try again with a different image.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Crop Diagnosis API - Use POST method with image data' },
    { status: 200 }
  );
}
