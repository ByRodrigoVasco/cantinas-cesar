/**
 * Ponto único de troca dos ícones. Enquanto a equipe escolhe a biblioteca, cada ícone é um
 * <span> vazio (escondido pelo CSS) que guarda o nome; ao adotar a biblioteca, só esta
 * função muda e nenhuma tela precisa ser tocada.
 */
export type NomeDoIcone =
  | 'aluno'
  | 'cantina'
  | 'sino'
  | 'relogio'
  | 'confirmar'
  | 'vazio'
  | 'tapioca'
  | 'salgado'
  | 'hot-dog'
  | 'sanduiche'
  | 'sobremesa'
  | 'bebida'
  | 'outros';

export function icone(nome: NomeDoIcone): string {
  return `<span class="icone" data-icone="${nome}" aria-hidden="true"></span>`;
}

const ICONE_DA_CATEGORIA: Record<string, NomeDoIcone> = {
  Tapiocas: 'tapioca',
  Salgados: 'salgado',
  'Hot Dog': 'hot-dog',
  'Sanduíches naturais': 'sanduiche',
  Sobremesas: 'sobremesa',
  Bebidas: 'bebida',
};

export function iconeDaCategoria(categoria: string): string {
  return icone(ICONE_DA_CATEGORIA[categoria] ?? 'outros');
}
