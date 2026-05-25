/** Remove lixo comum em vars copiadas da Vercel (\\r\\n, aspas, whitespace). */
export function cleanEnv(value: string | undefined): string {
  return (value ?? '').trim().replace(/^["']|["']$/g, '').replace(/\\r\\n|\r|\n/g, '')
}
