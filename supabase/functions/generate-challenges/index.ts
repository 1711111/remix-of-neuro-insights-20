import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Challenge {
  title: string;
  description: string;
  category: string;
  challenge_type: "daily" | "weekly" | "monthly";
  points: number;
  bonus_multiplier: number;
  verification_hint: string;
  difficulty: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const now = new Date();
    
    // Calculate end times for each type
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);
    
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const prompt = `Generate 9 unique sustainability challenges (3 daily, 3 weekly, 3 monthly) for an eco-friendly gamification app.

For each challenge, provide:
- title: A catchy, action-oriented title (max 50 chars)
- description: What the user needs to do (max 100 chars)
- category: One of: recycling, energy, transport, waste, nature, water, food
- challenge_type: daily, weekly, or monthly
- points: Base points (daily: 30-50, weekly: 100-200, monthly: 300-500)
- difficulty: easy, medium, or hard
- verification_hint: What photo evidence to provide

Make challenges progressively harder: daily=easy quick tasks, weekly=medium effort, monthly=significant commitment.

Respond with valid JSON only:
{
  "challenges": [
    {
      "title": "...",
      "description": "...",
      "category": "...",
      "challenge_type": "daily",
      "points": 40,
      "difficulty": "easy",
      "verification_hint": "..."
    }
  ]
}`;

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a sustainability expert creating engaging eco-challenges. Always respond with valid JSON only, no markdown."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Add timestamps and multipliers
    const challenges: Challenge[] = parsed.challenges.map((c: any) => {
      let ends_at: string;
      let bonus_multiplier: number;
      
      switch (c.challenge_type) {
        case "daily":
          ends_at = endOfDay.toISOString();
          bonus_multiplier = 1.5;
          break;
        case "weekly":
          ends_at = endOfWeek.toISOString();
          bonus_multiplier = 2.0;
          break;
        case "monthly":
          ends_at = endOfMonth.toISOString();
          bonus_multiplier = 3.0;
          break;
        default:
          ends_at = endOfDay.toISOString();
          bonus_multiplier = 1.0;
      }

      return {
        title: c.title,
        description: c.description,
        category: c.category,
        challenge_type: c.challenge_type,
        points: c.points,
        bonus_multiplier,
        verification_hint: c.verification_hint,
        difficulty: c.difficulty,
        starts_at: now.toISOString(),
        ends_at,
        is_active: true,
      };
    });

    return new Response(JSON.stringify({ challenges }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating challenges:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
