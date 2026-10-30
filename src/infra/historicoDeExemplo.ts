import type { RepositorioDeMovimentacoes } from '../aplicacao/portas';
import { novaMovimentacao, type MotivoDaMovimentacao } from '../dominio/estoque/Movimentacao';
import type { Produto } from '../dominio/produto/Produto';

/*
 * DADOS DE DEMONSTRAÇÃO: um mês fictício de movimento da Imperial, para o Resumo não abrir
 * vazio na apresentação. Não muda o estoque atual; só preenche o histórico.
 * É determinístico (mesma semente, mesmos números) para o vídeo sair igual toda vez.
 */

const DIAS_DE_HISTORICO = 35;
/** Os três intervalos do CESAR concentram as vendas. */
const HORAS_DE_MOVIMENTO = [7, 9, 10, 10, 12, 15, 15, 16, 18, 20, 20, 21];

function geradorDeNumeros(semente: number): () => number {
  let estado = semente;
  return () => {
    estado = (estado * 1664525 + 1013904223) % 4294967296;
    return estado / 4294967296;
  };
}

export function gerarHistoricoDeExemplo(
  movimentacoes: RepositorioDeMovimentacoes,
  produtos: readonly Produto[],
  agora: Date,
): void {
  const aleatorio = geradorDeNumeros(29102026);
  const sortear = <T>(lista: readonly T[]): T => lista[Math.floor(aleatorio() * lista.length)];
  // Coxinhas e tapioca saem mais: aparecem várias vezes na lista de sorteio.
  const maisPedidos = produtos.filter((p) => /coxinha de frango|tapioca|coca-cola lata/i.test(p.nome));
  const sorteaveis = [...produtos, ...maisPedidos, ...maisPedidos, ...maisPedidos];
  const comEstoque = produtos.filter((p) => p.nivelDeEstoque() !== 'sem-controle');
  let numeroDoPedido = 1000;

  const registrar = (produto: Produto, motivo: MotivoDaMovimentacao, quantidade: number, momento: Date, pedidoNumero?: number) =>
    movimentacoes.registrar(novaMovimentacao({
      cantinaId: produto.cantinaId,
      produtoId: produto.id,
      produtoNome: produto.nome,
      motivo,
      quantidade,
      valorEmCentavos: motivo === 'venda-app' || motivo === 'venda-balcao' ? produto.precoEmCentavos * quantidade : 0,
      momento,
      pedidoNumero,
    }));

  for (let diasAtras = DIAS_DE_HISTORICO; diasAtras >= 0; diasAtras--) {
    const dia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - diasAtras);
    if (dia.getDay() === 0) continue; // domingo fechado
    const movimento = dia.getDay() === 6 ? 0.4 : 1; // sábado mais fraco
    const momentoNoDia = () => {
      const momento = new Date(dia);
      momento.setHours(sortear(HORAS_DE_MOVIMENTO), Math.floor(aleatorio() * 60));
      return momento;
    };
    const valeHoje = (momento: Date) => momento.getTime() <= agora.getTime();

    for (let i = 0; i < Math.round((12 + aleatorio() * 14) * movimento); i++) {
      const momento = momentoNoDia();
      if (valeHoje(momento)) registrar(sortear(sorteaveis), 'venda-app', 1 + Math.floor(aleatorio() * 2), momento, numeroDoPedido++);
    }
    for (let i = 0; i < Math.round((8 + aleatorio() * 12) * movimento); i++) {
      const momento = momentoNoDia();
      if (valeHoje(momento)) registrar(sortear(sorteaveis), 'venda-balcao', 1 + Math.floor(aleatorio() * 2), momento);
    }
    if (diasAtras % 3 === 0) {
      const chegada = new Date(dia);
      chegada.setHours(diasAtras % 6 === 0 ? 7 : 16, 30);
      if (valeHoje(chegada)) for (const produto of comEstoque.filter(() => aleatorio() < 0.5)) registrar(produto, 'compra', 4 + Math.floor(aleatorio() * 8), chegada);
    }
    if (aleatorio() < 0.3 && comEstoque.length) {
      const momento = momentoNoDia();
      if (valeHoje(momento)) registrar(sortear(comEstoque), 'perda', 1, momento);
    }
  }
}
