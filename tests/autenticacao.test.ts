import { beforeEach, describe, expect, it } from 'vitest';
import { ErroDeDominio } from '../src/dominio/ErroDeDominio';
import { Usuario } from '../src/dominio/usuario/Usuario';
import { montarCenario } from './cenario';

let c: ReturnType<typeof montarCenario>;
beforeEach(() => {
  c = montarCenario();
});

describe('Três acessos', () => {
  it('cada acesso entra pelo mesmo lugar, ignorando maiúsculas e espaços no e-mail', () => {
    expect(c.casos.autenticacao.entrar('  Gestao@CESAR.school ', 'senha123').perfil).toBe('cesar');
    expect(c.casos.autenticacao.entrar('imperial@cantina.com', 'senha123').perfil).toBe('cantina');
    expect(c.casos.autenticacao.entrar('ana@cesar.school', 'senha123').perfil).toBe('estudante');
  });

  it('mesma mensagem para senha errada e e-mail inexistente', () => {
    expect(() => c.casos.autenticacao.entrar('ana@cesar.school', 'errada')).toThrow('E-mail ou senha incorretos.');
    expect(() => c.casos.autenticacao.entrar('ninguem@cesar.school', 'senha123')).toThrow('E-mail ou senha incorretos.');
    expect(c.casos.autenticacao.usuarioAtual()).toBeUndefined();
  });

  it('sair encerra a sessão', () => {
    c.casos.autenticacao.entrar('ana@cesar.school', 'senha123');
    c.casos.autenticacao.sair();
    expect(c.casos.autenticacao.usuarioAtual()).toBeUndefined();
  });

  it('toda conta de cantina é ligada a uma cantina, e só ela', () => {
    expect(() => new Usuario('x', 'X', 'x@x.com', 'cantina', 'senha123')).toThrow(ErroDeDominio);
    expect(() => new Usuario('x', 'X', 'x@cesar.school', 'estudante', 'senha123', 'c1')).toThrow(ErroDeDominio);
  });
});

describe('Estudante cria a própria conta', () => {
  it('com e-mail institucional, já fica logado e sempre como estudante', () => {
    const conta = c.casos.cadastrarEstudante.executar({ nome: 'Carla Lima', email: 'carla@cesar.school', senha: 'senha123' });
    expect(conta.perfil).toBe('estudante');
    expect(conta.primeiroNome).toBe('Carla');
    expect(c.casos.autenticacao.usuarioAtual()?.id).toBe(conta.id);
  });

  it('recusa e-mail de fora, e-mail repetido e senha curta', () => {
    expect(() => c.casos.cadastrarEstudante.executar({ nome: 'C', email: 'carla@gmail.com', senha: 'senha123' })).toThrow('institucional');
    expect(() => c.casos.cadastrarEstudante.executar({ nome: 'A', email: 'ANA@cesar.school', senha: 'senha123' })).toThrow('Já existe');
    expect(() => c.casos.cadastrarEstudante.executar({ nome: 'D', email: 'd@cesar.school', senha: '123' })).toThrow(ErroDeDominio);
  });
});

describe('CESAR cria cantinas', () => {
  const dados = { nome: 'Lanchonete Nova', local: 'Térreo', responsavel: 'Marta', email: 'nova@cantina.com', senha: 'senha123' };

  it('cria a cantina e a conta dela, que já entra no painel', () => {
    const cantina = c.casos.cadastrarCantina.executar(c.gestao, dados);
    const conta = c.casos.autenticacao.entrar('nova@cantina.com', 'senha123');
    expect(conta.perfil).toBe('cantina');
    expect(conta.cantinaId).toBe(cantina.id);
    expect(c.casos.consultar.vitrine().map((x) => x.cantina.nome)).toContain('Lanchonete Nova');
  });

  it('só o CESAR cria cantina', () => {
    expect(() => c.casos.cadastrarCantina.executar(c.ana, dados)).toThrow('não tem acesso');
    expect(() => c.casos.cadastrarCantina.executar(c.imperial.conta, dados)).toThrow('não tem acesso');
  });

  it('e-mail já usado não cria nada pela metade', () => {
    const antes = c.casos.consultar.vitrine().length;
    expect(() => c.casos.cadastrarCantina.executar(c.gestao, { ...dados, email: 'ana@cesar.school' })).toThrow('já é usado');
    expect(() => c.casos.cadastrarCantina.executar(c.gestao, { ...dados, senha: '123' })).toThrow(ErroDeDominio);
    expect(c.casos.consultar.vitrine()).toHaveLength(antes);
  });
});
