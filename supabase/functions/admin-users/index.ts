import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the requester is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser } } = await supabaseAdmin.auth.getUser(token);
    
    if (!requestingUser) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if requester is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .single();

    if (roleData?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized - Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, userId, email, password, fullName } = await req.json();

    switch (action) {
      case "list": {
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) throw error;
        
        // Get roles and permissions
        const { data: roles } = await supabaseAdmin.from("user_roles").select("*");
        const { data: profiles } = await supabaseAdmin.from("profiles").select("*");
        const { data: permissions } = await supabaseAdmin.from("data_permissions").select("*");

        const usersWithDetails = users.map((user) => ({
          id: user.id,
          email: user.email,
          fullName: profiles?.find((p) => p.user_id === user.id)?.full_name || "",
          isAdmin: roles?.find((r) => r.user_id === user.id)?.role === "admin",
          createdAt: user.created_at,
          lastSignIn: user.last_sign_in_at,
          permissions: permissions?.find((p) => p.user_id === user.id) || null,
        }));

        return new Response(JSON.stringify({ users: usersWithDetails }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create": {
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });

        if (createError) throw createError;

        // Create profile
        await supabaseAdmin.from("profiles").insert({
          user_id: newUser.user.id,
          full_name: fullName,
        });

        // Create default role
        await supabaseAdmin.from("user_roles").insert({
          user_id: newUser.user.id,
          role: "user",
        });

        return new Response(JSON.stringify({ user: newUser.user }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update": {
        const updates: any = {};
        if (email) updates.email = email;
        if (password) updates.password = password;
        if (fullName) updates.user_metadata = { full_name: fullName };

        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          updates
        );

        if (updateError) throw updateError;

        if (fullName) {
          await supabaseAdmin
            .from("profiles")
            .update({ full_name: fullName })
            .eq("user_id", userId);
        }

        return new Response(JSON.stringify({ user: updatedUser.user }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        // Prevent self-deletion
        if (userId === requestingUser.id) {
          return new Response(JSON.stringify({ error: "Cannot delete yourself" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
