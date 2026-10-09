# Integração Supabase - Casa Furtacor

O site usa o Supabase como **fonte da verdade** dos dados, com o dispositivo
(`localStorage`) como reserva para funcionar mesmo sem internet.

## 1. Configuração do ambiente

1. Crie um projeto no [Supabase](https://app.supabase.com/).
2. Em **Settings > API**, copie a **Project URL** e a **anon public key**.
3. Atualize o `.env.local`:

   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
   ```

   > O projeto é **Vite**, por isso o prefixo é `VITE_`. O cliente também aceita
   > `NEXT_PUBLIC_` como alias, mas o Vite só expõe variáveis com `VITE_`.

## 2. Banco de dados

Execute todo o conteúdo de `supabase-schema.sql` no **SQL Editor** do Supabase.
O script cria/atualiza as tabelas `eventos`, `clientes`, `ingressos`,
`chat_sessions` e `chat_messages`, habilita o RLS e insere um evento de teste.

### Arquitetura de acesso (RLS)

| Tabela     | Anônimo (público)      | Autenticado (admin) |
| ---------- | ---------------------- | ------------------- |
| `eventos`  | SELECT dos ativos      | SELECT/INSERT/UPDATE/DELETE |
| `clientes` | INSERT (cadastro)      | SELECT/INSERT/UPDATE/DELETE |
| `ingressos`| INSERT (compra)        | SELECT/INSERT/UPDATE/DELETE |
| `chat_*`   | ALL                    | ALL                 |

## 3. Usuário da portaria (admin)

O login da área administrativa usa **`supabase.auth`** (e-mail e senha):

1. No painel do Supabase, vá em **Authentication > Users** e crie um usuário
   com um dos e-mails autorizados:
   - `ritamvbraga@hotmail.com`
   - `benjaminbjp@gmail.com`
2. Entre com esse e-mail e senha pelo botão **Área da Casa** no site.

> Para liberar novos administradores, adicione o e-mail à lista
> `ADMIN_EMAILS_AUTORIZADOS` em `src/services/authService.ts`.

## 4. Arquitetura do código

- `src/services/supabase.ts` — cliente tipado (`Database` de `src/types/database.ts`).
- `src/services/eventosService.ts` / `clientesService.ts` / `ingressosService.ts` — CRUD no banco.
- `src/services/supabaseMappers.ts` — conversão entre `snake_case` (banco) e `camelCase` (app).
- `src/services/authService.ts` — autenticação administrativa (`supabase.auth`).
- `src/services/storageService.ts` — camada única: cache em memória + `localStorage`
  como fallback, sincronização em tempo real (`postgres_changes`).

### Fluxo de compra

1. O formulário envia Nome, Documento e WhatsApp.
2. O serviço gera um `id` (UUID) para o cliente e para cada ingresso, insere em
   `clientes` e depois em `ingressos` com `status_pagamento = 'pendente'`.
3. O modal de checkout exibe o QR Code PIX com o valor total e o código gerado.
4. A confirmação de pagamento e o check-in são feitos pelo painel administrativo.

## Observações

- Se o banco estiver indisponível, o site continua funcionando com os dados
  salvos no dispositivo e exibe um aviso amigável.
- O botão de compra fica bloqueado (`disabled`) durante o processamento para
  evitar duplicidade.
