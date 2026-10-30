import type { Aviso, Notificador } from '../aplicacao/portas';

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
