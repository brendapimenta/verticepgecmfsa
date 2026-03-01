import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { nova_senha } = await req.json();
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Validate new password
  const erroValidacao = validarSenha(nova_senha);
  if (erroValidacao) {
    return new Response(JSON.stringify({ error: erroValidacao }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Get user from token
  const { data: { user }, error: userError } = await adminClient.auth.getUser(authHeader.replace("Bearer ", ""));
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Token inválido" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Update password
  const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
    password: nova_senha,
  });

  if (updateError) {
    return new Response(JSON.stringify({ error: "Erro ao atualizar senha." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Get usuario profile
  const { data: usuario } = await adminClient
    .from("usuarios")
    .select("id, nome, username, instituicao_id")
    .eq("auth_user_id", user.id)
    .single();

  // Update primeiro_login_pendente
  if (usuario) {
    await adminClient
      .from("usuarios")
      .update({ primeiro_login_pendente: false })
      .eq("id", usuario.id);

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    await adminClient.from("log_auditoria").insert({
      usuario_ator_id: usuario.id,
      tipo_acao: "TROCA_SENHA_PRIMEIRO_LOGIN",
      modulo: "autenticacao",
      descricao: `Troca de senha no primeiro acesso: ${usuario.nome} (${usuario.username})`,
      ip,
      user_agent: userAgent,
      instituicao_id: usuario.instituicao_id,
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
