import Link from "next/link";
import { Check, CalendarDays, FileText, Link2, MessageCircle, PencilLine, Smartphone } from "lucide-react";
import { Logo } from "@/components/ui";
import { PLANS } from "@/lib/plans";
import { formatKz } from "@/lib/utils";

const PAINS = [
  ["A arte perde-se no grupo", "Entre áudios, stickers e «bom dia», ninguém encontra a versão final do post."],
  ["«Aprovado» sem registo", "O cliente diz que aprovou por chamada e depois reclama do que foi publicado."],
  ["Alterações sem fim", "Sete rondas de mudanças no mesmo post e nenhuma foi contabilizada no preço."],
  ["Fim do mês sem prova", "Na hora de cobrar a avença, não há um resumo claro do que foi entregue."],
];

const STEPS = [
  { icon: CalendarDays, title: "Planeie o mês", text: "Crie os posts no calendário da marca: arte, legenda, rede e data." },
  { icon: Link2, title: "Envie um link", text: "Um toque e o link de aprovação segue pelo WhatsApp. O cliente não cria conta." },
  { icon: Check, title: "O cliente decide", text: "Aprova ou pede alterações em cada post. Fica registado quem, quando e o quê." },
  { icon: FileText, title: "Relatório pronto", text: "No fim do mês, um relatório limpo do que foi planeado, aprovado e publicado." },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <Logo />
        <nav className="flex items-center gap-2 text-sm">
          <a href="#precos" className="hidden px-3 py-2 sm:inline">Preços</a>
          <Link href="/entrar" className="px-3 py-2">Entrar</Link>
          <Link href="/registar" className="btn-primary">Começar grátis</Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-10 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-sm">
              <Smartphone className="size-4 text-accent" /> Feito para gestores de redes sociais em Angola
            </p>
            <h1 className="font-display text-5xl leading-[1.02] tracking-tight sm:text-7xl">
              O cliente aprova num link. <em className="text-accent">Acabou</em> o «já viste a mensagem?»
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-2">
              Planeie os posts de cada marca, envie para aprovação pelo WhatsApp e tenha registo de tudo: quem aprovou,
              quantas alterações pediu e o que foi entregue no mês.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/registar" className="btn-accent px-6 py-3 text-base">Criar conta grátis</Link>
              <a href="#como-funciona" className="btn-ghost px-6 py-3 text-base">Ver como funciona</a>
            </div>
            <p className="mt-4 text-sm text-ink-2">Grátis para 1 marca. Planos pagos com Multicaixa Express.</p>
          </div>

          {/* Ilustração: a página que o cliente vê no telemóvel */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-6 -z-10 rotate-3 rounded-[2.5rem] bg-accent/15" />
            <div className="rounded-[2rem] border-8 border-ink bg-paper p-4 shadow-2xl">
              <div className="mb-3 text-center">
                <span className="mx-auto mb-1 block size-9 rounded-xl bg-[#138A55]" />
                <div className="font-display text-2xl">Pastelaria Mukinda</div>
                <div className="text-xs text-ink-2">2 posts à espera da sua aprovação</div>
              </div>
              <div className="overflow-hidden rounded-xl border border-line bg-white">
                <div className="flex items-center gap-2 px-3 py-2 text-xs">
                  <span className="grid size-6 place-items-center rounded-full bg-[#138A55] text-[10px] font-bold text-white">P</span>
                  <b>Pastelaria Mukinda</b> <span className="text-ink-2">· Instagram · sex, 17 out</span>
                </div>
                <div className="grid aspect-[4/3] place-items-center bg-gradient-to-br from-amber-200 via-orange-300 to-accent">
                  <span className="font-display text-3xl text-white drop-shadow">Sexta do bolo!</span>
                </div>
                <p className="px-3 py-2 text-xs leading-relaxed">
                  Bolo de ginguba fresquinho toda a sexta 🍰 Encomendas pelo WhatsApp. #Luanda #Kilamba
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <span className="btn-ghost py-2"><PencilLine className="size-4" /> Alterar</span>
                <span className="btn bg-ok py-2 text-white"><Check className="size-4" /> Aprovar</span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="max-w-2xl font-display text-4xl leading-tight">
              Gerir redes sociais de clientes pelo WhatsApp funciona… até deixar de funcionar.
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {PAINS.map(([t, d]) => (
                <div key={t} className="border-l-2 border-accent pl-4">
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-1 text-sm text-ink-2">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="font-display text-4xl">Como funciona</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="card p-5">
                <div className="flex items-center justify-between">
                  <Icon className="size-6 text-accent" />
                  <span className="font-display text-3xl text-ink-2/40">{i + 1}</span>
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-ink-2">{text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex items-center gap-3 rounded-2xl bg-ink p-5 text-paper">
            <MessageCircle className="size-6 shrink-0 text-[#25D366]" />
            <p className="text-sm sm:text-base">
              Continua a usar o WhatsApp para falar com o cliente — a Aprova só tira de lá o que não devia lá estar: as aprovações.
            </p>
          </div>
        </section>

        <section id="precos" className="border-t border-line bg-paper-2/60">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="font-display text-4xl">Preços em kwanzas</h2>
            <p className="mt-2 text-ink-2">Pague com Multicaixa Express. Sem cartão internacional, sem débitos automáticos.</p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {Object.values(PLANS).map((p) => (
                <div key={p.id} className={`card flex flex-col p-6 ${p.id === "pro" ? "border-ink ring-1 ring-ink" : ""}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{p.name}</h3>
                    {p.id === "pro" && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-white">Mais escolhido</span>}
                  </div>
                  <p className="text-sm text-ink-2">{p.pitch}</p>
                  <div className="mt-4 font-display text-5xl">{p.priceKz ? formatKz(p.priceKz) : "0 Kz"}</div>
                  <div className="text-sm text-ink-2">{p.priceKz ? "por mês · −20% no plano anual" : "para sempre"}</div>
                  <ul className="mt-6 flex-1 space-y-2 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-ok" /> {f}</li>
                    ))}
                  </ul>
                  <Link href="/registar" className={`${p.id === "pro" ? "btn-accent" : "btn-ghost"} mt-6`}>
                    {p.priceKz ? `Escolher ${p.name}` : "Começar grátis"}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-20">
          <h2 className="mb-6 font-display text-4xl">Perguntas frequentes</h2>
          {[
            ["O meu cliente precisa de criar conta?", "Não. Recebe um link (por exemplo no WhatsApp), abre no telemóvel e aprova. Só escreve o nome para ficar registado."],
            ["Como pago a subscrição?", "Com Multicaixa Express: indica o seu número, confirma o pedido na app com o PIN e o plano fica activo na hora."],
            ["E se o pagamento terminar?", "Avisamos uns dias antes. Depois do fim há 3 dias de tolerância; a seguir a conta volta ao plano Grátis sem perder nada."],
            ["Publica automaticamente nas redes?", "Ainda não. A Aprova resolve o planeamento e a aprovação; marca os posts como publicados quando os publicar."],
          ].map(([q, a]) => (
            <details key={q} className="border-b border-line py-4">
              <summary className="cursor-pointer font-medium">{q}</summary>
              <p className="mt-2 text-ink-2">{a}</p>
            </details>
          ))}
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-ink-2">
          <Logo />
          <span>Feito em Luanda.</span>
        </div>
      </footer>
    </div>
  );
}
