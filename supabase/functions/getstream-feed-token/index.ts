import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// JWT creation for GetStream Feeds with full permissions
async function createFeedToken(userId: string, apiSecret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    user_id: userId,
    iat: now,
    exp: now + 3600 * 24, // 24 hour expiry for feeds
  };

  const base64Header = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const base64Payload = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  
  const encoder = new TextEncoder();
  const key = encoder.encode(apiSecret);
  const data = encoder.encode(`${base64Header}.${base64Payload}`);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
    
  return `${base64Header}.${base64Payload}.${base64Signature}`;
}

// Setup user in GetStream and (optionally) follow the community feed
async function setupStreamUser(
  userId: string,
  userName: string,
  avatarUrl: string | null,
  apiKey: string,
  apiSecret: string
): Promise<{ communityEnabled: boolean }> {
  const baseUrl = "https://api.stream-io-api.com/api/v1.0";

  // Create server token for API calls
  const serverToken = await createFeedToken("server", apiSecret);

  let communityEnabled = true;

  try {
    // Update/create user
    const userResponse = await fetch(`${baseUrl}/user/?api_key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Stream-Auth-Type": "jwt",
        Authorization: serverToken,
      },
      body: JSON.stringify({
        id: userId,
        data: {
          name: userName,
          profileImage: avatarUrl,
        },
      }),
    });

    if (!userResponse.ok) {
      console.log("User setup response:", await userResponse.text());
    }

    // Make user's timeline follow the community feed if it exists
    const followResponse = await fetch(
      `${baseUrl}/feed/timeline/${userId}/follows/?api_key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Stream-Auth-Type": "jwt",
          Authorization: serverToken,
        },
        body: JSON.stringify({
          target: "community:global",
        }),
      }
    );

    if (!followResponse.ok) {
      const txt = await followResponse.text();
      // If the community feed group isn't configured in Stream, fall back gracefully.
      if (txt.includes("community feed group does not exist")) {
        communityEnabled = false;
      } else {
        console.log("Follow setup response:", txt);
      }
    }
  } catch (error) {
    console.error("Error setting up stream user:", error);
    communityEnabled = false;
  }

  return { communityEnabled };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiSecret = Deno.env.get("GETSTREAM_API_SECRET");
    const apiKey = Deno.env.get("GETSTREAM_API_KEY");
    const appId = Deno.env.get("GETSTREAM_APP_ID");

    if (!apiSecret || !apiKey || !appId) {
      return new Response(
        JSON.stringify({ error: "GetStream credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a sanitized user ID
    const streamUserId = user.id.replace(/-/g, "_");
    
    // Get user profile for display name
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    const userName = profile?.display_name || "Eco Warrior";
    const avatarUrl = profile?.avatar_url || null;

    // Setup user in GetStream and try to make them follow the community feed
    const { communityEnabled } = await setupStreamUser(streamUserId, userName, avatarUrl, apiKey, apiSecret);

    // Generate the feed token for this user
    const token = await createFeedToken(streamUserId, apiSecret);

    return new Response(
      JSON.stringify({
        token,
        userId: streamUserId,
        userName,
        avatarUrl,
        apiKey,
        appId,
        communityEnabled,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating GetStream feed token:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate token" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
