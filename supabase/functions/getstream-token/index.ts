import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// JWT creation for GetStream (works for both Chat and Video)
async function createStreamToken(userId: string, apiSecret: string, callIds?: string[]): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  
  const payload: Record<string, unknown> = {
    user_id: userId,
    iat: now,
    exp: now + 3600, // 1 hour expiry
  };

  // Add call_cids for video permissions if provided
  if (callIds && callIds.length > 0) {
    payload.call_cids = callIds;
  }

  const base64Header = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const base64Payload = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  
  const encoder = new TextEncoder();
  const key = encoder.encode(apiSecret);
  const data = encoder.encode(`${base64Header}.${base64Payload}`);
  
  // Use Web Crypto API for HMAC-SHA256
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

// Server-side: upsert user and add them to the global sustainability-forum channel
async function setupChatUser(
  userId: string,
  userName: string,
  apiKey: string,
  apiSecret: string
): Promise<void> {
  const baseUrl = "https://chat.stream-io-api.com";
  const serverToken = await createStreamToken("server", apiSecret);

  // 1. Upsert the user with 'admin' role to ensure full channel access
  // Stream Chat's default 'user' role often lacks ReadChannel permissions
  try {
    const upsertResponse = await fetch(`${baseUrl}/users?api_key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Stream-Auth-Type": "jwt",
        Authorization: serverToken,
      },
      body: JSON.stringify({
        users: {
          [userId]: { id: userId, name: userName, role: "admin" },
        },
      }),
    });
    
    if (!upsertResponse.ok) {
      console.log("User upsert response:", await upsertResponse.text());
    } else {
      console.log("User upserted successfully with admin role:", userId);
    }
  } catch (e) {
    console.error("Error upserting user:", e);
  }

  // 2. Create or get the sustainability-forum channel and add the user as a member
  try {
    const channelResponse = await fetch(
      `${baseUrl}/channels/messaging/sustainability-forum/query?api_key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Stream-Auth-Type": "jwt",
          Authorization: serverToken,
        },
        body: JSON.stringify({
          data: {
            created_by_id: "server",
            name: "Sustainability Forum",
          },
          members: { limit: 0 },
          watchers: { limit: 0 },
        }),
      }
    );

    if (!channelResponse.ok) {
      console.log("Channel query response:", await channelResponse.text());
    }

    // 3. Add user as member to the channel
    const addMemberResponse = await fetch(
      `${baseUrl}/channels/messaging/sustainability-forum?api_key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Stream-Auth-Type": "jwt",
          Authorization: serverToken,
        },
        body: JSON.stringify({
          add_members: [userId],
        }),
      }
    );

    if (!addMemberResponse.ok) {
      console.log("Add member response:", await addMemberResponse.text());
    }
  } catch (e) {
    console.error("Error setting up channel membership:", e);
  }
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

    // Parse request body for optional call IDs
    let callIds: string[] | undefined;
    try {
      const body = await req.json();
      callIds = body?.callIds;
    } catch {
      // No body or invalid JSON, that's fine
    }

    const apiSecret = Deno.env.get("GETSTREAM_API_SECRET");
    const apiKey = Deno.env.get("GETSTREAM_API_KEY");

    if (!apiSecret || !apiKey) {
      return new Response(
        JSON.stringify({ error: "GetStream credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a sanitized user ID (GetStream requires alphanumeric with some special chars)
    const streamUserId = user.id.replace(/-/g, "_");

    // Get user profile for display name
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    const userName = profile?.display_name || "User";

    // Setup user in Stream Chat and add them to the sustainability-forum channel (server-side)
    await setupChatUser(streamUserId, userName, apiKey, apiSecret);

    // Generate the token (with optional call permissions)
    const token = await createStreamToken(streamUserId, apiSecret, callIds);

    return new Response(
      JSON.stringify({
        token,
        userId: streamUserId,
        userName,
        apiKey,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating GetStream token:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate token" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
