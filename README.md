# Cantinas do CESAR

O intervalo tem 15 minutos e metade dele vai embora na fila da cantina. Neste app, o estudante
agenda o lanche para o horário do intervalo e a cantina prepara na ordem certa. Quando o pedido
fica pronto, o estudante recebe o aviso e vai direto ao balcão, sem fila. São três acessos: a
**gestão do CESAR** cadastra as cantinas, cada **cantina** cuida dos próprios pedidos, estoque e
cardápio, e o **estudante** pede e avalia o que comeu.

> **Hackathon Relâmpago (FDS, cap. 5):** [onde estão os princípios de projeto no código](docs/principios.md), com arquitetura, heurísticas de usabilidade e decisões.

## Tecnologias

![TypeScript](https://img.shields.io/badge/typescript-%233178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Vitest](https://img.shields.io/badge/vitest-%236E9F18.svg?style=for-the-badge&logo=vitest&logoColor=white)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![GitHub](https://img.shields.io/badge/github-%23181717.svg?style=for-the-badge&logo=github&logoColor=white)

- **Linguagem:** TypeScript, com regras de negócio em classes separadas da interface.
- **Build e servidor de desenvolvimento:** [Vite](https://vitejs.dev/).
- **Testes:** [Vitest](https://vitest.dev/), para domínio, casos de uso e permissões.
- **Interface:** HTML e CSS sem framework, no design system do [CESAR School](https://www.cesar.school), com ícones [Lucide](https://lucide.dev) e fontes Barlow e DM Sans.
- **Dados:** armazenamento do navegador (`localStorage`), sem backend.
- **Versionamento:** GitHub, com a branch `develop` recebendo cada feature antes da `main`.

## Como rodar

### 1. Instalar o Node.js

Baixe a versão **LTS** em [nodejs.org](https://nodejs.org/) (18 ou mais nova) e instale.

### 2. Baixar o projeto

```bash
git clone https://github.com/luan-arruda/Hackground-Rel-mpago.git
cd Hackground-Rel-mpago
```

### 3. Instalar as dependências

```bash
npm install
```

### 4. Abrir o app

```bash
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173). Na tela de login, os botões do **Modo demonstração**
entram como estudante, cantina ou gestão do CESAR sem digitar nada. Para ver o aviso de "pronto"
chegando, abra o estudante numa aba e a cantina em outra.

### 5. Rodar os testes

```bash
npm test
```

> **Dados de demonstração:** a cantina Imperial Padaria e as contas de teste já vêm criadas
> ([`dadosDeDemonstracao.ts`](src/infra/dadosDeDemonstracao.ts)). O botão **Restaurar dados iniciais**,
> na tela de login, volta tudo ao começo.

## Squad

Fotos ficam em [`docs/assets/team/`](docs/assets/team).

| Foto | Nome | GitHub | LinkedIn | Email |
|---|---|---|---|---|
| <img src="docs/assets/team/anderson-santos.png" alt="Anderson Santos" width="80"> | Anderson Santos | [acampospsantos](https://github.com/acampospsantos) | [andersoncampospsantos](https://www.linkedin.com/in/andersoncampospsantos) | acps@cesar.school |
| <img src="docs/assets/team/joao-vitor-medeiros.png" alt="João Vitor Medeiros" width="80"> | João Vitor Medeiros | [JvMedeiros7](https://github.com/JvMedeiros7) | [jvmedeiros7](https://www.linkedin.com/in/jvmedeiros7/) | jvm7@cesar.school |
| <img src="docs/assets/team/julio-cesar-lins.png" alt="Julio Cesar Lins" width="80"> | Julio Cesar Lins | [Lins-ju](https://github.com/Lins-ju) | [júlio-lins](https://www.linkedin.com/in/j%C3%BAlio-lins-123905182/) | jcsl@cesar.school |
| <img src="docs/assets/team/laura-brayner.png" alt="Laura Brayner" width="80"> | Laura Brayner | [laurabrayner](https://github.com/laurabrayner) | [laurabrayner](https://www.linkedin.com/in/laurabrayner) | lcbc@cesar.school |
| <img src="docs/assets/team/luan-arruda.png" alt="Luan Arruda" width="80"> | Luan Arruda | [luan-arruda](https://github.com/luan-arruda) | [luan-arruda-548a9534b](https://www.linkedin.com/in/luan-arruda-548a9534b) | las9@cesar.school |
| <img src="docs/assets/team/rodrigo-vasco.png" alt="Rodrigo Vasco" width="80"> | Rodrigo Vasco | [ByRodrigoVasco](https://github.com/ByRodrigoVasco) | [rodrigo-vlm](https://www.linkedin.com/in/rodrigo-vlm/) | rvlm@cesar.school |
