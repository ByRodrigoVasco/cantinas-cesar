import type { Cantina, CoresDoCardapio } from '../../dominio/cantina/Cantina';
import { ErroDeDominio } from '../../dominio/ErroDeDominio';
import type { Usuario } from '../../dominio/usuario/Usuario';
import { cantinaDe } from '../autorizacao';
import type { RepositorioDeCantinas } from '../portas';

/** Acesso cantina: configurações da própria cantina (por enquanto, as cores do cardápio). */
export class ConfigurarCantina {
  constructor(private readonly cantinas: RepositorioDeCantinas) {}

  minhaCantina(quem: Usuario): Cantina {
    const cantina = this.cantinas.buscarPorId(cantinaDe(quem));
    if (!cantina) throw new ErroDeDominio('Cantina não encontrada.');
    return cantina;
  }

  mudarCores(quem: Usuario, cores: CoresDoCardapio): void {
    const cantina = this.minhaCantina(quem);
    cantina.mudarCores(cores);
    this.cantinas.salvar(cantina);
  }
}
