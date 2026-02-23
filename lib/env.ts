const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;

type EnvKey = (typeof required)[number] | "SUPABASE_SERVICE_ROLE_KEY";

export function getEnv(key: EnvKey) {
  const value = process.env[key];
  if (!value && required.includes(key as (typeof required)[number])) {
    throw new Error(`Variavel ausente: ${key}`);
  }
  return value ?? "";
}
