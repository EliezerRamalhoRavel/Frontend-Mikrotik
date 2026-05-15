# Agente Frontend TDD - Gestao de Usuarios PPP MikroTik

Data da analise: 2026-05-15 11:36:09 -03

Diretorio analisado: `/home/elizerramalho/evo/Frontend-Mikrotik`

Branch analisada: `feature/usuários-mk`

Commit analisado: `2f51e4c`

## Objetivo

Validar o frontend antes de criar a tela de usuarios PPP MikroTik, respeitando a regra de nao criar telas CRUD ou novas funcionalidades antes da base de testes estar aprovada.

## Plano avaliado

O plano faz sentido para o frontend:

- criar tipos em `/home/elizerramalho/evo/Frontend-Mikrotik/src/types/mikrotikUsers.ts`;
- criar service em `/home/elizerramalho/evo/Frontend-Mikrotik/src/api/mikrotikUsersService.ts`;
- criar modal de senha em `/home/elizerramalho/evo/Frontend-Mikrotik/src/components/mikrotik/MikrotikUserPasswordModal.tsx`;
- criar pagina em `/home/elizerramalho/evo/Frontend-Mikrotik/src/pages/MikrotikUsersPage.tsx`;
- adicionar botao de usuarios em `/home/elizerramalho/evo/Frontend-Mikrotik/src/pages/Mikrotiks.tsx`;
- registrar rota em `/home/elizerramalho/evo/Frontend-Mikrotik/src/App.tsx`.

## Comando executado

```bash
npm run build
```

## Resultado atual

- [x] Projeto frontend localizado em `/home/elizerramalho/evo/Frontend-Mikrotik`
- [x] Build TypeScript/Vite executado com sucesso
- [x] Padroes atuais de service, pagina, modal, rota e UI analisados
- [x] Pasta `/home/elizerramalho/evo/Frontend-Mikrotik/arquivos md` validada
- [ ] Testes automatizados frontend localizados
- [ ] Cobertura frontend de 95% comprovada
- [x] Tela nova de usuarios PPP criada e validada com build
- [x] Modal de confirmacao de senha do usuario logado criado
- [x] Service de autenticacao integrado ao `POST /auth/confirm-password`
- [x] Service de usuarios PPP envia `X-Step-Up-Token` nas alteracoes
- [x] Acoes de habilitar, desabilitar e alterar senha PPP exigem confirmacao valida
- [x] Visualizacao/listagem de usuarios PPP nao exige confirmacao extra

## Observacoes tecnicas

Nao foram encontrados `vitest`, `testing-library`, `jest`, `playwright` ou `cypress` configurados no frontend atual.

O build atual passa, mas isso nao substitui TDD nem cobertura minima de 95%.

## Happy path recomendado para TDD da tela

- [ ] Carregar `/mikrotiks/{deviceId}/users`
- [ ] Buscar dados do device
- [ ] Chamar `GET /devices/{deviceId}/ppp-users`
- [ ] Renderizar tabela com usuario, perfil, servico, status e acoes
- [ ] Habilitar usuario desativado
- [ ] Desabilitar usuario ativo
- [ ] Abrir modal de troca de senha
- [ ] Confirmar senha valida e chamar PATCH com `{ password: "..." }`
- [ ] Exibir toast de sucesso
- [x] Confirmar senha do usuario logado antes de habilitar usuario PPP
- [x] Confirmar senha do usuario logado antes de desabilitar usuario PPP
- [x] Confirmar senha do usuario logado antes de alterar senha PPP
- [x] Enviar token de confirmacao no cabecalho `X-Step-Up-Token`

## Sad path recomendado para TDD da tela

- [ ] Falha ao carregar usuarios mostra toast de erro
- [ ] Falha ao atualizar status restaura loading da linha
- [ ] Senha com menos de 6 caracteres bloqueia envio
- [ ] Confirmacao de senha diferente bloqueia envio
- [ ] Duplo clique em acao fica bloqueado por loading por linha
- [ ] Device inexistente ou API 404 mostra erro amigavel
- [x] Acao sensivel sem confirmacao nao e disparada pelo fluxo da tela
- [x] Falha de confirmacao mostra toast de erro e libera loading da linha

## O que ficou pendente

- [ ] Instalar/configurar ferramenta de testes frontend, caso o projeto decida exigir cobertura tambem no frontend
- [ ] Criar testes automatizados da tela caso seja adotado Vitest/Testing Library
- [x] Criar a tela e services depois do backend estar liberado pela regra dos 95%
- [x] Aplicar a segunda camada de seguranca nas acoes sensiveis depois do backend estar liberado pela regra dos 95%

## O que nao foi possivel fazer

Nao foi possivel comprovar cobertura frontend de 95% porque o projeto nao possui ferramenta de testes automatizados configurada. Foi possivel validar TypeScript e build de producao com sucesso.

## Proximo passo recomendado

Testar manualmente no navegador o fluxo completo: listar usuarios PPP, tentar habilitar ou desabilitar, confirmar a senha do usuario logado, alterar senha PPP e confirmar novamente a senha do usuario logado.
