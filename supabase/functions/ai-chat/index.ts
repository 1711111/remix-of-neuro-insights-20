import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use user's own Gemini API key, fall back to Lovable API if not set
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const systemPrompt = `You are GreenQuest AI, a friendly and knowledgeable assistant for the GreenQuest sustainability app. 

Your role is to:
- Help users learn about sustainability and eco-friendly practices
- Provide tips for completing eco-challenges and quests
- Answer questions about environmental topics
- Encourage and motivate users on their sustainability journey
- Suggest creative ways to reduce carbon footprint

Keep your responses:
- Concise (2-3 paragraphs max)
- Friendly and encouraging
- Practical and actionable
- Occasionally use relevant emojis 🌱🌍♻️

Remember: You're here to make sustainability fun and accessible!`;

    let content: string | undefined;

    const callLovableGateway = async (): Promise<string> => {
      if (!LOVABLE_API_KEY) {
        throw new Error('Lovable AI Gateway is not configured.');
      }

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((msg: { role: string; content: string }) => ({
              role: msg.role,
              content: msg.content,
            })),
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return JSON.stringify({ __error: 'Rate limit exceeded. Please try again later.' });
        }
        if (response.status === 402) {
          return JSON.stringify({ __error: 'AI credits depleted. Please add credits to continue.' });
        }
        const errorText = await response.text();
        console.error('AI gateway error:', response.status, errorText);
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content;
    };

    // Prefer Lovable Gateway; if a user-provided Gemini key exists, try it first and fall back on quota/rate errors.
    if (GEMINI_API_KEY) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

      const geminiMessages = messages.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: geminiMessages,
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      } else {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, errorText);

        // If the user-provided Gemini key is out of quota / rate-limited, fall back to Lovable Gateway when available.
        if (LOVABLE_API_KEY && (response.status === 429 || response.status === 403)) {
          const gatewayContent = await callLovableGateway();
          try {
            const maybeError = JSON.parse(gatewayContent);
            if (maybeError?.__error) {
              return new Response(JSON.stringify({ error: maybeError.__error }), {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          } catch {
            // not json
          }
          content = gatewayContent;
        } else if (response.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          throw new Error(`Gemini API error: ${response.status}`);
        }
      }
    } else if (LOVABLE_API_KEY) {
      const gatewayContent = await callLovableGateway();
      try {
        const maybeError = JSON.parse(gatewayContent);
        if (maybeError?.__error) {
          return new Response(JSON.stringify({ error: maybeError.__error }), {
            status: maybeError.__error.includes('credits') ? 402 : 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch {
        // not json
      }
      content = gatewayContent;
    } else {
      throw new Error('No API key configured. Please set GEMINI_API_KEY or LOVABLE_API_KEY.');
    }

    if (!content) {
      throw new Error('No content in AI response');
    }

    return new Response(JSON.stringify({ response: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    const message = error instanceof Error ? error.message : 'Failed to process chat';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
