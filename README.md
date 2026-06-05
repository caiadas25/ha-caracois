# Há Caracóis 🐌

Web app para descobrir e partilhar estabelecimentos que servem **caracóis**.
Os locais aparecem num mapa; clica num ponto para ver os detalhes, abre a página
do local e partilha-a. Adicionar um local é feito através de um pequeno
assistente (preço, dose, avaliação e notas).

## Funcionalidades

- 🗺️ **Mapa** (Leaflet + OpenStreetMap, sem chave de API) centrado na tua
  localização ao carregar (com Lisboa como alternativa), com zoom ao nível de
  cidade.
- 📍 Cada local é um marcador; ao clicar abre um cartão com avaliação, dose,
  preço e notas, e um botão **Ver página**.
- ➕ **Assistente** de 5 passos: nome (com pesquisa de estabelecimentos via
  OpenStreetMap/Nominatim) → preço → dose (*pires / prato / travessa*) →
  avaliação (0–5) → notas.
- 🔗 Página por local (`/spot/[id]`) com metadados Open Graph e partilha por
  **WhatsApp, Telegram, Email**, partilha nativa e copiar link.
- 🛠️ Pedidos públicos de alteração/remoção a partir do cartão do mapa, com
  revisão numa página protegida em `/admin`.

## Stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- Tailwind CSS v4
- [Leaflet](https://leafletjs.com) + react-leaflet
- [Supabase](https://supabase.com) (tabela `caracois_spots`, leitura anónima
  pública via RLS; escritas públicas validadas no servidor)
- Pesquisa de locais: OpenStreetMap [Nominatim](https://nominatim.org)

## Configuração

Copia `.env.example` para `.env.local` e preenche:

```
NEXT_PUBLIC_SUPABASE_URL=https://<projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx
ADMIN_PASSWORD=uma-password-forte
ADMIN_SESSION_SECRET=uma-string-aleatoria-longa
```

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de produção
```

## Base de dados

Os dados ficam na tabela `caracois_spots` (projeto Supabase `workout-logbook`):

| coluna | tipo | notas |
| --- | --- | --- |
| `id` | uuid | PK |
| `name` | text | 1–200 caracteres |
| `lat`, `lng` | float8 | coordenadas |
| `address` | text | opcional |
| `price` | numeric | opcional (€) |
| `serving_size` | text | `pires` \| `prato` \| `travessa` |
| `rating` | int | 0–5 |
| `notes` | text | opcional, ≤2000 |
| `osm_id` | text | id do OpenStreetMap, se aplicável |
| `created_at` | timestamptz | automático |

RLS ativo com política de **leitura** pública (`anon`). Inserção, edição e
remoção passam por rotas de API no servidor com validação e
`SUPABASE_SERVICE_ROLE_KEY`.

Os pedidos de alteração/remoção ficam na tabela `caracois_spot_requests`:

| coluna | tipo | notas |
| --- | --- | --- |
| `id` | uuid | PK |
| `spot_id` | uuid | referência opcional ao local; fica `null` se o local for apagado |
| `spot_name`, `spot_address` | text | cópia do local no momento do pedido |
| `request_type` | text | `edit` \| `delete` |
| `note` | text | nota pública para o admin |
| `status` | text | `pending` \| `resolved` \| `dismissed` |
| `admin_note` | text | nota interna opcional |
| `created_at`, `updated_at`, `resolved_at` | timestamptz | auditoria |

RLS ativo sem políticas públicas na tabela de pedidos; a app escreve e lê esta
tabela apenas no servidor com `SUPABASE_SERVICE_ROLE_KEY`.

## Deploy

Pronto para [Vercel](https://vercel.com) — define as variáveis de ambiente
acima no projeto.
