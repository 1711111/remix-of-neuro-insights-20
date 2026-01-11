import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { impactStats, userStats } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Generate a short, inspiring, shareable "impact story" for a user who has made environmental contributions. Make it personal, celebratory, and include a real-world comparison. Keep it to 2-3 sentences max.

User's Impact Stats:
- CO2 Saved: ${impactStats.co2_saved_kg || 0} kg
- Water Saved: ${impactStats.water_saved_liters || 0} liters
- Energy Saved: ${impactStats.energy_saved_kwh || 0} kWh
- Plastic Avoided: ${impactStats.plastic_avoided_kg || 0} kg
- Trees Equivalent: ${impactStats.trees_equivalent || 0}

User's Activity:
- Total Points: ${userStats.total_points || 0}
- Quests Completed: ${userStats.quests_completed || 0}
- Current Streak: ${userStats.current_streak || 0} days

Generate a story that:
1. Highlights their biggest achievement
2. Includes a relatable real-world comparison (like "that's equivalent to...")
3. Is upbeat and shareable on social media
4. Ends with an emoji

Just return the story text, nothing else.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an enthusiastic environmental impact storyteller. Create short, shareable stories that celebrate users' eco-friendly achievements." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const story = data.choices?.[0]?.message?.content || "You're making a difference! Keep up the great work! 🌱";

    return new Response(JSON.stringify({ story }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error generating impact story:", error);
    const message = error instanceof Error ? error.message : "Failed to generate story";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
