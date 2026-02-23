import { z } from "zod";

export const estoqueSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(2).max(160),
  categoria: z.string().max(120).optional().or(z.literal("")),
  sku: z.string().max(80).optional().or(z.literal("")),
  unidade: z.string().min(1).max(20),
  quantidade_atual: z.coerce.number().nonnegative("Quantidade atual invalida"),
  quantidade_minima: z.coerce.number().nonnegative("Quantidade minima invalida"),
  custo_medio: z.union([z.coerce.number().nonnegative("Custo invalido"), z.literal("")]).optional(),
  valor_venda: z.union([z.coerce.number().nonnegative("Valor de venda invalido"), z.literal("")]).optional(),
  validade: z.string().optional().or(z.literal("")),
  lote: z.string().max(120).optional().or(z.literal("")),
  fornecedor: z.string().max(160).optional().or(z.literal("")),
  observacoes: z.string().max(2000).optional().or(z.literal(""))
});

export type EstoqueInput = z.infer<typeof estoqueSchema>;
