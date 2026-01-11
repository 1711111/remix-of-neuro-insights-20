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
    const { images, imageBase64, quest } = await req.json();
    
    // Support both single image (legacy) and multiple images
    const imageList: string[] = images || (imageBase64 ? [imageBase64] : []);

    if (imageList.length === 0 || !quest) {
      return new Response(JSON.stringify({ error: 'Missing images or quest data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build content array with all images
    const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      {
        type: 'text',
        text: `Please verify if these ${imageList.length} photo(s) show that I completed the quest. Analyze all images together.`
      }
    ];

    // Add each image to the content
    imageList.forEach((img, index) => {
      contentParts.push({
        type: 'image_url',
        image_url: {
          url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`
        }
      });
    });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a verification AI for GreenQuest, a sustainability challenge app. Your job is to analyze photos submitted by users to verify if they completed their eco-friendly quest.

Be encouraging but fair. Look for evidence that the quest was genuinely completed. The user may submit multiple photos - analyze all of them together to determine if the quest was completed.

Quest to verify:
Title: ${quest.title}
Description: ${quest.description}
Category: ${quest.category}
What the photos should show: ${quest.verification_hint}

Analyze all the images and respond ONLY with valid JSON in this exact format:
{
  "verified": <true or false>,
  "confidence": <number 0-100>,
  "feedback": "Encouraging message about what you see in the photos and whether they match the quest",
  "pointsAwarded": <0 if not verified, or the quest points if verified: ${quest.points}>
}`
          },
          {
            role: 'user',
            content: contentParts
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse verification result from AI response');
    }

    const result = JSON.parse(jsonMatch[0]);
    console.log('Verification result:', result);

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error verifying quest:', error);
    const message = error instanceof Error ? error.message : 'Failed to verify quest';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
