# Controle de testes - Frontend MikroTik

Data da analise local: 2026-05-15 11:36:09 -03

Diretorio analisado: `/home/elizerramalho/evo/Frontend-Mikrotik`

Branch analisada: `feature/usuários-mk`

Commit analisado: `2f51e4c`

## Comandos executados

```bash
npm run build
npx eslint src/components/ui/spinner.tsx src/lib/routerUserPasswordProgress.ts src/components/mikrotik/RouterUserPasswordProgressToast.tsx src/components/layout/AppLayout.tsx src/pages/MikrotikUsersPage.tsx src/pages/MikrotikBulkPasswordPage.tsx
/home/elizerramalho/evo/api_mikrotik/venv/bin/pytest /home/elizerramalho/evo/api_mikrotik/tests/test_mikrotik_users_feature.py -q
/home/elizerramalho/evo/api_mikrotik/venv/bin/pytest
```

## Resultado atual

- [x] Build executado com sucesso
- [x] TypeScript compilado com `tsc -b`
- [x] Vite gerou build em `/home/elizerramalho/evo/Frontend-Mikrotik/dist`
- [ ] Suite de testes frontend localizada
- [ ] Cobertura minima de 95% comprovada
- [x] Tela nova de usuarios PPP implementada com validacao por build
- [x] Camada de confirmacao de senha do usuario logado aplicada nas acoes sensiveis

## Observacoes

Nao foi encontrada configuracao atual de teste automatizado frontend com `vitest`, `testing-library`, `jest`, `playwright` ou `cypress`.

O build passou, mas a regra do projeto exige validacao TDD/happy path/sad path e cobertura minima antes de criar novas telas CRUD ou funcionalidades equivalentes.

## Checklist para a feature Gestao de Usuarios MikroTik

- [x] Plano tecnico frontend analisado
- [x] Build atual validado
- [x] Backend da feature validado em `/home/elizerramalho/evo/api_mikrotik/tests/test_mikrotik_users_feature.py`
- [x] Backend ajustado para preservar os robos atuais de producao sem alterar SFTP, MikroTik e Ping
- [x] Testes backend da feature escritos antes da implementacao em `/home/elizerramalho/evo/api_mikrotik/tests/test_mikrotik_users_feature.py`
- [x] Service `/home/elizerramalho/evo/Frontend-Mikrotik/src/api/mikrotikUsersService.ts` criado
- [x] Tipos `/home/elizerramalho/evo/Frontend-Mikrotik/src/types/mikrotikUsers.ts` criados
- [x] Modal `/home/elizerramalho/evo/Frontend-Mikrotik/src/components/mikrotik/MikrotikUserPasswordModal.tsx` criado
- [x] Modal `/home/elizerramalho/evo/Frontend-Mikrotik/src/components/mikrotik/MikrotikUserConfirmPasswordModal.tsx` criado
- [x] Pagina `/home/elizerramalho/evo/Frontend-Mikrotik/src/pages/MikrotikUsersPage.tsx` criada
- [x] Rota `/home/elizerramalho/evo/Frontend-Mikrotik/src/App.tsx` registrada
- [x] Botao em `/home/elizerramalho/evo/Frontend-Mikrotik/src/pages/Mikrotiks.tsx` criado
- [x] `src/api/authService.ts` integrado com `POST /auth/confirm-password`
- [x] `src/api/mikrotikUsersService.ts` envia `X-Step-Up-Token` no PATCH
- [x] Para habilitar e desabilitar usuario PPP, a pagina exige confirmacao valida antes de chamar o PATCH
- [x] Para alterar senha PPP, a pagina exige confirmacao valida antes de chamar o PATCH
- [x] Para visualizar/listar usuarios PPP, a pagina continua sem confirmacao extra

## Status

Backend da feature implementado com TDD especifico de usuarios PPP e robos produtivos preservados. Frontend implementado com a camada de confirmacao nas acoes sensiveis e validado com `npm run build`. A cobertura frontend de 95% nao foi comprovada porque o projeto ainda nao possui suite automatizada configurada.

## Refatoracao 2026-05-15 - Usuarios administrativos do roteador

Objetivo do ajuste: refatorar a funcionalidade de usuarios do MikroTik para buscar usuarios administrativos do RouterOS por `/user/print`, como `ravel` e `teste.ravel`, deixando de consultar usuarios PPP por `/ppp/secret/print`.

Arquivos backend alterados:

- [x] `/home/elizerramalho/evo/api_mikrotik/tests/test_mikrotik_users_feature.py`: testes TDD atualizados para happy path e sad path de usuarios administrativos do roteador
- [x] `/home/elizerramalho/evo/api_mikrotik/app/workers/mikrotik_user_utils.py`: listagem alterada para `/user/print` e atualizacao alterada para `/user/set`
- [x] `/home/elizerramalho/evo/api_mikrotik/app/services/mikrotik_user_service.py`: service alterado para `list_router_users` e `update_router_user`
- [x] `/home/elizerramalho/evo/api_mikrotik/app/api/endpoints/mikrotik_users.py`: endpoint alterado para `/api/v1/devices/{device_id}/router-users`
- [x] `/home/elizerramalho/evo/api_mikrotik/app/api/endpoints/auth.py`: escopo do step-up token alterado para `mikrotik_router_users`
- [x] `/home/elizerramalho/evo/api_mikrotik/app/api/models/mikrotik_users.py`: retorno alterado para `id`, `name`, `disabled`, `group`, `address`, `last_logged_in`
- [x] `/home/elizerramalho/evo/api_mikrotik/app/core/config.py`: mock local renomeado para `MIKROTIK_ROUTER_USERS_MOCK_ENABLED` e `MIKROTIK_ROUTER_USERS_MOCK_HOST`

Arquivos frontend alterados:

- [x] `/home/elizerramalho/evo/Frontend-Mikrotik/src/api/mikrotikUsersService.ts`: chamadas alteradas para `/devices/{deviceId}/router-users`
- [x] `/home/elizerramalho/evo/Frontend-Mikrotik/src/types/mikrotikUsers.ts`: tipos alterados para usuarios administrativos do roteador
- [x] `/home/elizerramalho/evo/Frontend-Mikrotik/src/pages/MikrotikUsersPage.tsx`: tabela alterada para exibir grupo, endereco permitido e ultimo login
- [x] `/home/elizerramalho/evo/Frontend-Mikrotik/src/pages/Mikrotiks.tsx`: titulo do botao alterado para usuarios do roteador

Checklist TDD e validacao:

- [x] Teste happy path do worker validando `/user/print`
- [x] Teste happy path do worker validando `/user/set`
- [x] Teste sad path do service quando o RouterOS falha
- [x] Teste sad path de payload vazio no PATCH
- [x] Teste de step-up token invalido ou ausente
- [x] Teste de auditoria sem registrar senha
- [x] `/home/elizerramalho/evo/api_mikrotik/tests/test_mikrotik_users_feature.py`: 8 testes passaram
- [x] `/home/elizerramalho/evo/api_mikrotik/app/api/endpoints/mikrotik_users.py`: 100% no recorte de cobertura do teste da feature
- [x] `/home/elizerramalho/evo/api_mikrotik/app/services/mikrotik_user_service.py`: 100% no recorte de cobertura do teste da feature
- [x] `/home/elizerramalho/evo/api_mikrotik/app/workers/mikrotik_user_utils.py`: 100% no recorte de cobertura do teste da feature
- [ ] Cobertura global backend minima de 95% comprovada
- [x] Build frontend executado com sucesso por `npm run build`
- [ ] Cobertura frontend minima de 95% comprovada

Resultado dos comandos:

- [x] `/home/elizerramalho/evo/api_mikrotik/venv/bin/pytest /home/elizerramalho/evo/api_mikrotik/tests/test_mikrotik_users_feature.py -q`: 8 passed
- [x] `npm run build`: executado com sucesso em `/home/elizerramalho/evo/Frontend-Mikrotik`
- [ ] `/home/elizerramalho/evo/api_mikrotik/venv/bin/pytest`: interrompido na coleta com 8 erros preexistentes

Erros que ainda bloqueiam a suite completa backend:

- [ ] `/home/elizerramalho/evo/api_mikrotik/tests/api/test_ping.py`: conflito de nome com `/home/elizerramalho/evo/api_mikrotik/manual_tests/test_ping.py`
- [ ] `/home/elizerramalho/evo/api_mikrotik/tests/repositories/test_management_repo_coverage.py`: importa `ManagementUserRepository`, mas `/home/elizerramalho/evo/api_mikrotik/app/repositories/management_repos.py` nao exporta essa classe
- [ ] `/home/elizerramalho/evo/api_mikrotik/tests/test_z_final_coverage.py`: importa `ManagementUserRepository`, mas `/home/elizerramalho/evo/api_mikrotik/app/repositories/management_repos.py` nao exporta essa classe
- [ ] `/home/elizerramalho/evo/api_mikrotik/tests/workers/test_backup_worker_deep.py`: importa `_process_backup_cycle`, mas `/home/elizerramalho/evo/api_mikrotik/app/workers/backup_tasks.py` nao exporta essa funcao
- [ ] `/home/elizerramalho/evo/api_mikrotik/tests/workers/test_notification_logic_coverage.py`: importa `_process_ping_target`, mas `/home/elizerramalho/evo/api_mikrotik/app/workers/ping_tasks.py` nao exporta essa funcao
- [ ] `/home/elizerramalho/evo/api_mikrotik/tests/workers/test_tasks_coverage.py`: importa `check_mikrotik_api`, mas `/home/elizerramalho/evo/api_mikrotik/app/workers/mikrotik_tasks.py` nao exporta essa funcao
- [ ] `/home/elizerramalho/evo/api_mikrotik/tests/workers/test_tasks_deep_coverage.py`: importa `_process_ping_target`, mas `/home/elizerramalho/evo/api_mikrotik/app/workers/ping_tasks.py` nao exporta essa funcao
- [ ] `/home/elizerramalho/evo/api_mikrotik/tests/workers/test_worker_logic.py`: importa `_process_ping_target`, mas `/home/elizerramalho/evo/api_mikrotik/app/workers/ping_tasks.py` nao exporta essa funcao

## Ajuste 2026-05-15 - Inventario pelo robo e troca de senha assincrona

Objetivo do ajuste: o robo de monitoramento MikroTik passa a aproveitar o ciclo existente para coletar `/user/print`, salvar usuarios administrativos no banco e processar troca de senha por tarefa pendente. Nao foi adicionada notificacao nesta etapa. O intervalo segue `settings.mikrotik_check_interval` e o fluxo ja existente de `dispatch_monitoring_cycle`, sem hardcode novo.

Arquivos backend alterados:

- [x] `/home/elizerramalho/evo/api_mikrotik/app/models/mikrotik_users.py`: modelos `RouterOSUser` e `RouterOSUserPasswordJob` criados
- [x] `/home/elizerramalho/evo/api_mikrotik/app/models/__init__.py`: novos modelos importados no metadata
- [x] `/home/elizerramalho/evo/api_mikrotik/alembic/env.py`: novos modelos importados para Alembic
- [x] `/home/elizerramalho/evo/api_mikrotik/alembic/versions/9e0c3f6a2b41_add_routeros_user_inventory.py`: migration criada
- [x] `/home/elizerramalho/evo/api_mikrotik/app/services/router_user_inventory.py`: persistencia do snapshot e processamento de jobs criada
- [x] `/home/elizerramalho/evo/api_mikrotik/app/services/mikrotik_user_service.py`: listagem alterada para consultar banco e PATCH alterado para enfileirar job
- [x] `/home/elizerramalho/evo/api_mikrotik/app/api/models/mikrotik_users.py`: DTO `RouterOSPasswordJobRead` criado e campos `is_connection_user`/`is_present` adicionados
- [x] `/home/elizerramalho/evo/api_mikrotik/app/api/endpoints/mikrotik_users.py`: PATCH retorna `202 Accepted` com job pendente
- [x] `/home/elizerramalho/evo/api_mikrotik/app/workers/mikrotik_tasks.py`: ciclo do robo sincroniza usuarios e processa jobs quando o device esta online
- [x] `/home/elizerramalho/evo/api_mikrotik/tests/test_mikrotik_users_feature.py`: TDD atualizado com inventario persistido, job, retry e atualizacao de credencial do device

Arquivos frontend alterados:

- [x] `/home/elizerramalho/evo/Frontend-Mikrotik/src/types/mikrotikUsers.ts`: tipos de inventario e job adicionados
- [x] `/home/elizerramalho/evo/Frontend-Mikrotik/src/api/mikrotikUsersService.ts`: PATCH agora retorna job de troca
- [x] `/home/elizerramalho/evo/Frontend-Mikrotik/src/pages/MikrotikUsersPage.tsx`: acao sensivel mantida apenas para senha e texto ajustado para solicitacao assincrona

Checklist TDD e validacao:

- [x] Coleta `/user/print` persiste usuarios atuais no banco
- [x] Usuario que sumiu do RouterOS e marcado como `is_present=false`
- [x] Usuario de conexao e identificado por `router_user.name == device.username`
- [x] Tela/backend lista usuarios a partir do banco, nao conectando no RouterOS a cada acesso
- [x] PATCH de senha retorna job pendente com semantica `202 Accepted`
- [x] Senha solicitada e criptografada em `RouterOSUserPasswordJob`
- [x] Robo tenta `/user/set` e marca retry quando falha
- [x] Robo valida login com a senha nova quando `/user/set` funciona
- [x] Quando o usuario alterado e `device.username`, `devices.password_enc` e atualizado automaticamente
- [x] Nenhuma notificacao foi implementada nesta etapa
- [x] Nenhum intervalo novo foi hardcoded

Resultado dos comandos:

- [x] `/home/elizerramalho/evo/api_mikrotik/venv/bin/pytest /home/elizerramalho/evo/api_mikrotik/tests/test_mikrotik_users_feature.py -q`: 11 passed
- [x] `npm run build`: executado com sucesso em `/home/elizerramalho/evo/Frontend-Mikrotik`
- [x] `/home/elizerramalho/evo/api_mikrotik/app/api/endpoints/mikrotik_users.py`: 100% no recorte de cobertura da feature
- [x] `/home/elizerramalho/evo/api_mikrotik/app/api/models/mikrotik_users.py`: 100% no recorte de cobertura da feature
- [x] `/home/elizerramalho/evo/api_mikrotik/app/models/mikrotik_users.py`: 100% no recorte de cobertura da feature
- [x] `/home/elizerramalho/evo/api_mikrotik/app/services/mikrotik_user_service.py`: 95% no recorte de cobertura da feature
- [x] `/home/elizerramalho/evo/api_mikrotik/app/services/router_user_inventory.py`: 96% no recorte de cobertura da feature
- [x] `/home/elizerramalho/evo/api_mikrotik/app/workers/mikrotik_user_utils.py`: 100% no recorte de cobertura da feature
- [ ] Cobertura global backend minima de 95% comprovada
- [ ] Cobertura frontend minima de 95% comprovada

## Ajuste 2026-05-15 - Funcao root para troca de senha em massa

Objetivo do ajuste: usuario root passa a ter uma acao acima das empresas para listar o inventario atual de usuarios RouterOS salvos no banco, selecionar cliente + usuario, definir uma senha unica e enfileirar a troca em massa. A execucao continua assincrona pelo robo existente, com retry e validacao ja implementados. Nenhuma notificacao foi adicionada nesta etapa.

Arquivos backend alterados:

- [x] `/home/elizerramalho/evo/api_mikrotik/app/api/models/mikrotik_users.py`: DTOs `RouterOSUserInventoryRead`, `RouterOSBulkPasswordItem`, `RouterOSBulkPasswordRequest` e `RouterOSBulkPasswordResponse` criados
- [x] `/home/elizerramalho/evo/api_mikrotik/app/services/mikrotik_user_service.py`: listagem global root e criacao de jobs em massa implementadas
- [x] `/home/elizerramalho/evo/api_mikrotik/app/api/endpoints/mikrotik_users.py`: endpoints root-only `GET /api/v1/devices/router-users` e `POST /api/v1/devices/router-users/bulk-password-change` criados
- [x] `/home/elizerramalho/evo/api_mikrotik/tests/test_mikrotik_users_feature.py`: TDD atualizado com happy path e sad path para inventario root e jobs em massa

Arquivos frontend alterados:

- [x] `/home/elizerramalho/evo/Frontend-Mikrotik/src/types/mikrotikUsers.ts`: tipos de inventario global e resposta em massa criados
- [x] `/home/elizerramalho/evo/Frontend-Mikrotik/src/api/mikrotikUsersService.ts`: chamadas para inventario root e troca em massa adicionadas
- [x] `/home/elizerramalho/evo/Frontend-Mikrotik/src/pages/MikrotikBulkPasswordPage.tsx`: pagina global root criada para listar usuarios de todos os MKs, selecionar cliente + usuario e definir senha em massa
- [x] `/home/elizerramalho/evo/Frontend-Mikrotik/src/components/ui/spinner.tsx`: componente `Spinner` adicionado no padrao shadcn/ui
- [x] `/home/elizerramalho/evo/Frontend-Mikrotik/src/App.tsx`: rota `/mikrotiks/senha-em-massa` registrada
- [x] `/home/elizerramalho/evo/Frontend-Mikrotik/src/components/layout/NavLinks.tsx`: menu `Senha MKs` exibido somente para root
- [x] `/home/elizerramalho/evo/Frontend-Mikrotik/src/pages/MikrotikUsersPage.tsx`: botao de massa removido da tela individual do MikroTik

Checklist TDD e validacao:

- [x] Root lista usuarios RouterOS de todos os dispositivos inventariados no banco
- [x] Rota estatica root foi criada antes da rota `/{device_id}/router-users` para evitar conflito de path
- [x] Troca em massa exige step-up token por `X-Step-Up-Token`
- [x] Troca em massa cria um job `pending` por usuario selecionado
- [x] Senha da troca em massa e criptografada em cada job
- [x] Habilitar/desabilitar usuario RouterOS tambem cria job `pending` com `202 Accepted`
- [x] Listagem individual e global exibe estado do ultimo job por usuario: pending, processing, retrying, completed ou failed
- [x] Frontend atualiza automaticamente enquanto houver job pending, processing ou retrying
- [x] Payload vazio em massa retorna erro 400
- [x] Usuario RouterOS inexistente em massa retorna erro 404 antes de criar a operacao
- [x] Auditoria registra total e alvos sem registrar senha
- [x] Frontend root carrega inventario global ao abrir a pagina global `/mikrotiks/senha-em-massa`
- [x] Frontend agrupa selecao por cliente com checkbox do cliente e checkbox dos usuarios filhos
- [x] Frontend possui checkbox `Selecionar todos` para todos os usuarios visiveis
- [x] Frontend abre dialogo `Deseja mudar a senha de XX cliente(s) e YY usuario(s)?` antes de pedir a senha nova
- [x] Frontend abre popup `Nova senha` e `Confirmar senha` somente apos confirmacao sim
- [x] Frontend exibe progresso item a item no envio: cliente, usuario e indice atual do total
- [x] Frontend exibe indicador global no canto inferior direito com `Atualizando senha... X de Y` durante a troca em massa
- [x] Frontend mantem o indicador global visivel ao transitar entre telas enquanto a troca de senha ainda esta pendente, processando ou em nova tentativa
- [x] Frontend usa o componente `/home/elizerramalho/evo/Frontend-Mikrotik/src/components/ui/spinner.tsx` com animacao de carregamento nas linhas e no indicador global
- [x] Recorte frontend do indicador global validado com `npx eslint src/components/ui/spinner.tsx src/lib/routerUserPasswordProgress.ts src/components/mikrotik/RouterUserPasswordProgressToast.tsx src/components/layout/AppLayout.tsx src/pages/MikrotikUsersPage.tsx src/pages/MikrotikBulkPasswordPage.tsx`
- [x] Polling das telas `/home/elizerramalho/evo/Frontend-Mikrotik/src/pages/MikrotikUsersPage.tsx` e `/home/elizerramalho/evo/Frontend-Mikrotik/src/pages/MikrotikBulkPasswordPage.tsx` ajustado para atualizar silenciosamente sem piscar a tela
- [x] Indicador global protegido contra limpeza imediata antes do backend registrar o job de troca de senha
- [x] Frontend envia somente `device_id`, `routeros_user_id` e senha apos confirmacao do usuario logado
- [x] Troca em massa nao fica dentro de um MikroTik especifico; ela fica em uma funcao root acima dos clientes

Resultado dos comandos:

- [x] `/home/elizerramalho/evo/api_mikrotik/venv/bin/pytest /home/elizerramalho/evo/api_mikrotik/tests/test_mikrotik_users_feature.py -q`: 12 passed
- [x] `npm run build`: executado com sucesso em `/home/elizerramalho/evo/Frontend-Mikrotik`
- [x] `/home/elizerramalho/evo/api_mikrotik/app/api/endpoints/mikrotik_users.py`: 100% no recorte de cobertura da feature
- [x] `/home/elizerramalho/evo/api_mikrotik/app/api/models/mikrotik_users.py`: 100% no recorte de cobertura da feature
- [x] `/home/elizerramalho/evo/api_mikrotik/app/models/mikrotik_users.py`: 100% no recorte de cobertura da feature
- [x] `/home/elizerramalho/evo/api_mikrotik/app/services/mikrotik_user_service.py`: 96% no recorte de cobertura da feature
- [x] `/home/elizerramalho/evo/api_mikrotik/app/services/router_user_inventory.py`: 96% no recorte de cobertura da feature
- [x] `/home/elizerramalho/evo/api_mikrotik/app/workers/mikrotik_user_utils.py`: 100% no recorte de cobertura da feature
- [ ] Cobertura global backend minima de 95% comprovada
- [ ] Cobertura frontend minima de 95% comprovada
