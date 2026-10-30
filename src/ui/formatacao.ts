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

/** Foto do produto ou, sem foto, a inicial do nome num quadrado neutro. */
export function htmlFoto(produto: { readonly nome: string; readonly foto?: string }): string {
  return produto.foto
    ? `<img class="produto-foto" src="${escapar(produto.foto)}" alt="" loading="lazy" />`
    : `<span class="produto-foto produto-foto-vazia" aria-hidden="true">${escapar(produto.nome.charAt(0))}</span>`;
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
