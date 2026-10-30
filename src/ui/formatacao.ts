import type { Mensagem } from './Tela';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatarPreco(centavos: number): string {
  return moeda.format(centavos / 100);
}

const ENTIDADES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Nomes vêm de quem digita (aluno, tia): nunca vão crus para o HTML. */
export function escapar(texto: string): string {
  return texto.replace(/[&<>"']/g, (caractere) => ENTIDADES[caractere]);
}

export function htmlMensagem(mensagem: Mensagem | null): string {
  if (!mensagem) return '';
  return `<p class="mensagem mensagem-${mensagem.tipo}" role="${mensagem.tipo === 'erro' ? 'alert' : 'status'}">${escapar(mensagem.texto)}</p>`;
}

export function agruparPorCategoria<T extends { categoria: string }>(itens: T[]): Map<string, T[]> {
  const grupos = new Map<string, T[]>();
  for (const item of itens) grupos.set(item.categoria, [...(grupos.get(item.categoria) ?? []), item]);
  return grupos;
}
