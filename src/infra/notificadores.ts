import type { Aviso, Notificador } from '../aplicacao/portas';

/** Mostra o aviso na tela do aluno (quem quiser ouvir se inscreve). */
export class NotificadorNaTela implements Notificador {
  private readonly ouvintes: ((aviso: Aviso) => void)[] = [];

  inscrever(ouvinte: (aviso: Aviso) => void): void {
    this.ouvintes.push(ouvinte);
  }

  notificar(aviso: Aviso): void {
    this.ouvintes.forEach((ouvinte) => ouvinte(aviso));
  }
}

/**
 * Avisa por vários canais ao mesmo tempo. Novo canal (som, WhatsApp, e-mail) = nova classe
 * que implementa Notificador + uma linha em main.ts; nenhuma classe existente muda (Aberto/Fechado).
 */
export class NotificadorComposto implements Notificador {
  constructor(private readonly canais: Notificador[]) {}

  notificar(aviso: Aviso): void {
    this.canais.forEach((canal) => canal.notificar(aviso));
  }
}
