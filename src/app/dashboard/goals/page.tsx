"use client";

import { useEffect, useMemo, useState } from "react";
import { GoalDisplay } from "@/components/GoalDisplay";
import { usePlanningData } from "@/hooks/usePlanningData";
import { useAuthContext } from "@/contexts/AuthContext";
import type { Goal } from "@/lib/planning";

export default function GoalsPage() {
  const { user } = useAuthContext();
  const {
    goals,
    projects,
    createGoal,
    updateGoal,
    deleteGoal,
  } = usePlanningData();
  const [orderedGoalIds, setOrderedGoalIds] = useState<string[]>([]);

  const storageKey = useMemo(
    () => (user?.id ? `taskarchitect-goal-order-${user.id}` : "taskarchitect-goal-order-anon"),
    [user?.id]
  );

  useEffect(() => {
    const currentIds = goals.map((goal) => goal.id);
    setOrderedGoalIds((prev) => {
      let base = prev;
      if (base.length === 0 && typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              base = parsed.filter((id): id is string => typeof id === "string");
            }
          }
        } catch (error) {
          console.error("Erro ao carregar ordem de metas:", error);
        }
      }
      const valid = base.filter((id) => currentIds.includes(id));
      const missing = currentIds.filter((id) => !valid.includes(id));
      return [...valid, ...missing];
    });
  }, [goals, storageKey]);

  const orderedGoals = useMemo(() => {
    const goalsById = new Map(goals.map((goal) => [goal.id, goal]));
    const ordered = orderedGoalIds
      .map((goalId) => goalsById.get(goalId))
      .filter((goal): goal is Goal => Boolean(goal));
    const leftovers = goals.filter((goal) => !orderedGoalIds.includes(goal.id));
    return [...ordered, ...leftovers];
  }, [goals, orderedGoalIds]);

  const averageProgress = useMemo(() => {
    if (goals.length === 0) return 0;
    return Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length);
  }, [goals]);

  const handleCreateGoal = async (
    goalData: Omit<Goal, "id" | "created_at" | "updated_at">
  ) => {
    try {
      const created = await createGoal(goalData);
      return created;
    } catch (error) {
      console.error("Erro ao criar meta:", error);
      return null;
    }
  };

  const handleUpdateGoal = async (id: string, updates: Partial<Goal>) => {
    try {
      const updated = await updateGoal(id, updates);
      return updated;
    } catch (error) {
      console.error("Erro ao atualizar meta:", error);
      return null;
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const success = await deleteGoal(goalId);
      return success;
    } catch (error) {
      console.error("Erro ao deletar meta:", error);
      return false;
    }
  };

  const handleReorderGoals = (nextGoalIds: string[]) => {
    setOrderedGoalIds(nextGoalIds);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(nextGoalIds));
    }
  };

  return (
    <div className="space-y-8 pb-8">
      <section className="rounded-2xl bg-surface-container-lowest p-6 ring-1 ring-outline-variant/15">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
              Metas
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Acompanhe objetivos por projeto, progresso e iniciativas.
            </p>
          </div>
          <div className="inline-flex items-center gap-3">
            <span className="rounded-full bg-tertiary-fixed px-3 py-1 text-xs font-bold uppercase text-on-tertiary-fixed-variant">
              {averageProgress}% média
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-surface-container-lowest p-6 ring-1 ring-outline-variant/10">
        <GoalDisplay
          goals={orderedGoals}
          projects={projects}
          onCreateGoal={handleCreateGoal}
          onUpdateGoal={handleUpdateGoal}
          onDeleteGoal={handleDeleteGoal}
          onReorderGoals={handleReorderGoals}
        />
      </section>
    </div>
  );
}
