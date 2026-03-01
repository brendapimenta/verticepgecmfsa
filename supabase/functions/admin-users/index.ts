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

  // Verify caller is authenticated admin
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

  const callerAuthId = claimsData.claims.sub;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Check caller is admin
  const { data: callerUser } = await adminClient
    .from("usuarios")
    .select("id, perfil, instituicao_id")
    .eq("auth_user_id", callerAuthId)
    .single();

  if (!callerUser || callerUser.perfil !== "administrador") {
    return new Response(JSON.stringify({ error: "Acesso restrito ao administrador" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    // LIST USERS
    if (req.method === "GET" && action === "list") {
      const { data, error } = await adminClient
        .from("usuarios")
        .select("*")
        .eq("instituicao_id", callerUser.instituicao_id)
        .order("criado_em", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CREATE USER
    if (req.method === "POST" && action === "create") {
      const body = await req.json();
      const { nome, email, perfil, senha, login_google_habilitado } = body;

      if (!nome || !email || !perfil || !senha) {
        return new Response(JSON.stringify({ error: "Campos obrigatórios: nome, email, perfil, senha" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create auth user
      const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
      });

      if (authError) {
        return new Response(JSON.stringify({ error: authError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create profile
      const { data: newUser, error: profileError } = await adminClient
        .from("usuarios")
        .insert({
          auth_user_id: authUser.user.id,
          nome,
          email,
          perfil,
          login_google_habilitado: login_google_habilitado || false,
          instituicao_id: callerUser.instituicao_id,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Audit log
      await adminClient.from("log_auditoria").insert({
        usuario_ator_id: callerUser.id,
        usuario_alvo_id: newUser.id,
        tipo_acao: "CRIAR_USUARIO",
        modulo: "usuarios",
        descricao: `Usuário criado: ${nome} (${email}) - Perfil: ${perfil}`,
        instituicao_id: callerUser.instituicao_id,
      });

      return new Response(JSON.stringify(newUser), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UPDATE USER
    if (req.method === "PUT" && action === "update") {
      const body = await req.json();
      const { id, nome, email, perfil, ativo, login_google_habilitado } = body;

      if (!id) {
        return new Response(JSON.stringify({ error: "ID do usuário é obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existingUser } = await adminClient
        .from("usuarios")
        .select("*")
        .eq("id", id)
        .eq("instituicao_id", callerUser.instituicao_id)
        .single();

      if (!existingUser) {
        return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updates: Record<string, unknown> = {};
      const changes: string[] = [];

      if (nome !== undefined && nome !== existingUser.nome) {
        updates.nome = nome;
        changes.push(`Nome: ${existingUser.nome} → ${nome}`);
      }
      if (email !== undefined && email !== existingUser.email) {
        updates.email = email;
        changes.push(`Email: ${existingUser.email} → ${email}`);
        // Also update auth email
        if (existingUser.auth_user_id) {
          await adminClient.auth.admin.updateUserById(existingUser.auth_user_id, { email });
        }
      }
      if (perfil !== undefined && perfil !== existingUser.perfil) {
        updates.perfil = perfil;
        changes.push(`Perfil: ${existingUser.perfil} → ${perfil}`);
      }
      if (ativo !== undefined && ativo !== existingUser.ativo) {
        updates.ativo = ativo;
        changes.push(`Status: ${existingUser.ativo ? "Ativo" : "Inativo"} → ${ativo ? "Ativo" : "Inativo"}`);
      }
      if (login_google_habilitado !== undefined && login_google_habilitado !== existingUser.login_google_habilitado) {
        updates.login_google_habilitado = login_google_habilitado;
        changes.push(`Login Google: ${existingUser.login_google_habilitado ? "Sim" : "Não"} → ${login_google_habilitado ? "Sim" : "Não"}`);

        await adminClient.from("log_auditoria").insert({
          usuario_ator_id: callerUser.id,
          usuario_alvo_id: existingUser.id,
          tipo_acao: login_google_habilitado ? "HABILITAR_LOGIN_GOOGLE_USUARIO" : "DESABILITAR_LOGIN_GOOGLE_USUARIO",
          modulo: "usuarios",
          descricao: `Login Google ${login_google_habilitado ? "habilitado" : "desabilitado"} para: ${existingUser.nome}`,
          instituicao_id: callerUser.instituicao_id,
        });
      }

      if (Object.keys(updates).length === 0) {
        return new Response(JSON.stringify({ message: "Nenhuma alteração" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: updatedUser, error: updateError } = await adminClient
        .from("usuarios")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      await adminClient.from("log_auditoria").insert({
        usuario_ator_id: callerUser.id,
        usuario_alvo_id: existingUser.id,
        tipo_acao: "EDITAR_USUARIO",
        modulo: "usuarios",
        descricao: `Usuário editado: ${existingUser.nome}. Alterações: ${changes.join("; ")}`,
        valor_anterior: JSON.stringify(changes.map(c => c.split(" → ")[0])),
        valor_novo: JSON.stringify(changes.map(c => c.split(" → ")[1])),
        instituicao_id: callerUser.instituicao_id,
      });

      return new Response(JSON.stringify(updatedUser), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // RESET PASSWORD
    if (req.method === "POST" && action === "reset-password") {
      const { id, nova_senha } = await req.json();

      const { data: targetUser } = await adminClient
        .from("usuarios")
        .select("*")
        .eq("id", id)
        .eq("instituicao_id", callerUser.instituicao_id)
        .single();

      if (!targetUser?.auth_user_id) {
        return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await adminClient.auth.admin.updateUserById(targetUser.auth_user_id, {
        password: nova_senha,
      });

      if (error) throw error;

      await adminClient
        .from("usuarios")
        .update({ primeiro_login_pendente: true })
        .eq("id", id);

      await adminClient.from("log_auditoria").insert({
        usuario_ator_id: callerUser.id,
        usuario_alvo_id: targetUser.id,
        tipo_acao: "RESET_SENHA",
        modulo: "usuarios",
        descricao: `Senha resetada pelo administrador para: ${targetUser.nome}`,
        instituicao_id: callerUser.instituicao_id,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação não reconhecida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
