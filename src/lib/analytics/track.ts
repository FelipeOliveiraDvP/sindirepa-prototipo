import type { EventoFunil } from "./events";

/**
 * Ponto único de saída de instrumentação.
 *
 * O provedor ainda não foi escolhido, e isso é de propósito: os eventos
 * já são disparados nos lugares certos, com nome e payload tipados, e
 * plugar o destino depois é editar SÓ este arquivo. O erro que este
 * desenho evita é o comum — deixar a instrumentação para o fim e
 * descobrir que os pontos de disparo se perderam.
 *
 * ⚠️ LGPD: nenhum evento aqui carrega valor de campo, só o NOME do campo
 * alterado. Saber que o usuário travou na taxa de ocupação é o que
 * interessa; saber quanto ele paga de aluguel não é, e guardar isso sem
 * consentimento explícito seria problema. Os números do usuário só são
 * persistidos em `CalculoAnonimo`, com aviso de privacidade na tela.
 */

type Sink = (evento: EventoFunil) => void;

const sinks: Sink[] = [];

/** Registra um destino. Chamado uma vez, na borda da aplicação. */
export function registrarSink(sink: Sink): void {
  sinks.push(sink);
}

export function track(evento: EventoFunil): void {
  if (sinks.length === 0 && process.env.NODE_ENV === "development") {
    // Em dev, sem provedor configurado, mostra no console para que os
    // pontos de disparo sejam conferíveis a olho.
    console.debug("[funil]", evento.nome, evento);
    return;
  }

  for (const sink of sinks) {
    try {
      sink(evento);
    } catch {
      // Instrumentação nunca derruba a calculadora. O produto funciona
      // sem analytics; o contrário não é verdade.
    }
  }
}
