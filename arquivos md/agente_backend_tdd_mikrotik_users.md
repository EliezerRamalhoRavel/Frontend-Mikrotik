# Agente Backend TDD - Gestao de Usuarios MikroTik

Data da analise: 2026-05-15 11:36:09 -03

Diretorio analisado: `/home/elizerramalho/evo/api_mikrotik`

Branch analisada: `feature/usuários-mk`

Commit analisado: `3e6c648`

## Objetivo

Validar, antes de criar ou editar a feature de usuarios PPP MikroTik, se o backend esta pronto para receber TDD, novos endpoints e testes de happy path e sad path.

## Plano avaliado

O plano faz sentido para a necessidade informada:

- listar todos os usuarios PPP existentes no MikroTik;
- permitir habilitar e desabilitar usuario PPP;
- permitir alterar a senha do usuario PPP;
- executar tudo pelo frontend da aplicacao.

O desenho correto e:

- backend consulta o device cadastrado;
- backend valida `company_id` do usuario autenticado;
- backend descriptografa a senha do device;
- backend conecta no RouterOS via `librouteros`;
- frontend chama os endpoints protegidos e exibe a lista em tela.

## Comando executado

```bash
/home/elizerramalho/evo/api_mikrotik/venv/bin/pytest --cov=app --cov-report=term-missing --cov-report=html
```

## Resultado atual

- [x] Projeto backend localizado em `/home/elizerramalho/evo/api_mikrotik`
- [x] Padroes atuais de device, permissao, auditoria e service analisados
- [x] Plano tecnico da feature validado conceitualmente
- [x] Pytest completo executado
- [x] Cobertura HTML gerada em `/home/elizerramalho/evo/api_mikrotik/htmlcov/index.html`
- [x] Suite completa aprovada sem erro de coleta
- [x] Cobertura minima de 95% atingida
- [x] Liberado iniciar TDD dos endpoints novos de usuarios PPP
- [x] TDD da camada de confirmacao de senha criado antes da implementacao
- [x] `POST /api/v1/auth/confirm-password` implementado
- [x] `PATCH /api/v1/devices/{device_id}/ppp-users/{user_id}` protegido por `X-Step-Up-Token`
- [x] `GET /api/v1/devices/{device_id}/ppp-users` mantido apenas com `device:read`, sem confirmacao extra

## Bloqueio encontrado

Bloqueio resolvido.

Resultado:

- total coletado: 207 itens;
- testes aprovados: 206;
- xfail esperado: 1;
- erros de coleta/importacao: 0;
- cobertura total: 95%;
- meta minima exigida: 95%.

Com esse resultado, a regra do projeto permite iniciar os testes TDD da feature antes da implementacao.

## Erros de coleta confirmados

- [x] `/home/elizerramalho/evo/api_mikrotik/tests/api/test_ping.py`: conflito de nome de modulo com `/home/elizerramalho/evo/api_mikrotik/manual_tests/test_ping.py`
- [x] `/home/elizerramalho/evo/api_mikrotik/tests/repositories/test_management_repo_coverage.py`: importa `ManagementUserRepository`, mas `/home/elizerramalho/evo/api_mikrotik/app/repositories/management_repos.py` nao exportava essa classe
- [x] `/home/elizerramalho/evo/api_mikrotik/tests/test_z_final_coverage.py`: importa `ManagementUserRepository`, mas `/home/elizerramalho/evo/api_mikrotik/app/repositories/management_repos.py` nao exportava essa classe
- [x] `/home/elizerramalho/evo/api_mikrotik/tests/workers/test_backup_worker_deep.py`: importa `_process_backup_cycle`, mas `/home/elizerramalho/evo/api_mikrotik/app/workers/backup_tasks.py` nao exportava essa funcao
- [x] `/home/elizerramalho/evo/api_mikrotik/tests/workers/test_notification_logic_coverage.py`: importa `_process_ping_target`, mas `/home/elizerramalho/evo/api_mikrotik/app/workers/ping_tasks.py` nao exportava essa funcao
- [x] `/home/elizerramalho/evo/api_mikrotik/tests/workers/test_tasks_coverage.py`: importa `check_mikrotik_api`, mas `/home/elizerramalho/evo/api_mikrotik/app/workers/mikrotik_tasks.py` nao exportava essa funcao
- [x] `/home/elizerramalho/evo/api_mikrotik/tests/workers/test_tasks_deep_coverage.py`: importa `_process_ping_target`, mas `/home/elizerramalho/evo/api_mikrotik/app/workers/ping_tasks.py` nao exportava essa funcao
- [x] `/home/elizerramalho/evo/api_mikrotik/tests/workers/test_worker_logic.py`: importa `_process_ping_target`, mas `/home/elizerramalho/evo/api_mikrotik/app/workers/ping_tasks.py` nao exportava essa funcao

## Happy path recomendado para TDD da feature

- [ ] `GET /api/v1/devices/{device_id}/ppp-users` lista usuarios PPP retornados por `/ppp/secret/print`
- [ ] `GET /api/v1/devices/{device_id}/ppp-users` retorna somente usuarios do device da empresa do usuario autenticado
- [ ] `GET /api/v1/devices/{device_id}/ppp-users` normaliza `.id` do RouterOS para `id`
- [ ] `PATCH /api/v1/devices/{device_id}/ppp-users/{user_id}` altera `disabled`
- [ ] `PATCH /api/v1/devices/{device_id}/ppp-users/{user_id}` altera `password`
- [ ] `PATCH /api/v1/devices/{device_id}/ppp-users/{user_id}` registra auditoria sem senha
- [x] `POST /api/v1/auth/confirm-password` retorna token curto quando a senha do usuario logado esta correta
- [x] `PATCH /api/v1/devices/{device_id}/ppp-users/{user_id}` aceita somente acao sensivel com confirmacao valida

## Sad path recomendado para TDD da feature

- [ ] Sem token retorna 401
- [ ] Sem permissao `device:read` no GET retorna 403
- [ ] Sem permissao `device:write` no PATCH retorna 403
- [ ] Device inexistente retorna 404
- [ ] Device de outra empresa retorna 404
- [ ] Payload vazio no PATCH retorna 422 ou 400 controlado
- [ ] Falha de conexao RouterOS retorna erro controlado
- [ ] Falha de autenticacao RouterOS retorna erro controlado
- [ ] Senha nunca aparece em resposta ou auditoria
- [x] Senha errada do usuario logado no confirm-password retorna 401
- [x] PATCH sem `X-Step-Up-Token` retorna 403
- [x] PATCH com `X-Step-Up-Token` invalido retorna 403

## O que ficou pendente

- [x] Corrigir os 8 erros de coleta atuais
- [x] Rodar novamente pytest completo
- [x] Elevar cobertura total para no minimo 95%
- [x] Criar testes TDD da feature de usuarios PPP
- [x] Implementar backend somente depois dos testes da feature falharem pelo motivo esperado
- [x] Criar testes TDD para a segunda camada de seguranca nas acoes sensiveis
- [x] Implementar a segunda camada de seguranca nas acoes de habilitar, desabilitar e alterar senha PPP

## O que nao foi possivel fazer

Backend implementado com TDD concluido. O que nao foi possivel validar neste agente foi uma conexao real com um MikroTik fisico, porque os testes usam mocks de `librouteros` para validar contrato, payloads e tratamento local sem depender de rede externa.

## Proximo passo recomendado

Testar manualmente contra um MikroTik real depois de confirmar que o servico API do RouterOS esta ativo na porta correta e que o IP do backend esta liberado no allowlist do device.
