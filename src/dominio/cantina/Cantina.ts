import { ErroDeDominio } from '../ErroDeDominio';

/** Cores que a cantina escolhe para o próprio cardápio virtual. */
export interface CoresDoCardapio {
  readonly principal: string;
  readonly secundaria1: string;
  readonly secundaria2: string;
}

export interface CantinaSalva {
  readonly id: string;
  readonly nome: string;
  readonly local: string;
  readonly logo?: string;
  readonly cores: CoresDoCardapio;
}

/** Cantina nova começa com as cores do CESAR até escolher as dela. */
export const CORES_PADRAO: CoresDoCardapio = { principal: '#ff6002', secundaria1: '#070606', secundaria2: '#dd3300' };

const FORMATO_DE_COR = /^#[0-9a-f]{6}$/i;

/** Uma das cantinas do campus. Produtos, pedidos e a conta de acesso apontam para ela. */
export class Cantina {
  private _cores: CoresDoCardapio;

  constructor(
    readonly id: string,
    readonly nome: string,
    /** Onde fica no campus, para o estudante achar (ex.: "Quiosque Brum"). */
    readonly local: string,
    readonly logo?: string,
    cores: CoresDoCardapio = CORES_PADRAO,
  ) {
    if (!nome.trim()) throw new ErroDeDominio('A cantina precisa de um nome.');
    this._cores = validarCores(cores);
  }

  get cores(): CoresDoCardapio {
    return this._cores;
  }

  mudarCores(cores: CoresDoCardapio): void {
    this._cores = validarCores(cores);
  }

  paraDados(): CantinaSalva {
    return { id: this.id, nome: this.nome, local: this.local, logo: this.logo, cores: this._cores };
  }

  static deDados(dados: CantinaSalva): Cantina {
    return new Cantina(dados.id, dados.nome, dados.local, dados.logo, dados.cores);
  }
}

function validarCores(cores: CoresDoCardapio): CoresDoCardapio {
  const lista = [cores.principal, cores.secundaria1, cores.secundaria2];
  if (!lista.every((cor) => FORMATO_DE_COR.test(cor))) throw new ErroDeDominio('Cor inválida: use o formato #RRGGBB.');
  return {
    principal: cores.principal.toLowerCase(),
    secundaria1: cores.secundaria1.toLowerCase(),
    secundaria2: cores.secundaria2.toLowerCase(),
  };
}
