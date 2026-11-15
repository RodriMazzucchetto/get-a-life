export type HorizonStatus = "agora" | "proximo" | "depois";
export type OpportunityStatus = HorizonStatus | "resolvido";
export type SolutionStatus = HorizonStatus | "descartada" | "validada";
export type AssumptionStatus = "nao_testada" | "em_teste" | "validada" | "invalidada";
export type TaskKind = "entrega" | "teste";
export type TestResult = "validou" | "invalidou" | "inconclusivo";
export type Recurrence = "Diária" | "Semanal" | "Mensal";

export type RmObjective = {
  id: string;
  user_id: string;
  tag: string;
  title: string;
  metric: string | null;
  color: string;
  soft_color: string;
  pos: number;
  created_at: string;
  updated_at: string;
};

export type RmOpportunity = {
  id: string;
  user_id: string;
  objective_id: string;
  title: string;
  description: string | null;
  success_signal: string | null;
  status: OpportunityStatus;
  is_focus: boolean;
  pos: number;
  created_at: string;
  updated_at: string;
};

export type RmSolution = {
  id: string;
  user_id: string;
  opportunity_id: string;
  title: string;
  description: string | null;
  status: SolutionStatus;
  is_focus: boolean;
  focused_at: string | null;
  validated_at: string | null;
  pos: number;
  created_at: string;
  updated_at: string;
};

export type RmAssumption = {
  id: string;
  user_id: string;
  solution_id: string;
  title: string;
  status: AssumptionStatus;
  status_note: string | null;
  pos: number;
  created_at: string;
  updated_at: string;
};

export type RmTask = {
  id: string;
  user_id: string;
  objective_id: string | null;
  solution_id: string | null;
  assumption_id: string | null;
  title: string;
  notes: string | null;
  kind: TaskKind;
  status: HorizonStatus;
  hypothesis: string | null;
  test_result: TestResult | null;
  wait_reason: string | null;
  recurrence: Recurrence | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  pos: number;
  created_at: string;
  updated_at: string;
};

export type RmTaskStep = {
  id: string;
  user_id: string;
  task_id: string;
  title: string;
  done: boolean;
  pos: number;
  created_at: string;
};

export type RmEvidence = {
  id: string;
  user_id: string;
  opportunity_id: string;
  body: string;
  source_task_id: string | null;
  created_at: string;
};

export type RmDiaryEntry = {
  id: string;
  user_id: string;
  opportunity_id: string;
  body: string;
  created_at: string;
};

export type TreeSolution = RmSolution & {
  assumptions: RmAssumption[];
  tasks: RmTask[];
};

export type TreeOpportunity = RmOpportunity & {
  solutions: TreeSolution[];
};

export type TreeObjective = RmObjective & {
  opportunities: TreeOpportunity[];
};
