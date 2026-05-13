"use client";

import { useEffect, useMemo, useState } from "react";
import { GoalDisplay } from "@/components/GoalDisplay";
import { GoalManagementModal } from "@/components/GoalManagementModal";
import { usePlanningData } from "@/hooks/usePlanningData";
import { useAuthContext } from "@/contexts/AuthContext";
import type { Goal } from "@/lib/planning";

export default function GoalsPage() {
  const { user } = useAuthContext();
  const { goals, projects, createGoal, updateGoal, deleteGoal } = usePlanningData();
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
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
      if (success && editingGoal?.id === goalId) {
        setEditingGoal(null);
      }
      return success;
    } catch (error) {
      console.error("Erro ao deletar meta:", error);
      return false;
    }
  };

  const handleUpdateGoalProgress = async (goalId: string, progress: number) => {
    await handleUpdateGoal(goalId, { progress });
  };

  const handleAddInitiative = async (goalId: string, title: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const updatedInitiatives = [
      ...(goal.initiatives ?? []),
      { id: `temp-${Date.now()}`, title, completed: false },
    ];
    await handleUpdateGoal(goalId, { initiatives: updatedInitiatives });
  };

  const handleToggleInitiative = async (goalId: string, initiativeId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const updatedInitiatives = goal.initiatives.map((i) =>
      i.id === initiativeId ? { ...i, completed: !i.completed } : i
    );
    await handleUpdateGoal(goalId, { initiatives: updatedInitiatives });
  };

  const handleEditInitiative = async (
    goalId: string,
    initiativeId: string,
    newTitle: string
  ) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const updatedInitiatives = goal.initiatives.map((i) =>
      i.id === initiativeId ? { ...i, title: newTitle } : i
    );
    await handleUpdateGoal(goalId, { initiatives: updatedInitiatives });
  };

  const handleDeleteInitiative = async (goalId: string, initiativeId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const updatedInitiatives = goal.initiatives.filter((i) => i.id !== initiativeId);
    await handleUpdateGoal(goalId, { initiatives: updatedInitiatives });
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
            <button
              type="button"
              onClick={() => {
                setEditingGoal(null);
                setShowGoalModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:opacity-95"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nova meta
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-surface-container-lowest p-6 ring-1 ring-outline-variant/10">
        {orderedGoals.length === 0 ? (
          <div className="p-8 text-center">
            <h2 className="font-headline text-xl font-bold text-on-surface">
              Defina seus objetivos principais
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Crie metas trimestrais ou mensais para manter foco no que importa.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingGoal(null);
                setShowGoalModal(true);
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Criar primeira meta
            </button>
          </div>
        ) : (
          <GoalDisplay
            goals={orderedGoals}
            projects={projects}
            onEditGoal={(goal) => {
              setEditingGoal(goal);
              setShowGoalModal(true);
            }}
            onDeleteGoal={handleDeleteGoal}
            onUpdateGoalProgress={handleUpdateGoalProgress}
            onAddInitiative={handleAddInitiative}
            onToggleInitiative={handleToggleInitiative}
            onEditInitiative={handleEditInitiative}
            onDeleteInitiative={handleDeleteInitiative}
            onReorderGoals={handleReorderGoals}
          />
        )}
      </section>

      <GoalManagementModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        goal={editingGoal}
        projects={projects}
        onCreateGoal={handleCreateGoal}
        onUpdateGoal={handleUpdateGoal}
        onDeleteGoal={handleDeleteGoal}
      />
    </div>
  );
}
