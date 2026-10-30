import type { CadastrarProduto, DadosDoProduto } from '../aplicacao/CadastrarProduto';

/*
 * Cardápio fotografado na cantina (Imperial · Quiosque Brum).
 * - Tapioca não está no cardápio impresso, mas a tia disse que é a mais vendida: preço A CONFIRMAR.
 * - Preço do Red Bull estava ilegível na foto: A CONFIRMAR.
 * - Tempos de preparo e quantidades de estoque são estimativas para a demonstração.
 */

const feitoNaHora = (categoria: string, nome: string, reais: number, minutos: number): DadosDoProduto => ({
  nome, categoria, precoEmCentavos: Math.round(reais * 100), tipo: 'perecivel', tempoDePreparoMin: minutos,
});

const prontaEntrega = (
  categoria: string, nome: string, reais: number, estoqueIdeal: number, quantidadeInicial = estoqueIdeal,
): DadosDoProduto => ({
  nome, categoria, precoEmCentavos: Math.round(reais * 100), tipo: 'nao-perecivel', estoqueIdeal, quantidadeInicial,
});

const CARDAPIO: DadosDoProduto[] = [
  feitoNaHora('Tapiocas', 'Tapioca', 10, 6),

  feitoNaHora('Salgados', 'Coxinha de frango', 12, 3),
  feitoNaHora('Salgados', 'Coxinha de batata-doce com frango', 12, 3),
  feitoNaHora('Salgados', 'Coxinha de frango com requeijão', 14, 3),
  feitoNaHora('Salgados', 'Coxinha de camarão com requeijão', 18, 3),
  feitoNaHora('Salgados', 'Coxinha de charque com requeijão', 16, 3),
  feitoNaHora('Salgados', 'Mini coxinha (porção P)', 13, 5),
  feitoNaHora('Salgados', 'Mini coxinha (porção G)', 39.9, 8),
  feitoNaHora('Salgados', 'Enroladinho de salsicha', 9.5, 3),
  feitoNaHora('Salgados', 'Empada de camarão', 15, 3),
  feitoNaHora('Salgados', 'Empada de queijo do reino', 19, 3),
  feitoNaHora('Salgados', 'Empada de frango com requeijão', 14, 3),
  feitoNaHora('Salgados', 'Pão de metro (fatia)', 15, 3),
  feitoNaHora('Salgados', 'Pizza brotinho', 16, 5),
  feitoNaHora('Salgados', 'Esfirra', 15, 3),

  feitoNaHora('Hot Dog', 'Hot dog à bolonhesa', 15, 5),
  feitoNaHora('Hot Dog', 'Hot dog ao molho de queijo', 15, 5),

  prontaEntrega('Sanduíches naturais', 'Sanduíche natural de frango', 12.5, 6),
  prontaEntrega('Sanduíches naturais', 'Sanduíche natural de ricota', 12.5, 6, 2),
  prontaEntrega('Sanduíches naturais', 'Sanduíche natural de atum', 12.5, 6),

  prontaEntrega('Sobremesas', 'Bolo de rolo (fatia)', 8.5, 8),
  prontaEntrega('Sobremesas', 'Bolo cenoura com chocolate (fatia)', 9.5, 8),
  prontaEntrega('Sobremesas', 'Bolo vulcão (fatia)', 9.5, 6),
  prontaEntrega('Sobremesas', 'Bolo de noiva (fatia)', 15.5, 6),
  prontaEntrega('Sobremesas', 'Bolo pistache', 15.9, 6),
  prontaEntrega('Sobremesas', 'Pudim de leite', 12.5, 6),
  prontaEntrega('Sobremesas', 'Salada de frutas', 12, 6),
  prontaEntrega('Sobremesas', 'Brownie Vó Carminha', 7.5, 10),

  prontaEntrega('Bebidas', 'Suco OQ', 10, 12),
  prontaEntrega('Bebidas', 'Suco Recife', 7.5, 12),
  prontaEntrega('Bebidas', 'Água mineral', 5, 24),
  prontaEntrega('Bebidas', 'Água de coco', 6, 12, 3),
  prontaEntrega('Bebidas', 'Refrigerante lata', 8, 24),
  prontaEntrega('Bebidas', 'Red Bull 250ml', 13.6, 12, 1),
];

export function carregarCardapioInicial(cadastrar: CadastrarProduto): void {
  CARDAPIO.forEach((dados) => cadastrar.executar(dados));
}
