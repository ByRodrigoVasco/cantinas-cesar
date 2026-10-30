import { ErroDeDominio } from './ErroDeDominio';

const MINUTOS_NO_DIA = 24 * 60;

/**
 * Horário do dia (ex.: 20:30), imutável.
 * Ocultamento de informação: por fora ninguém sabe que guardamos "minutos desde meia-noite".
 */
export class Horario {
  private constructor(private readonly minutos: number) {}

  static de(texto: string): Horario {
    const encontrado = /^(\d{1,2}):(\d{2})$/.exec(texto.trim());
    if (!encontrado) throw new ErroDeDominio(`Horário inválido: "${texto}". Use HH:MM.`);
    const horas = Number(encontrado[1]);
    const minutos = Number(encontrado[2]);
    if (horas > 23 || minutos > 59) throw new ErroDeDominio(`Horário inválido: "${texto}".`);
    return new Horario(horas * 60 + minutos);
  }

  static deData(data: Date): Horario {
    return new Horario(data.getHours() * 60 + data.getMinutes());
  }

  menos(minutos: number): Horario {
    return new Horario((this.minutos - minutos + MINUTOS_NO_DIA) % MINUTOS_NO_DIA);
  }

  mais(minutos: number): Horario {
    return new Horario((this.minutos + minutos) % MINUTOS_NO_DIA);
  }

  ehAntesDe(outro: Horario): boolean {
    return this.minutos < outro.minutos;
  }

  comparar(outro: Horario): number {
    return this.minutos - outro.minutos;
  }

  toString(): string {
    const hh = String(Math.floor(this.minutos / 60)).padStart(2, '0');
    const mm = String(this.minutos % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}
