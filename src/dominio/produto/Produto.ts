import { ErroDeDominio } from '../ErroDeDominio';
import { ehReabastecivel, type PoliticaDeDisponibilidade, type PoliticaSalva } from './PoliticaDeDisponibilidade';
import { restaurarPolitica } from './restaurarPolitica';

export interface ProdutoSalvo {
  readonly id: string;
  readonly nome: string;
  readonly categoria: string;
  readonly precoEmCentavos: number;
  readonly foto?: string;
  readonly noCardapio: boolean;
  readonly politica: PoliticaSalva;
}

/**
 * Item vendido pela cantina. Quem usa Produto conversa só com ele — nunca com
 * produto.politica.algumaCoisa() (Lei de Demeter).
 */
export class Produto {
  private noCardapio = true;

  constructor(
    readonly id: string,
    readonly nome: string,
    readonly categoria: string,
    readonly precoEmCentavos: number,
    private readonly politica: PoliticaDeDisponibilidade,
    /** Caminho da foto, opcional: produto sem foto aparece com um marcador neutro. */
    readonly foto?: string,
  ) {
    if (!nome.trim()) throw new ErroDeDominio('Produto precisa de um nome.');
    if (!Number.isInteger(precoEmCentavos) || precoEmCentavos <= 0) {
      throw new ErroDeDominio('Preço deve ser maior que zero.');
    }
  }

  get estaNoCardapio(): boolean {
    return this.noCardapio;
  }

  get tempoDePreparoMin(): number {
    return this.politica.tempoDePreparoMin;
  }

  get ehFeitoNaHora(): boolean {
    return !ehReabastecivel(this.politica);
  }

  /** Para não perecíveis; perecíveis não têm estoque e retornam undefined. */
  get quantidadeEmEstoque(): number | undefined {
    return ehReabastecivel(this.politica) ? this.politica.quantidadeEmEstoque : undefined;
  }

  estaDisponivel(quantidade = 1): boolean {
    return this.noCardapio && this.politica.podeAtender(quantidade);
  }

  reservar(quantidade: number): void {
    if (!this.estaDisponivel(quantidade)) {
      throw new ErroDeDominio(`${this.nome} não está disponível nessa quantidade.`);
    }
    this.politica.reservar(quantidade);
  }

  liberar(quantidade: number): void {
    this.politica.liberar(quantidade);
  }

  tirarDoCardapio(): void {
    this.noCardapio = false;
  }

  voltarAoCardapio(): void {
    this.noCardapio = true;
  }

  precisaRepor(): boolean {
    return ehReabastecivel(this.politica) && this.politica.precisaRepor();
  }

  sugestaoDeReposicao(): number {
    return ehReabastecivel(this.politica) ? this.politica.sugestaoDeReposicao() : 0;
  }

  reabastecer(quantidade: number): void {
    if (!ehReabastecivel(this.politica)) {
      throw new ErroDeDominio(`${this.nome} é feito na hora e não tem estoque.`);
    }
    this.politica.reabastecer(quantidade);
  }

  descricaoDisponibilidade(): string {
    return this.noCardapio ? this.politica.descricao() : 'Fora do cardápio hoje';
  }

  paraDados(): ProdutoSalvo {
    return {
      id: this.id,
      nome: this.nome,
      categoria: this.categoria,
      precoEmCentavos: this.precoEmCentavos,
      foto: this.foto,
      noCardapio: this.noCardapio,
      politica: this.politica.paraDados(),
    };
  }

  static deDados(dados: ProdutoSalvo): Produto {
    const produto = new Produto(
      dados.id, dados.nome, dados.categoria, dados.precoEmCentavos, restaurarPolitica(dados.politica), dados.foto,
    );
    produto.noCardapio = dados.noCardapio;
    return produto;
  }
}
