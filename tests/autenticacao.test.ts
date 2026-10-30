import { beforeEach, describe, expect, it } from 'vitest';
import { Autenticacao } from '../src/aplicacao/Autenticacao';
import { CadastrarAluno } from '../src/aplicacao/CadastrarAluno';
import { ErroDeDominio } from '../src/dominio/ErroDeDominio';
import { Usuario } from '../src/dominio/usuario/Usuario';
import { RepositorioDeUsuariosEmMemoria, SessaoEmMemoria } from '../src/infra/RepositoriosEmMemoria';

describe('Autenticação', () => {
  let usuarios: RepositorioDeUsuariosEmMemoria;
  let sessao: SessaoEmMemoria;
  let autenticacao: Autenticacao;
  let cadastrar: CadastrarAluno;

  beforeEach(() => {
    usuarios = new RepositorioDeUsuariosEmMemoria();
    sessao = new SessaoEmMemoria();
    autenticacao = new Autenticacao(usuarios, sessao);
    cadastrar = new CadastrarAluno(usuarios, sessao);
    usuarios.salvar(new Usuario('tia', 'Tia da cantina', 'cantina@imperial.com.br', 'cantina', 'segredo1'));
  });

  it('entra com e-mail e senha certos, ignorando maiúsculas e espaços no e-mail', () => {
    const usuario = autenticacao.entrar('  Cantina@Imperial.com.br ', 'segredo1');
    expect(usuario.perfil).toBe('cantina');
    expect(autenticacao.usuarioAtual()?.id).toBe('tia');
  });

  it('mesma mensagem para senha errada e e-mail inexistente', () => {
    expect(() => autenticacao.entrar('cantina@imperial.com.br', 'errada')).toThrow('E-mail ou senha incorretos.');
    expect(() => autenticacao.entrar('ninguem@cesar.school', 'segredo1')).toThrow('E-mail ou senha incorretos.');
    expect(autenticacao.usuarioAtual()).toBeUndefined();
  });

  it('sair encerra a sessão', () => {
    autenticacao.entrar('cantina@imperial.com.br', 'segredo1');
    autenticacao.sair();
    expect(autenticacao.usuarioAtual()).toBeUndefined();
  });

  it('aluno cria conta com e-mail da escola e já fica logado', () => {
    const aluno = cadastrar.executar({ nome: 'Ana Souza', email: 'ana@cesar.school', senha: 'senha123' });
    expect(aluno.perfil).toBe('aluno');
    expect(aluno.primeiroNome).toBe('Ana');
    expect(autenticacao.usuarioAtual()?.id).toBe(aluno.id);
  });

  it('recusa e-mail de fora da escola, e-mail repetido e senha curta', () => {
    expect(() => cadastrar.executar({ nome: 'Ana', email: 'ana@gmail.com', senha: 'senha123' })).toThrow('e-mail da escola');
    cadastrar.executar({ nome: 'Ana', email: 'ana@cesar.school', senha: 'senha123' });
    expect(() => cadastrar.executar({ nome: 'Outra', email: 'ANA@cesar.school', senha: 'senha123' })).toThrow('Já existe');
    expect(() => cadastrar.executar({ nome: 'Beto', email: 'beto@cesar.school', senha: '123' })).toThrow(ErroDeDominio);
  });
});
