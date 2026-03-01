import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { checkPasswordLeaked, HIBP_ERROR_MSG } from "../_shared/hibp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function validarSenha(senha: string): string | null {
  if (senha.length < 6) return "A senha deve ter no mínimo 6 caracteres.";
  if (!/[a-zA-Z]/.test(senha)) return "A senha deve conter pelo menos 1 letra.";
  if (!/[0-9]/.test(senha)) return "A senha deve conter pelo menos 1 número.";
  if (!/[^a-zA-Z0-9]/.test(senha)) return "A senha deve conter pelo menos 1 caractere especial.";
  return null;
}

function gerarSenhaProvisoria(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
  const nums = "23456789";
  const specials = "@#$%&*!";
  let senha = "";
  // 4 letters
  for (let i = 0; i < 4; i++) senha += chars[Math.floor(Math.random() * chars.length)];
  // 2 numbers
  for (let i = 0; i < 2; i++) senha += nums[Math.floor(Math.random() * nums.length)];
  // 1 special
  senha += specials[Math.floor(Math.random() * specials.length)];
  // 1 more letter
  senha += chars[Math.floor(Math.random() * chars.length)];
  // Shuffle
  return senha.split("").sort(() => Math.random() - 0.5).join("");
}

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

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Verify caller identity
  const { data: { user: authUser }, error: authError } = await adminClient.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !authUser) {
    return new Response(JSON.stringify({ error: "Token inválido" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: callerUser } = await adminClient
    .from("usuarios")
    .select("id, perfil, instituicao_id")
    .eq("auth_user_id", authUser.id)
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
        .select("id, nome, email, username, perfil, ativo, primeiro_login_pendente, ultimo_login_em, criado_em")
        .eq("instituicao_id", callerUser.instituicao_id)
        .order("criado_em", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GENERATE PASSWORD
    if (req.method === "GET" && action === "gerar-senha") {
      return new Response(JSON.stringify({ senha: gerarSenhaProvisoria() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CREATE USER
    if (req.method === "POST" && action === "create") {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return new Response(JSON.stringify({ error: "Corpo da requisição inválido." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { nome, username, email, perfil, senha } = body as Record<string, string>;

      if (!nome || !username || !perfil || !senha) {
        return new Response(JSON.stringify({ error: "Campos obrigatórios: nome, username, perfil, senha" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Input validation: types and length limits
      if (typeof nome !== "string" || nome.length > 200) {
        return new Response(JSON.stringify({ error: "Nome inválido ou excede 200 caracteres." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (typeof username !== "string" || username.length > 50 || !/^[a-z0-9._-]+$/.test(username)) {
        return new Response(JSON.stringify({ error: "Username inválido. Use apenas letras minúsculas, números, pontos, hífens e underscores (máx 50)." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (email && (typeof email !== "string" || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
        return new Response(JSON.stringify({ error: "Formato de email inválido." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (typeof senha !== "string" || senha.length > 128) {
        return new Response(JSON.stringify({ error: "Senha excede o tamanho permitido." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const validPerfis = ["administrador", "sala_espera", "sala_principal", "presidente"];
      if (!validPerfis.includes(perfil)) {
        return new Response(JSON.stringify({ error: "Perfil inválido." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate password
      const erroSenha = validarSenha(senha);
      if (erroSenha) {
        return new Response(JSON.stringify({ error: erroSenha }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if password has been leaked
      const leakedCount = await checkPasswordLeaked(senha);
      if (leakedCount > 0) {
        return new Response(JSON.stringify({ error: HIBP_ERROR_MSG }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check username uniqueness
      const { data: existingUser } = await adminClient
        .from("usuarios")
        .select("id")
        .eq("username", username)
        .single();

      if (existingUser) {
        return new Response(JSON.stringify({ error: "Nome de usuário já está em uso." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create auth user with email (or generated email from username)
      const authEmail = email || `${username}@vertice.local`;
      const { data: newAuthUser, error: authCreateError } = await adminClient.auth.admin.createUser({
        email: authEmail,
        password: senha,
        email_confirm: true,
      });

      if (authCreateError) {
        return new Response(JSON.stringify({ error: authCreateError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: newUser, error: profileError } = await adminClient
        .from("usuarios")
        .insert({
          auth_user_id: newAuthUser.user.id,
          nome,
          username,
          email: authEmail,
          perfil,
          primeiro_login_pendente: true,
          instituicao_id: callerUser.instituicao_id,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      await adminClient.from("log_auditoria").insert({
        usuario_ator_id: callerUser.id,
        usuario_alvo_id: newUser.id,
        tipo_acao: "CRIACAO_USUARIO",
        modulo: "usuarios",
        descricao: `Usuário criado: ${nome} (@${username}) - Perfil: ${perfil}`,
        instituicao_id: callerUser.instituicao_id,
      });

      return new Response(JSON.stringify(newUser), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UPDATE USER
    if (req.method === "PUT" && action === "update") {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return new Response(JSON.stringify({ error: "Corpo da requisição inválido." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { id, nome, username, email, perfil, ativo } = body as Record<string, unknown>;

      if (!id || typeof id !== "string") {
        return new Response(JSON.stringify({ error: "ID do usuário é obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate optional fields
      if (nome !== undefined && (typeof nome !== "string" || nome.length > 200)) {
        return new Response(JSON.stringify({ error: "Nome inválido ou excede 200 caracteres." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (username !== undefined && (typeof username !== "string" || username.length > 50 || !/^[a-z0-9._-]+$/.test(username as string))) {
        return new Response(JSON.stringify({ error: "Username inválido." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (email !== undefined && (typeof email !== "string" || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email as string))) {
        return new Response(JSON.stringify({ error: "Formato de email inválido." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (perfil !== undefined) {
        const validPerfis = ["administrador", "sala_espera", "sala_principal", "presidente"];
        if (typeof perfil !== "string" || !validPerfis.includes(perfil as string)) {
          return new Response(JSON.stringify({ error: "Perfil inválido." }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
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
      if (username !== undefined && username !== existingUser.username) {
        // Check uniqueness
        const { data: dup } = await adminClient.from("usuarios").select("id").eq("username", username).single();
        if (dup) {
          return new Response(JSON.stringify({ error: "Nome de usuário já está em uso." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        updates.username = username;
        changes.push(`Username: ${existingUser.username} → ${username}`);
      }
      if (email !== undefined && email !== existingUser.email) {
        updates.email = email;
        changes.push(`Email: ${existingUser.email} → ${email}`);
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
        tipo_acao: "EDICAO_USUARIO",
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
      let resetBody: unknown;
      try {
        resetBody = await req.json();
      } catch {
        return new Response(JSON.stringify({ error: "Corpo da requisição inválido." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { id, nova_senha, gerar_automatica } = resetBody as Record<string, unknown>;

      if (!id || typeof id !== "string") {
        return new Response(JSON.stringify({ error: "ID do usuário é obrigatório." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (nova_senha !== undefined && (typeof nova_senha !== "string" || nova_senha.length > 128)) {
        return new Response(JSON.stringify({ error: "Senha excede o tamanho permitido." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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

      const senhaFinal = gerar_automatica ? gerarSenhaProvisoria() : nova_senha;

      if (!senhaFinal) {
        return new Response(JSON.stringify({ error: "Senha é obrigatória" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const erroSenha = validarSenha(senhaFinal);
      if (erroSenha) {
        return new Response(JSON.stringify({ error: erroSenha }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if password has been leaked
      const leakedCountReset = await checkPasswordLeaked(senhaFinal);
      if (leakedCountReset > 0) {
        return new Response(JSON.stringify({ error: HIBP_ERROR_MSG }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await adminClient.auth.admin.updateUserById(targetUser.auth_user_id, {
        password: senhaFinal,
      });

      if (error) throw error;

      await adminClient
        .from("usuarios")
        .update({ primeiro_login_pendente: true, tentativas_login_falhas: 0, bloqueado_ate: null })
        .eq("id", id);

      await adminClient.from("log_auditoria").insert({
        usuario_ator_id: callerUser.id,
        usuario_alvo_id: targetUser.id,
        tipo_acao: "RESET_SENHA",
        modulo: "usuarios",
        descricao: `Senha resetada pelo administrador para: ${targetUser.nome} (@${targetUser.username})`,
        instituicao_id: callerUser.instituicao_id,
      });

      return new Response(JSON.stringify({ success: true, senha_gerada: gerar_automatica ? senhaFinal : undefined }), {
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
