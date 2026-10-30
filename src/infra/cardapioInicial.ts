import type { CadastrarProduto, DadosDoProduto } from '../aplicacao/cantina/CadastrarProduto';
import type { Usuario } from '../dominio/usuario/Usuario';

/*
 * Cardápio da Imperial Padaria, fotografado na cantina (Quiosque Brum).
 * - Tapioca não está no cardápio impresso, mas a atendente disse que é a mais vendida: preço A CONFIRMAR.
 * - Preço do Red Bull estava ilegível na foto: A CONFIRMAR.
 * - "Refrigerante lata" virou as três latas das fotos da equipe, pelo mesmo preço.
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
  prontaEntrega('Bebidas', 'Coca-Cola lata', 8, 12),
  prontaEntrega('Bebidas', 'Coca-Cola sem açúcar lata', 8, 12),
  prontaEntrega('Bebidas', 'Guaraná Antarctica lata', 8, 12),
  prontaEntrega('Bebidas', 'Red Bull 250ml', 13.6, 12, 1),
];

/** Fotos enviadas pela equipe (public/produtos). Produto sem foto aparece com um marcador neutro. */
const FOTOS: Record<string, string> = {
  'Coxinha de frango': 'coxinha-frango.jpg',
  'Coxinha de frango com requeijão': 'coxinha-frango-requeijao.jpg',
  'Coxinha de camarão com requeijão': 'coxinha-camarao-requeijao.jpg',
  'Coxinha de charque com requeijão': 'coxinha-charque-requeijao.jpg',
  'Empada de frango com requeijão': 'empada-frango-requeijao.jpg',
  'Bolo de rolo (fatia)': 'bolo-de-rolo.jpg',
  'Pudim de leite': 'pudim-de-leite.jpg',
  'Salada de frutas': 'salada-de-frutas.jpg',
  'Água mineral': 'agua-com-gas.jpg',
  'Coca-Cola lata': 'coca-cola-lata.jpg',
  'Coca-Cola sem açúcar lata': 'coca-cola-sem-acucar-lata.jpg',
  'Guaraná Antarctica lata': 'guarana-lata.jpg',
  'Red Bull 250ml': 'red-bull.jpg',
};

/** Cadastra o cardápio pela própria conta da Imperial, pelo mesmo caso de uso que a cantina usa. */
export function carregarCardapioDaImperial(cadastrar: CadastrarProduto, contaDaImperial: Usuario): void {
  for (const dados of CARDAPIO) {
    const foto = FOTOS[dados.nome];
    cadastrar.executar(contaDaImperial, { ...dados, foto: foto && `${import.meta.env.BASE_URL}produtos/${foto}` });
  }
}
