"use client";

import { useSegmento } from "@/components/app/SegmentoProvider";
import { campoCustoFixo } from "@/lib/copy/assistente";
import { formatarMoeda } from "@/lib/pricing/format";
import { somarReais } from "@/lib/pricing/money";
import type { CustoFixo } from "@/lib/pricing/types";
import { CurrencyField } from "./fields";
import { Secao } from "./Secao";

/**
 * Lista de custos fixos, com as categorias sugeridas de 06-dados.md
 * pré-preenchidas em R$ 0.
 *
 * O total fica SEMPRE visível, inclusive com a seção fechada: é o número
 * que o usuário quer conferir contra a planilha dele, e é a mesma
 * pedagogia da calculadora aplicada à lista — ver a soma mudar enquanto
 * digita ensina mais que um rótulo.
 *
 * ═══ UMA CHAVE DE ASSISTENTE POR CATEGORIA (Leva 4.2) ═══
 * Até a 4.1, todo campo daqui compartilhava `campo="custosFixos"` e
 * mostrava o mesmo texto genérico ("veja o extrato bancário") — porque o
 * assistente era um cartão inline, e doze cópias do mesmo cartão
 * empurrariam a lista inteira para fora da tela.
 *
 * Com o painel único (`AssistenteFixoMobile`/`AssistenteLateral`, ver
 * Assistente.tsx), essa restrição não existe mais: cada categoria passa
 * `campoCustoFixo(categoria)`, que resolve para um texto específico
 * (Aluguel, Água, Salários administrativos...) em `lib/copy/assistente.ts`,
 * caindo no texto genérico só para "Outros" e categorias sem entrada
 * própria ainda.
 */
export function CustosFixosSecao({
  custosFixos,
  onChange,
}: {
  custosFixos: CustoFixo[];
  onChange: (custosFixos: CustoFixo[]) => void;
}) {
  const { copy } = useSegmento();
  const total = somarReais(custosFixos.map((c) => c.valorMensal));

  function alterarValor(indice: number, valorMensal: number) {
    onChange(custosFixos.map((c, i) => (i === indice ? { ...c, valorMensal } : c)));
  }

  return (
    <Secao
      titulo={copy.SECOES.custosFixos.titulo}
      descricao={`${copy.SECOES.custosFixos.descricao} Total: ${formatarMoeda(total)}`}
    >
      <div className="md:grid md:grid-cols-2 md:gap-x-6">
        {custosFixos.map((custo, indice) => (
          <CurrencyField
            key={custo.categoria}
            label={custo.categoria}
            valor={custo.valorMensal}
            onChange={(valor) => alterarValor(indice, valor)}
            campo={campoCustoFixo(custo.categoria)}
          />
        ))}
      </div>

      <p className="flex items-baseline justify-between border-t border-petroleo py-3">
        <span className="text-sm font-semibold text-petroleo">Total por mês</span>
        <span className="tabular text-lg font-semibold text-petroleo">{formatarMoeda(total)}</span>
      </p>
    </Secao>
  );
}
