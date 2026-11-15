import { createClient } from "@/lib/supabase";
import type {
  AssumptionStatus,
  HorizonStatus,
  OpportunityStatus,
  RmAssumption,
  RmDiaryEntry,
  RmEvidence,
  RmObjective,
  RmOpportunity,
  RmSolution,
  RmTask,
  RmTaskStep,
  SolutionStatus,
  TaskKind,
  TestResult,
  TreeObjective,
} from "@/lib/rootmap/types";

function sb() {
  return createClient();
}

export async function fetchTree(): Promise<TreeObjective[]> {
  const supabase = sb();
  const [
    { data: objectives, error: e1 },
    { data: opportunities, error: e2 },
    { data: solutions, error: e3 },
    { data: assumptions, error: e4 },
    { data: tasks, error: e5 },
  ] = await Promise.all([
    supabase.from("rm_objectives").select("*").order("pos"),
    supabase.from("rm_opportunities").select("*").order("pos"),
    supabase.from("rm_solutions").select("*").order("pos"),
    supabase.from("rm_assumptions").select("*").order("pos"),
    supabase.from("rm_tasks").select("*").order("pos"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  if (e3) throw e3;
  if (e4) throw e4;
  if (e5) throw e5;

  const opps = (opportunities ?? []) as RmOpportunity[];
  const sols = (solutions ?? []) as RmSolution[];
  const asses = (assumptions ?? []) as RmAssumption[];
  const tks = (tasks ?? []) as RmTask[];

  return ((objectives ?? []) as RmObjective[]).map((ob) => ({
    ...ob,
    opportunities: opps
      .filter((o) => o.objective_id === ob.id)
      .map((o) => ({
        ...o,
        solutions: sols
          .filter((s) => s.opportunity_id === o.id)
          .map((s) => ({
            ...s,
            assumptions: asses.filter((a) => a.solution_id === s.id),
            tasks: tks.filter((t) => t.solution_id === s.id),
          })),
      })),
  }));
}

export async function fetchLooseAndAllTasks() {
  const supabase = sb();
  const { data, error } = await supabase
    .from("rm_tasks")
    .select("*")
    .order("pos");
  if (error) throw error;
  return (data ?? []) as RmTask[];
}

export async function fetchOpportunityBundle(id: string) {
  const supabase = sb();
  const { data: opportunity, error } = await supabase
    .from("rm_opportunities")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;

  const [{ data: evidences }, { data: diary }, { data: solutions }] =
    await Promise.all([
      supabase
        .from("rm_evidences")
        .select("*")
        .eq("opportunity_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("rm_diary_entries")
        .select("*")
        .eq("opportunity_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("rm_solutions")
        .select("*")
        .eq("opportunity_id", id)
        .order("pos"),
    ]);

  return {
    opportunity: opportunity as RmOpportunity,
    evidences: (evidences ?? []) as RmEvidence[],
    diary: (diary ?? []) as RmDiaryEntry[],
    solutions: (solutions ?? []) as RmSolution[],
  };
}

export async function fetchSolutionBundle(id: string) {
  const supabase = sb();
  const { data: solution, error } = await supabase
    .from("rm_solutions")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;

  const [{ data: assumptions }, { data: tasks }, { data: opportunity }] =
    await Promise.all([
      supabase
        .from("rm_assumptions")
        .select("*")
        .eq("solution_id", id)
        .order("pos"),
      supabase.from("rm_tasks").select("*").eq("solution_id", id).order("pos"),
      supabase
        .from("rm_opportunities")
        .select("*")
        .eq("id", (solution as RmSolution).opportunity_id)
        .single(),
    ]);

  return {
    solution: solution as RmSolution,
    assumptions: (assumptions ?? []) as RmAssumption[],
    tasks: (tasks ?? []) as RmTask[],
    opportunity: opportunity as RmOpportunity,
  };
}

export async function fetchTaskBundle(id: string) {
  const supabase = sb();
  const { data: task, error } = await supabase
    .from("rm_tasks")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;

  const [{ data: steps }, { data: assumption }] = await Promise.all([
    supabase.from("rm_task_steps").select("*").eq("task_id", id).order("pos"),
    (task as RmTask).assumption_id
      ? supabase
          .from("rm_assumptions")
          .select("*")
          .eq("id", (task as RmTask).assumption_id!)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    task: task as RmTask,
    steps: (steps ?? []) as RmTaskStep[],
    assumption: (assumption as RmAssumption | null) ?? null,
  };
}

export async function createObjective(input: {
  tag: string;
  title: string;
  metric?: string;
  color?: string;
  soft_color?: string;
  pos?: number;
}) {
  const supabase = sb();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data, error } = await supabase
    .from("rm_objectives")
    .insert({
      user_id: user.id,
      tag: input.tag,
      title: input.title,
      metric: input.metric ?? null,
      color: input.color ?? "oklch(0.55 0.2 28)",
      soft_color: input.soft_color ?? "oklch(0.94 0.04 28)",
      pos: input.pos ?? Date.now(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as RmObjective;
}

export async function createOpportunity(input: {
  objective_id: string;
  title: string;
  status?: OpportunityStatus;
  is_focus?: boolean;
  pos?: number;
}) {
  const supabase = sb();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  if (input.is_focus) {
    await supabase
      .from("rm_opportunities")
      .update({ is_focus: false })
      .eq("objective_id", input.objective_id)
      .eq("is_focus", true);
  }
  const { data, error } = await supabase
    .from("rm_opportunities")
    .insert({
      user_id: user.id,
      objective_id: input.objective_id,
      title: input.title,
      status: input.status ?? "agora",
      is_focus: !!input.is_focus,
      pos: input.pos ?? Date.now(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as RmOpportunity;
}

export async function createSolution(input: {
  opportunity_id: string;
  title: string;
  status?: SolutionStatus;
  is_focus?: boolean;
  pos?: number;
}) {
  const supabase = sb();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  if (input.is_focus) {
    await supabase
      .from("rm_solutions")
      .update({ is_focus: false })
      .eq("opportunity_id", input.opportunity_id)
      .eq("is_focus", true);
  }
  const { data, error } = await supabase
    .from("rm_solutions")
    .insert({
      user_id: user.id,
      opportunity_id: input.opportunity_id,
      title: input.title,
      status: input.status ?? "agora",
      is_focus: !!input.is_focus,
      focused_at: input.is_focus ? new Date().toISOString() : null,
      pos: input.pos ?? Date.now(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as RmSolution;
}

export async function createAssumption(input: {
  solution_id: string;
  title: string;
  pos?: number;
}) {
  const supabase = sb();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data, error } = await supabase
    .from("rm_assumptions")
    .insert({
      user_id: user.id,
      solution_id: input.solution_id,
      title: input.title,
      status: "nao_testada" satisfies AssumptionStatus,
      pos: input.pos ?? Date.now(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as RmAssumption;
}

export async function createTask(input: {
  title: string;
  kind?: TaskKind;
  status?: HorizonStatus;
  objective_id?: string | null;
  solution_id?: string | null;
  assumption_id?: string | null;
  hypothesis?: string | null;
  wait_reason?: string | null;
  recurrence?: string | null;
  pos?: number;
}) {
  const supabase = sb();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data, error } = await supabase
    .from("rm_tasks")
    .insert({
      user_id: user.id,
      title: input.title,
      kind: input.kind ?? "entrega",
      status: input.status ?? "agora",
      objective_id: input.objective_id ?? null,
      solution_id: input.solution_id ?? null,
      assumption_id: input.assumption_id ?? null,
      hypothesis: input.hypothesis ?? null,
      wait_reason: input.wait_reason ?? null,
      recurrence: input.recurrence ?? null,
      pos: input.pos ?? Date.now(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as RmTask;
}

export async function toggleTaskDone(task: RmTask, completed: boolean) {
  const supabase = sb();
  const { error } = await supabase
    .from("rm_tasks")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", task.id);
  if (error) throw error;
}

export async function applyTestResult(taskId: string, result: TestResult) {
  const supabase = sb();
  const { error } = await supabase.rpc("rm_apply_test_result", {
    p_task_id: taskId,
    p_result: result,
  });
  if (error) throw error;
}

export async function updateOpportunityStatus(
  id: string,
  status: OpportunityStatus
) {
  const supabase = sb();
  const { error } = await supabase
    .from("rm_opportunities")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export async function setOpportunityFocus(
  opportunityId: string,
  objectiveId: string,
  focus: boolean
) {
  const supabase = sb();
  if (focus) {
    await supabase
      .from("rm_opportunities")
      .update({ is_focus: false })
      .eq("objective_id", objectiveId)
      .eq("is_focus", true);
  }
  const { error } = await supabase
    .from("rm_opportunities")
    .update({ is_focus: focus })
    .eq("id", opportunityId);
  if (error) throw error;
}

export async function updateSolutionStatus(id: string, status: SolutionStatus) {
  const supabase = sb();
  const patch: Partial<RmSolution> = { status };
  if (status === "validada") patch.validated_at = new Date().toISOString();
  const { error } = await supabase.from("rm_solutions").update(patch).eq("id", id);
  if (error) throw error;
}

export async function setSolutionFocus(
  solutionId: string,
  opportunityId: string,
  focus: boolean
) {
  const supabase = sb();
  if (focus) {
    await supabase
      .from("rm_solutions")
      .update({ is_focus: false })
      .eq("opportunity_id", opportunityId)
      .eq("is_focus", true);
  }
  const { error } = await supabase
    .from("rm_solutions")
    .update({
      is_focus: focus,
      focused_at: focus ? new Date().toISOString() : null,
    })
    .eq("id", solutionId);
  if (error) throw error;
}

export async function updateTaskStatus(id: string, status: HorizonStatus) {
  const supabase = sb();
  const { error } = await supabase.from("rm_tasks").update({ status }).eq("id", id);
  if (error) throw error;
}

/** Coloca em espera (motivo) ou tira da espera. Em espera → fundo da fila (pos). */
export async function setTaskWait(taskId: string, reason: string | null) {
  const supabase = sb();
  const patch: { wait_reason: string | null; pos?: number } = {
    wait_reason: reason,
  };
  if (reason) {
    const { data: maxRow } = await supabase
      .from("rm_tasks")
      .select("pos")
      .order("pos", { ascending: false })
      .limit(1)
      .maybeSingle();
    patch.pos = (maxRow?.pos ?? Date.now()) + 1;
  }
  const { error } = await supabase
    .from("rm_tasks")
    .update(patch)
    .eq("id", taskId);
  if (error) throw error;
}

export async function deleteTask(taskId: string) {
  const supabase = sb();
  const { error } = await supabase.from("rm_tasks").delete().eq("id", taskId);
  if (error) throw error;
}

export async function addEvidence(opportunityId: string, body: string) {
  const supabase = sb();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { error } = await supabase.from("rm_evidences").insert({
    user_id: user.id,
    opportunity_id: opportunityId,
    body,
  });
  if (error) throw error;
}

export async function addDiary(opportunityId: string, body: string) {
  const supabase = sb();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { error } = await supabase.from("rm_diary_entries").insert({
    user_id: user.id,
    opportunity_id: opportunityId,
    body,
  });
  if (error) throw error;
}

export async function addTaskStep(taskId: string, title: string) {
  const supabase = sb();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { error } = await supabase.from("rm_task_steps").insert({
    user_id: user.id,
    task_id: taskId,
    title,
    pos: Date.now(),
  });
  if (error) throw error;
}

export async function toggleStep(id: string, done: boolean) {
  const supabase = sb();
  const { error } = await supabase
    .from("rm_task_steps")
    .update({ done })
    .eq("id", id);
  if (error) throw error;
}

/** Seed inicial alinhado ao mock Rootmap (KMN/EXT/MZCTO/OWN). */
export async function seedRootmapDemo() {
  const supabase = sb();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { count } = await supabase
    .from("rm_objectives")
    .select("*", { count: "exact", head: true });
  if ((count ?? 0) > 0) return { seeded: false };

  const kmn = await createObjective({
    tag: "KMN",
    title: "Fazer a KimonoLab ganhar market share",
    metric: "Pedidos/mês: 18 → 60",
    color: "oklch(0.55 0.2 28)",
    soft_color: "oklch(0.94 0.04 28)",
    pos: 1000,
  });
  const ext = await createObjective({
    tag: "EXT",
    title: "Reduzir o volume de suporte na ExitLag",
    metric: "Tickets/semana −30%",
    color: "oklch(0.5 0.18 295)",
    soft_color: "oklch(0.94 0.04 295)",
    pos: 2000,
  });
  const mzc = await createObjective({
    tag: "MZCTO",
    title: "Fazer a MZCTO rodar sem depender de mim",
    metric: "Minhas horas/semana: 15 → 5",
    color: "oklch(0.5 0.14 245)",
    soft_color: "oklch(0.94 0.035 245)",
    pos: 3000,
  });
  const own = await createObjective({
    tag: "OWN",
    title: "Casa e finanças prontas para o bebê",
    metric: "Até março",
    color: "oklch(0.5 0.13 150)",
    soft_color: "oklch(0.94 0.04 150)",
    pos: 4000,
  });

  const opp = await createOpportunity({
    objective_id: kmn.id,
    title:
      "Cliente novo não confia na marca o suficiente para um pedido mínimo de 10–12 peças",
    status: "agora",
    is_focus: true,
    pos: 1000,
  });
  await supabase
    .from("rm_opportunities")
    .update({
      description:
        "O mercado exige lote de 10–12 peças a um preço alto, pago em 2x. O cliente novo precisa assumir esse compromisso antes de conhecer a marca e desiste na conversa.",
      success_signal:
        "Clientes novos fechando pedidos de 1–3 peças sem precisar de negociação.",
    })
    .eq("id", opp.id);

  await addEvidence(
    opp.id,
    "Os ads funcionam pra trazer gente pra conversar, e param aí."
  );
  await addEvidence(
    opp.id,
    "O cliente novo, frio, é obrigado a um compromisso grande antes de qualquer confiança existir, e some."
  );

  const sol = await createSolution({
    opportunity_id: opp.id,
    title: "Personalizado avulso, sem pedido mínimo",
    status: "agora",
    is_focus: true,
    pos: 1000,
  });
  await supabase
    .from("rm_solutions")
    .update({
      description:
        "Vender kimono personalizado a partir de 1 peça, com pagamento único no pedido. Ninguém no mercado faz personalizado sem lote mínimo.",
    })
    .eq("id", sol.id);

  const a1 = await createAssumption({
    solution_id: sol.id,
    title: "Cliente novo compra 1–3 peças se não houver pedido mínimo",
    pos: 1000,
  });
  const a2 = await createAssumption({
    solution_id: sol.id,
    title: "A margem continua positiva com lote unitário",
    pos: 2000,
  });
  await createAssumption({
    solution_id: sol.id,
    title: "Fornecedor entrega peça única em até 15 dias",
    pos: 3000,
  });
  await supabase
    .from("rm_assumptions")
    .update({
      status: "validada",
      status_note: "Validada em 8 nov · simulação de custos",
    })
    .eq("id", a2.id);

  await createTask({
    title: "Atualizar catálogo do WhatsApp — personalizado sem pedido mínimo",
    objective_id: kmn.id,
    solution_id: sol.id,
    status: "agora",
    pos: 1000,
  }).then(async (t) => toggleTaskDone(t, true));
  await createTask({
    title: "Preparar comunicação para ads do personalizado",
    objective_id: kmn.id,
    solution_id: sol.id,
    status: "agora",
    pos: 2000,
  }).then(async (t) => toggleTaskDone(t, true));
  await createTask({
    title: "Subir ads novas — personalizado individual",
    kind: "teste",
    objective_id: kmn.id,
    solution_id: sol.id,
    assumption_id: a1.id,
    hypothesis:
      'Se anunciarmos "a partir de 1 peça" para público frio, pelo menos 5% dos leads fecham pedido em 14 dias.',
    wait_reason: "aguardando mockup",
    status: "agora",
    pos: 3000,
  });
  await createTask({
    title: "Criar ferramenta de mockup com biblioteca de ícones",
    objective_id: kmn.id,
    solution_id: sol.id,
    status: "agora",
    pos: 4000,
  });
  await createTask({
    title: "Pedir orçamento de peça única a 3 fábricas",
    kind: "teste",
    objective_id: kmn.id,
    solution_id: sol.id,
    status: "proximo",
    pos: 5000,
  });

  await createSolution({
    opportunity_id: opp.id,
    title: "Pagamento 1x no pedido, em vez de 2x",
    status: "proximo",
    pos: 2000,
  });
  await createSolution({
    opportunity_id: opp.id,
    title: "Kit amostra pago, abatido no 1º pedido",
    status: "depois",
    pos: 3000,
  });

  // EXT / MZCTO / OWN minimal trees
  const extOpp = await createOpportunity({
    objective_id: ext.id,
    title: "Suporte recebe casos que o playbook de CS não prevê",
    status: "agora",
    is_focus: true,
    pos: 1000,
  });
  const extSol = await createSolution({
    opportunity_id: extOpp.id,
    title: "Playbook de CS com definições de suporte",
    status: "agora",
    is_focus: true,
    pos: 1000,
  });
  await createTask({
    title: "Atualizar playbook de CS com definições de suporte",
    objective_id: ext.id,
    solution_id: extSol.id,
    status: "agora",
    pos: 1000,
  });
  await createTask({
    title: "Analisar dados de CS e uso do SDK",
    kind: "teste",
    objective_id: ext.id,
    solution_id: extSol.id,
    status: "agora",
    pos: 2000,
  });

  const mzcOpp = await createOpportunity({
    objective_id: mzc.id,
    title: "Decisões do dia a dia travam esperando minha resposta",
    status: "agora",
    is_focus: true,
    pos: 1000,
  });
  const mzcSol = await createSolution({
    opportunity_id: mzcOpp.id,
    title: "Rito semanal de alinhamento com o time",
    status: "agora",
    is_focus: true,
    pos: 1000,
  });
  await createTask({
    title: "Definir pauta fixa do rito semanal",
    objective_id: mzc.id,
    solution_id: mzcSol.id,
    status: "agora",
    pos: 1000,
  });

  const ownOpp = await createOpportunity({
    objective_id: own.id,
    title: "Quarto do bebê ainda não está definido",
    status: "agora",
    is_focus: true,
    pos: 1000,
  });
  const ownSol = await createSolution({
    opportunity_id: ownOpp.id,
    title: "Usar o quarto de cima",
    status: "agora",
    is_focus: true,
    pos: 1000,
  });
  await createTask({
    title: "Definir quarto do bebê",
    objective_id: own.id,
    solution_id: ownSol.id,
    status: "agora",
    pos: 1000,
  });

  // Avulsas recorrentes
  await createTask({
    title: "Responder WhatsApp da Lab",
    objective_id: kmn.id,
    status: "agora",
    recurrence: "Diária",
    pos: 50,
  });
  await createTask({
    title: "Preparar as WBRs",
    objective_id: ext.id,
    status: "agora",
    recurrence: "Semanal",
    pos: 60,
  });
  await createTask({
    title: "Pagar contas do mês",
    objective_id: own.id,
    status: "agora",
    recurrence: "Mensal",
    pos: 70,
  });

  await addDiary(
    opp.id,
    "Catálogo do WhatsApp e comunicação prontos. Ads travados no mockup — ver a solução #1."
  );

  return { seeded: true };
}
