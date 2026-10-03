# Aprova

Aprovação de conteúdo para gestores de redes sociais e agências em Angola.

## A dor

Em Angola, a gestão de redes sociais de clientes corre quase toda pelo WhatsApp: a arte perde-se entre áudios,
o «aprovado» fica numa chamada sem registo, as rondas de alterações não têm fim nem são contabilizadas e,
no fim do mês, não há prova clara do que foi entregue para justificar a avença.
As ferramentas internacionais (Planable, Later, Kontentino…) cobram em dólares com cartão internacional,
o que exclui a maioria dos freelancers e pequenas agências.

## O produto

- **Calendário de conteúdo por marca** — arte/vídeo, legenda, rede, formato e data.
- **Link de aprovação sem conta** — o cliente abre no telemóvel, aprova ou pede alterações em cada post. Fica registado quem aprovou e quando.
- **Envio pelo WhatsApp** — um toque gera a mensagem com o link para o contacto do cliente.
- **Contador de rondas de alterações** — base para negociar limites de revisões no contrato.
- **Relatório mensal** imprimível/PDF por cliente (Pro e Agência).
- **Subscrição em kwanzas paga por Multicaixa Express** (push para a app MCX Express via EMIS GPO).

| Plano   | Preço/mês | Marcas | Posts/mês  |
|---------|-----------|--------|------------|
| Grátis  | 0 Kz      | 1      | 15         |
| Pro     | 9.900 Kz  | 5      | ilimitados |
| Agência | 29.900 Kz | 25     | ilimitados |

Períodos de 1, 3 (−10%) ou 12 meses (−20%). Sem débito automático: cada pagamento estende o período;
há 3 dias de tolerância antes de a conta voltar ao Grátis (nada é apagado).

## Stack

Next.js 16 (App Router, Server Actions) · React 19 · Tailwind 4 · Drizzle ORM · Postgres
(PGlite embutido em desenvolvimento) · jose (sessões JWT em cookie httpOnly) · bcrypt.

## Correr localmente

```bash
npm install
cp .env.example .env.local   # opcional em dev
npm run dev
```

Sem `DATABASE_URL` usa um Postgres embutido em `./.data/pglite`; as migrações correm sozinhas.
Sem `VPOS_TOKEN` os pagamentos são **simulados**: confirmam ~6 s depois; números terminados em `000` são recusados.

Alterar o esquema: editar `src/db/schema.ts` e correr `npx drizzle-kit generate`.

## Pagamentos reais (Multicaixa Express)

A integração usa o [vPOS](https://vpos.ao), agregador certificado para o GPO da EMIS:

1. Pedir ao banco (ex.: balcão do banco da empresa) a adesão ao **Gateway de Pagamentos Online (GPO) da EMIS** — recebe o **POS ID**.
2. Criar conta em merchant.vpos.ao e gerar o **token**.
3. Definir `VPOS_TOKEN`, `VPOS_POS_ID` e `APP_URL` (público, com HTTPS).

Fluxo: `POST /api/v1/transactions` (push para o número do cliente) → a página de espera consulta o estado a cada 3 s →
o vPOS chama `/api/pagamentos/callback?pid=…&sig=…` (id assinado com HMAC). O estado é **sempre** confirmado consultando
o vPOS; o callback nunca é confiado por si só. A activação do plano é idempotente.
Trocar de agregador (ex.: AppyPay) = implementar `PaymentProvider` em `src/lib/payments/`.

## Deploy

`render.yaml` cria o serviço web, um disco persistente para as artes e o Postgres. Definir `APP_URL`, `VPOS_TOKEN` e `VPOS_POS_ID` no painel.

## Próximos passos sugeridos

- Notificações por email/WhatsApp Business API quando o cliente aprova ou pede alterações.
- Vários membros por agência; carrosséis com várias imagens.
- Limitar tentativas de login (rate limiting) e recuperação de palavra-passe.
- Armazenamento de ficheiros em S3/R2 em vez de disco.
