# Cantina CESAR: 15 minutos, zero fila

PoC para o Hackathon Relâmpago #1 de FDS 2026.2 (cap. 5, *Engenharia de Software Moderna*).

O aluno **entra com o e-mail da escola**, **agenda o lanche** para o horário do intervalo, a tia **prepara na ordem certa** e,
com **um toque em "Pronto"**, o aluno recebe o aviso e vai direto ao balcão, sem fila.

## Por que esse app

Conversamos com a atendente da cantina durante o expediente:

- **Tapioca** é a campeã de vendas, seguida da **coxinha**.
- Ela anota os pedidos **no papel** e trabalha em dupla.
- Alguns alunos já pedem antes ("quero uma coxinha para as X horas") e pagam. Assim **não pegam fila**.
- Ela pediu: *"teria como comunicar com o aluno quando o pedido dele estivesse pronto"*.
- Ela pede ao fornecedor **pelo WhatsApp** todos os dias, em duas entregas (manhã e 16h30).

Restrição da equipe: **a tia não pode ganhar trabalho novo.** Tudo o que dá para automatizar é automático.

| Para o aluno | Para a tia (automático) |
|---|---|
| Cardápio do dia por categoria | Fila ordenada por "começar a preparar às…" |
| Agendar com horário de retirada | Resumo para preparar em lote ("3× Tapioca") |
| Aviso "pedido pronto" na tela | Estoque baixa sozinho; item zerado vira "Esgotado" |
| Cancelar / pedir de novo | Lista de compras pronta para o WhatsApp + "entrega chegou" em 1 toque |

Os casos de uso seguem o diagrama da equipe: *cadastrar produto (perecível / não perecível)*,
*gerenciar estoque e cardápio*, *visualizar cardápio*, *agendar compra* e *visualizar pedidos agendados*.
Também acrescentamos *avisar pedido pronto*, que a tia pediu.

## Como rodar

Requisito: Node.js 18+.

```bash
npm install
npm run dev      # abre em http://localhost:5173
npm test         # 40 testes de domínio, casos de uso, login e persistência
```

**Contas de demonstração** (em [`dadosDeDemonstracao.ts`](src/infra/dadosDeDemonstracao.ts)). Na tela de login,
os botões *Entrar como aluno* e *Entrar como cantina* entram sem digitar nada:

| Perfil | E-mail | Senha |
|---|---|---|
| Cantina | `cantina@imperial.com.br` | `imperial123` |
| Aluno | `aluno@cesar.school` | `cesar123` |

Qualquer aluno também pode **criar a própria conta** com um e-mail `@cesar.school`.

**Para o vídeo:** abra o aluno numa aba e a cantina em outra. Quando a tia toca em *Pronto*, o aviso
aparece na aba do aluno na hora. *Restaurar dados iniciais*, na tela de login, zera tudo.

Não há backend: pedidos, estoque e contas ficam no armazenamento do navegador (`localStorage`) e
sobrevivem ao recarregar a página. A sessão vale por aba (`sessionStorage`). É uma PoC: as senhas não
são criptografadas e não há servidor validando nada.

## Stack e decisões

- **TypeScript**: os tipos deixam explícitos os contratos (interfaces) que os princípios exigem.
- **Vite** sem framework de UI: o foco da nota é o projeto das classes, não o front.
- **Vitest**: testa domínio e casos de uso sem navegador, usando dublês das portas.
- **Arquitetura em camadas**: cada camada só depende da de dentro.

```
src/
├── dominio/      regras puras: Produto, políticas de disponibilidade, Pedido, Usuario, Horario
├── aplicacao/    casos de uso + portas (repositórios, sessão, notificador, leitor de avisos, relógio)
├── infra/        implementações: armazenamento do navegador, memória (testes), relógio, dados de demonstração
├── ui/           login, tela do aluno e painel da cantina (só desenham e repassam eventos)
└── main.ts       raiz de composição: único lugar que conhece as classes concretas
```

## Onde estão os princípios do capítulo 5

| Princípio | Onde | Por que melhora o projeto |
|---|---|---|
| **Composição em vez de herança** | [`Produto`](src/dominio/produto/Produto.ts) **tem uma** [`PoliticaDeDisponibilidade`](src/dominio/produto/PoliticaDeDisponibilidade.ts) | "Perecível" e "não perecível" não são subclasses de Produto. São comportamentos plugados ([`PreparoNaHora`](src/dominio/produto/PreparoNaHora.ts), [`ControleDeEstoque`](src/dominio/produto/ControleDeEstoque.ts)). Para criar um novo jeito de vender (ex.: "limitado por dia"), basta uma nova política. |
| **Substituição de Liskov** | As duas políticas cumprem o mesmo contrato, testado em [`produto.test.ts`](tests/produto.test.ts) | Nenhuma lança "não suportado". `PreparoNaHora.liberar()` é um no-op legítimo: não havia estoque a devolver. |
| **Segregação de Interfaces** | `Reabastecivel` separada de `PoliticaDeDisponibilidade`; `Notificador` separado de `LeitorDeAvisos` em [`portas.ts`](src/aplicacao/portas.ts) | Quem é feito na hora não é obrigado a implementar `reabastecer()`. Quem só avisa (a cantina) não precisa saber ler avisos: um canal como SMS implementaria só `Notificador`. |
| **Inversão de Dependências** | [`aplicacao/portas.ts`](src/aplicacao/portas.ts) + [`main.ts`](src/main.ts) | Os casos de uso dependem de `RepositorioDePedidos`, `Sessao`, `Notificador` e `Relogio`, não do navegador nem de `Date`. **Prova:** passamos de "tudo em memória" para "tudo no `localStorage`" mudando só `main.ts`, sem tocar em nenhum caso de uso. Os testes usam as versões em memória, um `RelogioParado` e um `NotificadorEspiao`. |
| **Aberto/Fechado** | [`NotificadorComposto`](src/infra/notificadores.ts) | Um novo canal de aviso (som, WhatsApp, e-mail) é **uma classe nova** que implementa `Notificador`, mais uma linha em `main.ts`. Nenhuma classe existente muda. |
| **Ocultamento de informação** | [`Pedido`](src/dominio/pedido/Pedido.ts), [`Usuario`](src/dominio/usuario/Usuario.ts) e [`Horario`](src/dominio/Horario.ts) | O status do pedido é privado e só muda por `marcarPronto()`, `confirmarRetirada()`, `cancelar()` e `desfazerPronto()`. Até para restaurar do armazenamento quem mexe no status é o próprio `Pedido.deDados()`. A senha do `Usuario` nunca sai da classe: só existe `confereSenha()`. |
| **Responsabilidade Única / Coesão** | Um caso de uso por arquivo em [`aplicacao/`](src/aplicacao) | `AgendarCompra` só agenda, `CancelarPedido` só cancela e `ReporEstoque` só cuida de compras. A UI não tem regra de negócio. |
| **Demeter** | `Produto.precisaRepor()`, `Produto.tempoDePreparoMin` | Ninguém escreve `produto.politica.algo()`: quem usa conversa só com `Produto`. |
| **Integridade conceitual** | Vocabulário único em todo o código | Os nomes das classes são as palavras da cantina (pedido, cardápio, retirada, reposição), os mesmos da UI e do diagrama de casos de uso. |

## Usabilidade (heurísticas de Nielsen)

- **Status visível:** selos *Agendado → Pronto! → Retirado*; aviso na tela do aluno; contadores nas abas da tia.
- **Linguagem do usuário:** "Feito na hora", "Pronta-entrega", "Peguei!", "Entrega chegou".
- **Controle e liberdade:** o aluno cancela (o estoque volta) e a tia desfaz um "Pronto" tocado por engano.
- **Prevenção de erros:** o horário já vem no mais cedo possível; o "+" fica desabilitado quando acaba o estoque; um pedido inválido não altera nada.
- **Reconhecimento em vez de memorização:** o carrinho mostra os itens; a tia vê "Receber R$ X" em cada pedido.
- **Eficiência:** "Pedir de novo" para quem pede sempre a mesma coisa.
- **Mensagens de erro úteis:** ex.: *"Não dá tempo de preparar: escolha a partir das 20:12."* e *"Use seu e-mail da escola (termina com @cesar.school)."* Depois de um erro no login, o e-mail digitado continua no campo.
- **Ajuda:** "Como funciona?" curto e recolhível em cada tela.

## Dados a confirmar

O cardápio inicial veio da foto do cardápio impresso (Imperial · Quiosque Brum). Ainda falta confirmar:

- O **preço da tapioca** (ela não está no cardápio impresso; usamos R$ 10,00).
- O **preço do Red Bull**, ilegível na foto (usamos R$ 13,60).
- Os tempos de preparo e as quantidades de estoque, que são estimativas para a demonstração.

## Créditos

- Fotos dos produtos: enviadas pela equipe ([`public/produtos/`](public/produtos)).
- Ícones: [Lucide](https://lucide.dev) (licença ISC), escolhidos em [icones.js.org](https://icones.js.org) e embutidos em [`icones.ts`](src/ui/icones.ts).
- Fontes: Barlow Condensed e DM Sans (SIL Open Font License), via Fontsource.

## Equipe

| Integrante | Papel |
|---|---|
| _a preencher_ | _a preencher_ |

> IA utilizada: Claude Code (Anthropic) para gerar código, com revisão e decisões de projeto da equipe.
