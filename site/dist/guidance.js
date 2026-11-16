// A group identifies a choice of reading within a map. The remaining topics keep their usual place in the route.
export const guidance = {
  psicanalise: {
    sonhos: {
      role: 'anytime',
      note: 'Você pode voltar ao sonho da refeição com espinafre quando quiser ver como Freud trabalhou com associações.'
    },
    klein: {
      role: 'recommended', group: 'primeiro-autor',
      note: 'Ao escolher seu primeiro autor depois de Freud, sugerimos Klein se a pergunta é como as relações com os outros aparecem na fantasia.'
    },
    winnicott: {
      role: 'alternative', group: 'primeiro-autor',
      note: 'Você pode começar por Winnicott se quiser investigar o papel do ambiente e dos cuidados no amadurecimento.'
    },
    lacan: {
      role: 'alternative', group: 'primeiro-autor',
      note: 'Você pode começar por Lacan se sua pergunta é como a linguagem participa da formação do sintoma.'
    }
  },
  tcc: {
    experimentos: {
      role: 'recommended', group: 'primeira-vinheta',
      note: 'Para o primeiro exercício após descoberta guiada, sugerimos a vinheta em que uma previsão pode ser comparada com o que aconteceu.'
    },
    ativacao: {
      role: 'alternative', group: 'primeira-vinheta',
      note: 'Se preferir estudar a relação entre rotina e humor, escolha a vinheta de ativação como primeiro exercício.'
    },
    cultura: {
      role: 'anytime',
      note: 'Consulte a revisão sobre adaptação cultural ao estudar qualquer exemplo e observe para qual população ele foi elaborado.'
    }
  },
  'analise-do-comportamento': {
    reforco: {
      role: 'recommended', group: 'exemplo-de-contingencia',
      note: 'Depois de montar uma tríplice contingência, sugerimos começar pela consequência e observar como a frequência da ação muda.'
    },
    estimulos: {
      role: 'alternative', group: 'exemplo-de-contingencia',
      note: 'Você também pode começar pelo antecedente. A placa de uma loja ajuda a pensar em que situações uma ação costuma ocorrer.'
    },
    aplicacao: {
      role: 'anytime',
      note: 'Consulte as perguntas sobre validade social sempre que ler um resultado e quiser saber quem considerou a mudança importante.'
    }
  },
  acp: {
    brasil: {
      role: 'anytime',
      note: 'O registro da visita de Rogers em 1977 pode ser visto em qualquer ponto do percurso.'
    },
    empatia: {
      role: 'anytime',
      note: 'Ao explorar as atitudes de Rogers, você pode começar pelo diálogo sobre empatia ou retomá-lo depois da aceitação e da congruência.'
    },
    consideracao: {
      role: 'anytime',
      note: 'A vinheta sobre acolhimento pode ser lida antes ou depois dos exemplos de empatia e congruência.'
    },
    congruencia: {
      role: 'anytime',
      note: 'Você pode explorar a experiência do terapeuta antes ou depois das outras duas atitudes e depois comparar os três exemplos.'
    }
  },
  sistemica: {
    perguntas: {
      role: 'recommended', group: 'primeira-escola',
      note: 'Para aprofundar a conversa sobre circularidade, sugerimos começar pela escola de Milão e comparar duas formas de perguntar.'
    },
    fronteiras: {
      role: 'alternative', group: 'primeira-escola',
      note: 'Você pode começar pela escola estrutural de Minuchin se quiser investigar quem participa das decisões familiares.'
    },
    poder: {
      role: 'anytime',
      note: 'Volte a estas perguntas ao ler qualquer caso familiar para examinar quem decide, quem cuida e quem pode discordar em segurança.'
    }
  },
  gestalt: {
    'psicologia-da-gestalt': {
      role: 'anytime',
      note: 'O exemplo da melodia ajuda a retomar a história dos estudos da percepção em qualquer ponto do mapa.'
    },
    'figura-fundo': {
      role: 'recommended', group: 'exemplo-de-campo',
      note: 'Para explorar o campo em uma cena cotidiana, sugerimos observar como a queda de uma xícara muda o destaque dos sons no café.'
    },
    'aqui-agora': {
      role: 'alternative', group: 'exemplo-de-campo',
      note: 'Se preferir começar pelo encontro clínico, acompanhe como uma lembrança ganha forma no gesto e na fala de quem a conta.'
    }
  },
  analitica: {
    nise: {
      role: 'anytime',
      note: 'As imagens e cartas do acervo de Nise da Silveira podem acompanhar tanto o estudo das origens quanto a leitura sobre símbolos.'
    },
    'persona-sombra': {
      role: 'recommended', group: 'exemplo-de-arquetipo',
      note: 'Para uma primeira leitura após arquétipos, sugerimos o exemplo da pessoa conciliadora e a relação entre seu papel social e a firmeza que pouco reconhece em si.'
    },
    'anima-animus': {
      role: 'alternative', group: 'exemplo-de-arquetipo',
      note: 'Se seu interesse é gênero, você pode começar pela comparação entre duas leituras contemporâneas de anima e animus.'
    }
  },
  base: {
    memoria: {
      role: 'recommended', group: 'exemplo-de-investigacao',
      note: 'Para experimentar como se formula uma pergunta de pesquisa, sugerimos comparar duas tarefas simples de memória.'
    },
    desenvolvimento: {
      role: 'alternative', group: 'exemplo-de-investigacao',
      note: 'Você também pode escolher a mudança de escola como primeiro exemplo e investigar como o ambiente participa do desenvolvimento.'
    },
    historia: {
      role: 'anytime',
      note: 'A história da profissão pode ser consultada no início ou retomada quando uma escola, serviço ou instituição aparecer nas leituras.'
    }
  }
};
