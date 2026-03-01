import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const anonClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Token inválido" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authUserId = claimsData.claims.sub;
  const email = claimsData.claims.email as string;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Get user agent and IP from request
  const userAgent = req.headers.get("user-agent") || "unknown";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Look up the user by email
  const { data: usuario } = await adminClient
    .from("usuarios")
    .select("*")
    .eq("email", email)
    .single();

  // User not found
  if (!usuario) {
    await adminClient.from("log_auditoria").insert({
      tipo_acao: "LOGIN_GOOGLE_USUARIO_NAO_ENCONTRADO",
      modulo: "autenticacao",
      descricao: `Tentativa de login Google com e-mail não cadastrado: ${email}`,
      ip,
      user_agent: userAgent,
    });

    // Sign out the Google session since user is not authorized
    await adminClient.auth.admin.deleteUser(authUserId);

    return new Response(
      JSON.stringify({
        authorized: false,
        reason: "not_found",
        message: "Seu e-mail não está autorizado no sistema. Procure o administrador da instituição.",
      }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // User inactive
  if (!usuario.ativo) {
    await adminClient.from("log_auditoria").insert({
      usuario_ator_id: usuario.id,
      tipo_acao: "LOGIN_GOOGLE_USUARIO_INATIVO",
      modulo: "autenticacao",
      descricao: `Tentativa de login Google por usuário inativo: ${usuario.nome} (${email})`,
      ip,
      user_agent: userAgent,
      instituicao_id: usuario.instituicao_id,
    });

    await adminClient.auth.admin.deleteUser(authUserId);

    return new Response(
      JSON.stringify({
        authorized: false,
        reason: "inactive",
        message: "Sua conta está desativada. Procure o administrador da instituição.",
      }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Google login not enabled
  if (!usuario.login_google_habilitado) {
    await adminClient.from("log_auditoria").insert({
      usuario_ator_id: usuario.id,
      tipo_acao: "LOGIN_GOOGLE_NAO_HABILITADO",
      modulo: "autenticacao",
      descricao: `Tentativa de login Google sem habilitação: ${usuario.nome} (${email})`,
      ip,
      user_agent: userAgent,
      instituicao_id: usuario.instituicao_id,
    });

    await adminClient.auth.admin.deleteUser(authUserId);

    return new Response(
      JSON.stringify({
        authorized: false,
        reason: "google_not_enabled",
        message: "O login com Google não está habilitado para sua conta. Procure o administrador.",
      }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // SUCCESS - Link auth user to profile and update
  const updates: Record<string, unknown> = {
    auth_user_id: authUserId,
    ultimo_login_em: new Date().toISOString(),
  };

  if (!usuario.google_id) {
    updates.google_id = claimsData.claims.sub;
  }

  await adminClient.from("usuarios").update(updates).eq("id", usuario.id);

  // Log success
  await adminClient.from("log_auditoria").insert({
    usuario_ator_id: usuario.id,
    tipo_acao: "LOGIN_GOOGLE_SUCESSO",
    modulo: "autenticacao",
    descricao: `Login Google realizado: ${usuario.nome} (${email}) - Perfil: ${usuario.perfil}`,
    ip,
    user_agent: userAgent,
    instituicao_id: usuario.instituicao_id,
  });

  // Create session record
  await adminClient.from("sessoes_usuario").insert({
    usuario_id: usuario.id,
    ip,
    user_agent: userAgent,
    metodo_login: "google",
    instituicao_id: usuario.instituicao_id,
  });

  return new Response(
    JSON.stringify({
      authorized: true,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        instituicao_id: usuario.instituicao_id,
      },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
