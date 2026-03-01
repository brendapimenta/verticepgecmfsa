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

  const { email, senha } = await req.json();

  if (!email || !senha) {
    return new Response(JSON.stringify({ error: "E-mail e senha são obrigatórios" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const userAgent = req.headers.get("user-agent") || "unknown";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Check if user exists in usuarios table
  const { data: usuario } = await adminClient
    .from("usuarios")
    .select("*")
    .eq("email", email)
    .single();

  if (!usuario) {
    await adminClient.from("log_auditoria").insert({
      tipo_acao: "LOGIN_SENHA_FALHA",
      modulo: "autenticacao",
      descricao: `Tentativa de login com e-mail não cadastrado: ${email}`,
      ip,
      user_agent: userAgent,
    });

    return new Response(
      JSON.stringify({ error: "E-mail ou senha incorretos." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!usuario.ativo) {
    await adminClient.from("log_auditoria").insert({
      usuario_ator_id: usuario.id,
      tipo_acao: "LOGIN_SENHA_FALHA",
      modulo: "autenticacao",
      descricao: `Tentativa de login por usuário inativo: ${usuario.nome} (${email})`,
      ip,
      user_agent: userAgent,
      instituicao_id: usuario.instituicao_id,
    });

    return new Response(
      JSON.stringify({ error: "Sua conta está desativada. Procure o administrador." }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // If user has no auth_user_id yet, create auth user first
  if (!usuario.auth_user_id) {
    const { data: authUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    });

    if (createError) {
      // If user already exists in auth, find and link
      const { data: { users } } = await adminClient.auth.admin.listUsers();
      const existingAuth = users?.find(u => u.email === email);
      if (existingAuth) {
        await adminClient.from("usuarios").update({ auth_user_id: existingAuth.id }).eq("id", usuario.id);
      } else {
        return new Response(
          JSON.stringify({ error: "Erro ao configurar conta. Contate o administrador." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      await adminClient.from("usuarios").update({ auth_user_id: authUser.user.id }).eq("id", usuario.id);
    }
  }

  // Now try to sign in
  const publicClient = createClient(supabaseUrl, anonKey);
  const { data: signInData, error: signInError } = await publicClient.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (signInError) {
    await adminClient.from("log_auditoria").insert({
      usuario_ator_id: usuario.id,
      tipo_acao: "LOGIN_SENHA_FALHA",
      modulo: "autenticacao",
      descricao: `Senha incorreta para: ${usuario.nome} (${email})`,
      ip,
      user_agent: userAgent,
      instituicao_id: usuario.instituicao_id,
    });

    return new Response(
      JSON.stringify({ error: "E-mail ou senha incorretos." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Update last login
  await adminClient.from("usuarios").update({ 
    ultimo_login_em: new Date().toISOString(),
    auth_user_id: signInData.user.id,
  }).eq("id", usuario.id);

  // Log success
  await adminClient.from("log_auditoria").insert({
    usuario_ator_id: usuario.id,
    tipo_acao: "LOGIN_SENHA_SUCESSO",
    modulo: "autenticacao",
    descricao: `Login por senha realizado: ${usuario.nome} (${email}) - Perfil: ${usuario.perfil}`,
    ip,
    user_agent: userAgent,
    instituicao_id: usuario.instituicao_id,
  });

  // Create session
  await adminClient.from("sessoes_usuario").insert({
    usuario_id: usuario.id,
    ip,
    user_agent: userAgent,
    metodo_login: "senha",
    instituicao_id: usuario.instituicao_id,
  });

  return new Response(
    JSON.stringify({
      session: signInData.session,
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
