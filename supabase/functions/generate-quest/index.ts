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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Parse request body to get count (default 5)
    let count = 5;
    try {
      const body = await req.json();
      if (body?.count && typeof body.count === 'number') {
        count = Math.min(Math.max(body.count, 1), 10); // Clamp between 1-10
      }
    } catch {
      // No body or invalid JSON, use default
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
          {
            role: 'system',
            content: `You are GreenQuest, a fun and engaging sustainability challenge generator for students. Generate exactly ${count} diverse eco-friendly quests that can be completed within a few hours. 
            
Each quest should be:
- Actionable and specific
- Fun and engaging for students
- Easily verifiable with a photo
- Related to sustainability (recycling, saving energy, sustainable transport, reducing waste, helping nature)
- DIFFERENT from each other (mix categories and difficulty levels)

IMPORTANT - Points must match difficulty:
- easy: 30-50 points
- medium: 60-100 points  
- hard: 120-200 points

Respond ONLY with valid JSON in this exact format:
{
  "quests": [
    {
      "title": "Short catchy title (max 50 chars)",
      "description": "Detailed description of what to do (2-3 sentences)",
      "points": <number based on difficulty: easy 30-50, medium 60-100, hard 120-200>,
      "category": "<one of: recycling, energy, transport, waste, nature>",
      "verification_hint": "What the photo should show to prove completion",
      "difficulty": "<one of: easy, medium, hard>"
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Generate ${count} diverse eco-friendly quests for me!`
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
      throw new Error('Could not parse quests from AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('Generated quests:', parsed);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating quests:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate quests';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});