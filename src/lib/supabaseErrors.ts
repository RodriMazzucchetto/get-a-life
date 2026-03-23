/** Extrai mensagem legível de erros do cliente Supabase / PostgREST. */
export function getSupabaseErrorMessage(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m.length > 0) return m;
  }
  if (e instanceof Error) return e.message;
  return String(e);
}

/** Mensagem para o utilizador quando a migração não foi aplicada. */
export function friendlySchemaHint(raw: string): string | null {
  const r = raw.toLowerCase();
  if (
    r.includes("does not exist") ||
    r.includes("schema cache") ||
    r.includes("could not find the table") ||
    (r.includes("relation") && r.includes("problems"))
  ) {
    return 'A tabela "problems" ainda não existe neste projeto Supabase. Abra o SQL Editor, execute o ficheiro supabase/migrations/20260325120000_problems.sql e recarregue a página.';
  }
  return null;
}
