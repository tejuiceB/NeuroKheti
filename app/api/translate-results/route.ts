import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    const { result, targetLanguage } = await request.json();

    if (targetLanguage === 'en') {
      return NextResponse.json(result);
    }

    const languageName = LANGUAGE_NAMES[targetLanguage as keyof typeof LANGUAGE_NAMES];
    if (!languageName) {
      throw new Error('Unsupported language');
    }

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
                  text: `Translate the following crop diagnosis result to ${languageName}. Maintain the exact JSON structure and translate all text content to clear, simple ${languageName} that farmers can easily understand:

${JSON.stringify(result, null, 2)}

Return the translated result in the exact same JSON format with all text content translated to ${languageName}. Keep the confidence number and severity levels (High/Medium/Low) as they are, but translate the severity words to ${languageName}.`
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      throw new Error('Translation API request failed');
    }

    const data = await response.json();
    const translationText = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from the response
    const jsonMatch = translationText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const translatedResult = JSON.parse(jsonMatch[0]);
      return NextResponse.json(translatedResult);
    } else {
      throw new Error('Could not parse translation result');
    }
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Failed to translate results' },
      { status: 500 }
    );
  }
}
