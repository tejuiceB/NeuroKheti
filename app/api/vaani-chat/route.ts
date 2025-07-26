import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let language = 'hi-IN'; // Default language
  try {
    // Check if request was aborted early
    if (request.signal?.aborted) {
      return new NextResponse('Request cancelled', { status: 499 });
    }

    const { query, language: requestLanguage = 'hi-IN', conversationHistory = [] } = await request.json();
    language = requestLanguage;

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    // Create context-aware prompt for Vaani
    const systemPrompt = getSystemPrompt(language);
    const conversationContext = conversationHistory
      .slice(-3) // Last 3 messages for context
      .map((msg: { type: string; content: string }) => `${msg.type === 'user' ? 'User' : 'Vaani'}: ${msg.content}`)
      .join('\n');

    const fullPrompt = `${systemPrompt}

Previous conversation:
${conversationContext}

User: ${query}

Vaani:`;

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
                  text: fullPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500,
          }
        }),
        signal: request.signal // Pass through the cancellation signal
      }
    );

    // Check if request was cancelled during API call
    if (request.signal?.aborted) {
      return new NextResponse('Request cancelled', { status: 499 });
    }

    if (!response.ok) {
      throw new Error('Failed to get response from Gemini');
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;

    return NextResponse.json({
      response: aiResponse.trim(),
      language
    });

  } catch (error) {
    // Handle cancellation errors
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Vaani chat request was cancelled');
      return new NextResponse('Request cancelled', { status: 499 });
    }
    
    console.error('Vaani chat error:', error);
    
    // Fallback response based on language
    const fallbackResponse = getFallbackResponse(language);
    
    return NextResponse.json({
      response: fallbackResponse,
      language
    });
  }
}

function getSystemPrompt(language: string) {
  const prompts = {
    'hi-IN': `आप वाणी हैं, एक AI कृषि सहायक। आप भारतीय किसानों की मदद करती हैं। आपको इन विषयों का ज्ञान है:

1. फसल रोग निदान और उपचार
2. बाजार की कीमतें और बिक्री सलाह  
3. सरकारी योजनाएं और सब्सिडी
4. मौसम और सिंचाई
5. खाद और बीज की जानकारी

हमेशा:
- सरल हिंदी में जवाब दें
- किसान-मित्र लहजे में बात करें
- व्यावहारिक सलाह दें
- स्थानीय उपाय सुझाएं
- संक्षिप्त और स्पष्ट उत्तर दें`,

    'en-IN': `You are Vaani, an AI agricultural assistant helping Indian farmers. You have expertise in:

1. Crop disease diagnosis and treatment
2. Market prices and selling advice
3. Government schemes and subsidies  
4. Weather and irrigation
5. Fertilizer and seed information

Always:
- Respond in simple English
- Use farmer-friendly tone
- Give practical advice
- Suggest local solutions
- Keep answers concise and clear`,

    'kn-IN': `ನೀವು ವಾಣಿ, ಭಾರತೀಯ ರೈತರಿಗೆ ಸಹಾಯ ಮಾಡುವ AI ಕೃಷಿ ಸಹಾಯಕ. ನಿಮಗೆ ಈ ವಿಷಯಗಳಲ್ಲಿ ಪರಿಣತಿ ಇದೆ:

1. ಬೆಳೆ ರೋಗ ನಿರ್ಣಯ ಮತ್ತು ಚಿಕಿತ್ಸೆ
2. ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು ಮತ್ತು ಮಾರಾಟ ಸಲಹೆ
3. ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಮತ್ತು ಸುಂಕ
4. ಹವಾಮಾನ ಮತ್ತು ನೀರಾವರಿ
5. ಗೊಬ್ಬರ ಮತ್ತು ಬೀಜದ ಮಾಹಿತಿ

ಯಾವಾಗಲೂ:
- ಸರಳ ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ
- ರೈತ-ಸ್ನೇಹಿ ಧ್ವನಿಯಲ್ಲಿ ಮಾತನಾಡಿ
- ಪ್ರಾಯೋಗಿಕ ಸಲಹೆ ನೀಡಿ
- ಸ್ಥಳೀಯ ಪರಿಹಾರಗಳನ್ನು ಸೂಚಿಸಿ
- ಸಂಕ್ಷಿಪ್ತ ಮತ್ತು ಸ್ಪಷ್ಟ ಉತ್ತರಗಳನ್ನು ನೀಡಿ`
  };

  return prompts[language as keyof typeof prompts] || prompts['en-IN'];
}

function getFallbackResponse(language: string) {
  const responses = {
    'hi-IN': 'मुझे खुशी होगी आपकी मदद करने में। कृपया अपना सवाल फिर से पूछें या अधिक जानकारी दें।',
    'en-IN': 'I am happy to help you. Please ask your question again or provide more details.',
    'kn-IN': 'ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ನನಗೆ ಸಂತೋಷವಾಗಿದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಮತ್ತೆ ಕೇಳಿ ಅಥವಾ ಹೆಚ್ಚು ಮಾಹಿತಿ ನೀಡಿ।',
    'te-IN': 'మీకు సహాయం చేయడంలో నాకు సంతోషం. దయచేసి మీ ప్రశ్నను మళ్లీ అడగండి లేదా మరింత వివరాలు ఇవ్వండి।',
    'ta-IN': 'உங்களுக்கு உதவுவதில் நான் மகிழ்ச்சியடைகிறேன். தயவுசெய்து உங்கள் கேள்வியை மீண்டும் கேளுங்கள் அல்லது மேலும் விவரங்களை வழங்கவும்।'
  };

  return responses[language as keyof typeof responses] || responses['en-IN'];
}
