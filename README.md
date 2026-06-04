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

## Stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- Tailwind CSS v4
- [Leaflet](https://leafletjs.com) + react-leaflet
- [Supabase](https://supabase.com) (tabela `caracois_spots`, acesso anónimo
  público via RLS)
- Pesquisa de locais: OpenStreetMap [Nominatim](https://nominatim.org)

## Configuração

Copia `.env.example` para `.env.local` e preenche:

```
NEXT_PUBLIC_SUPABASE_URL=https://<projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
SUPABASE_SERVICE_ROLE_KEY=<server-only service role key>
ADMIN_PASSWORD=<password para /admin>
ADMIN_SESSION_SECRET=<segredo longo para assinar a sessão>
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

Pedidos de edição/remoção ficam na tabela `caracois_spot_requests`:

| coluna | tipo | notas |
| --- | --- | --- |
| `id` | uuid | PK |
| `spot_id` | uuid | FK para `caracois_spots.id` |
| `request_type` | text | `edit` \| `delete` |
| `note` | text | nota do utilizador para o admin |
| `status` | text | `open` por omissão; `resolved` quando tratado |
| `created_at` | timestamptz | automático |
| `resolved_at` | timestamptz | opcional |

Podes criar esta tabela com o script `supabase/admin_requests.sql`.

RLS ativo com políticas de **leitura** e **inserção** públicas (`anon`) para locais.
Para reduzir fricção, os utilizadores anónimos podem inserir pedidos em
`caracois_spot_requests`; a listagem de pedidos e os botões de editar/apagar
ficam atrás da página `/admin`, protegida por cookie assinado. Em produção,
remove políticas públicas de update/delete em `caracois_spots` e faz operações
de admin apenas com `SUPABASE_SERVICE_ROLE_KEY` no servidor.

## Deploy

Pronto para [Vercel](https://vercel.com) — define as duas variáveis de ambiente
acima no projeto.
