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
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

  const { username, senha } = await req.json();

  if (!username || !senha) {
    return new Response(JSON.stringify({ error: "Usuário e senha são obrigatórios." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const userAgent = req.headers.get("user-agent") || "unknown";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Find user by username
  const { data: usuario } = await adminClient
    .from("usuarios")
    .select("*")
    .eq("username", username)
    .single();

  if (!usuario) {
    await adminClient.from("log_auditoria").insert({
      tipo_acao: "LOGIN_FALHA",
      modulo: "autenticacao",
      descricao: `Tentativa de login com usuário não encontrado: ${username}`,
      ip,
      user_agent: userAgent,
    });

    return new Response(
      JSON.stringify({ error: "Usuário ou senha inválidos." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if blocked
  if (usuario.bloqueado_ate) {
    const bloqueadoAte = new Date(usuario.bloqueado_ate);
    if (bloqueadoAte > new Date()) {
      const minutosRestantes = Math.ceil((bloqueadoAte.getTime() - Date.now()) / 60000);
      return new Response(
        JSON.stringify({ error: `Conta bloqueada por excesso de tentativas. Tente novamente em ${minutosRestantes} minuto(s).` }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // Block expired, reset
    await adminClient.from("usuarios").update({ bloqueado_ate: null, tentativas_login_falhas: 0 }).eq("id", usuario.id);
    usuario.tentativas_login_falhas = 0;
    usuario.bloqueado_ate = null;
  }

  if (!usuario.ativo) {
    await adminClient.from("log_auditoria").insert({
      usuario_ator_id: usuario.id,
      tipo_acao: "LOGIN_FALHA",
      modulo: "autenticacao",
      descricao: `Tentativa de login por usuário inativo: ${usuario.nome} (${username})`,
      ip,
      user_agent: userAgent,
      instituicao_id: usuario.instituicao_id,
    });

    return new Response(
      JSON.stringify({ error: "Conta inativa. Procure o administrador." }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // If user has no auth_user_id yet, create auth user
  if (!usuario.auth_user_id) {
    // Use email as auth identifier, password = provided senha
    const { data: authUser, error: createError } = await adminClient.auth.admin.createUser({
      email: usuario.email || `${username}@vertice.local`,
      password: senha,
      email_confirm: true,
    });

    if (createError) {
      const { data: { users } } = await adminClient.auth.admin.listUsers();
      const existingAuth = users?.find(u => u.email === (usuario.email || `${username}@vertice.local`));
      if (existingAuth) {
        await adminClient.from("usuarios").update({ auth_user_id: existingAuth.id }).eq("id", usuario.id);
        usuario.auth_user_id = existingAuth.id;
      } else {
        return new Response(
          JSON.stringify({ error: "Erro ao configurar conta. Contate o administrador." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      await adminClient.from("usuarios").update({ auth_user_id: authUser.user.id }).eq("id", usuario.id);
      usuario.auth_user_id = authUser.user.id;
    }
  }

  // Sign in with email/password via auth
  const authEmail = usuario.email || `${username}@vertice.local`;
  const publicClient = createClient(supabaseUrl, anonKey);
  const { data: signInData, error: signInError } = await publicClient.auth.signInWithPassword({
    email: authEmail,
    password: senha,
  });

  if (signInError) {
    const novasTentativas = (usuario.tentativas_login_falhas || 0) + 1;
    const updates: Record<string, unknown> = { tentativas_login_falhas: novasTentativas };

    if (novasTentativas >= 5) {
      const bloqueadoAte = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      updates.bloqueado_ate = bloqueadoAte;

      await adminClient.from("log_auditoria").insert({
        usuario_ator_id: usuario.id,
        tipo_acao: "BLOQUEIO_POR_TENTATIVA_EXCESSO",
        modulo: "autenticacao",
        descricao: `Usuário bloqueado por 15 min após 5 tentativas: ${usuario.nome} (${username})`,
        ip,
        user_agent: userAgent,
        instituicao_id: usuario.instituicao_id,
      });
    }

    await adminClient.from("usuarios").update(updates).eq("id", usuario.id);

    await adminClient.from("log_auditoria").insert({
      usuario_ator_id: usuario.id,
      tipo_acao: "LOGIN_FALHA",
      modulo: "autenticacao",
      descricao: `Senha incorreta para: ${usuario.nome} (${username}) - Tentativa ${novasTentativas}/5`,
      ip,
      user_agent: userAgent,
      instituicao_id: usuario.instituicao_id,
    });

    const errorMsg = novasTentativas >= 5
      ? "Conta bloqueada por excesso de tentativas. Tente novamente em 15 minutos."
      : "Usuário ou senha inválidos.";

    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Success - reset failed attempts
  await adminClient.from("usuarios").update({
    ultimo_login_em: new Date().toISOString(),
    auth_user_id: signInData.user.id,
    tentativas_login_falhas: 0,
    bloqueado_ate: null,
  }).eq("id", usuario.id);

  await adminClient.from("log_auditoria").insert({
    usuario_ator_id: usuario.id,
    tipo_acao: "LOGIN_SUCESSO",
    modulo: "autenticacao",
    descricao: `Login realizado: ${usuario.nome} (${username}) - Perfil: ${usuario.perfil}`,
    ip,
    user_agent: userAgent,
    instituicao_id: usuario.instituicao_id,
  });

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
        username: usuario.username,
        perfil: usuario.perfil,
        instituicao_id: usuario.instituicao_id,
        primeiro_login_pendente: usuario.primeiro_login_pendente,
      },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
