'use client'

import { useState, type ReactNode } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
  applyStrategicAnswerCascade,
  applyTaskTypeChange,
  computeClassificationFromDraft,
  type ClassificationDraft,
  type TaskType,
  type YesNo,
} from '@/lib/taskClassification'
import { DraftClassificationBadge } from '@/components/planning/ClassificationBadge'

function ConcreteHintContent() {
  return (
    <>
      <p className="mb-3">
        <strong>Concreto</strong> = você consegue nomear quem ou o quê vai dar errado, em uma frase.
      </p>
      <p className="mb-1 font-semibold">Exemplos concretos (signal):</p>
      <ul className="mb-3 list-disc space-y-1 pl-5">
        <li>Faceit não renova contrato em junho</li>
        <li>Klasik fica sem resposta há 2 semanas e esfria</li>
        <li>Amanda fica magoada porque esqueci o aniversário</li>
        <li>IPVA vence dia 15 e leva multa</li>
        <li>Renaldo trava no deploy porque falta minha aprovação</li>
      </ul>
      <p className="mb-1 font-semibold">Exemplos vagos (noise disfarçado):</p>
      <ul className="mb-3 list-disc space-y-1 pl-5">
        <li>Vou perder momentum</li>
        <li>Fica mais difícil escalar depois</li>
        <li>Acumula débito técnico</li>
        <li>Perco visibilidade do sistema</li>
        <li>Vou ficar desorganizado</li>
      </ul>
      <p>
        <strong>Regra de bolso:</strong> Termina a frase &quot;Se eu não fizer isso, _______.&quot; Se o
        que vem depois tem nome próprio, número ou data → concreto. Se é sentimento ou estado
        abstrato → vago.
      </p>
    </>
  )
}

function StrategicQuestionLabel({
  children,
  showConcreteHint = false,
}: {
  children: ReactNode
  showConcreteHint?: boolean
}) {
  const [hintOpen, setHintOpen] = useState(false)

  return (
    <div className="mb-2">
      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm font-medium text-on-surface">{children}</p>
        {showConcreteHint ? (
          <button
            type="button"
            aria-label="O que é concreto?"
            aria-expanded={hintOpen}
            onClick={() => setHintOpen((v) => !v)}
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-on-surface-variant ring-1 ring-outline-variant/40 hover:bg-surface-container-high hover:text-on-surface"
          >
            ⓘ
          </button>
        ) : null}
      </div>
      {showConcreteHint && hintOpen ? (
        <div
          role="tooltip"
          className="mt-2 max-w-[400px] rounded-lg border border-outline-variant/15 bg-white p-4 text-left text-sm leading-relaxed text-gray-800 shadow-lg"
        >
          <ConcreteHintContent />
        </div>
      ) : null}
    </div>
  )
}

function YesNoButtons({
  value,
  onChange,
  disabled,
}: {
  value: YesNo | null
  onChange: (v: YesNo) => void
  disabled?: boolean
}) {
  return (
    <div className="flex gap-2">
      {(['yes', 'no'] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt)}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-40 ${
            value === opt
              ? 'border-primary/35 bg-primary-fixed/30 text-on-surface'
              : 'border-outline-variant/35 bg-surface-container-lowest text-on-surface-variant'
          }`}
        >
          {opt === 'yes' ? 'Sim' : 'Não'}
        </button>
      ))}
    </div>
  )
}

export function TaskClassificationBlock({
  draft,
  onChange,
  disabled,
}: {
  draft: ClassificationDraft
  onChange: (next: ClassificationDraft) => void
  disabled?: boolean
}) {
  const setTaskType = (taskType: TaskType) => {
    onChange(applyTaskTypeChange(draft, taskType))
  }

  const setStrategic = (
    question: 'q1' | 'q2' | 'q3',
    answer: YesNo
  ) => {
    onChange({
      ...draft,
      strategic: applyStrategicAnswerCascade(draft.strategic, question, answer),
    })
  }

  const { strategic, lifeAdmin } = draft
  const q1No = strategic.q1MovesMetric === 'no'
  const showQ2 = strategic.q1MovesMetric === 'yes'
  const showQ3 = showQ2 && strategic.q2Consequence30d === 'yes'

  return (
    <section className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-on-surface">Classificação</h4>
        <p className="text-xs text-on-surface-variant">
          Defina o tipo de task e responda as perguntas para roteamento automático.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Tipo de task
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['STRATEGIC', 'Estratégica'],
                ['LIFE_ADMIN', 'Manutenção'],
              ] as const
            ).map(([type, label]) => (
              <button
                key={type}
                type="button"
                disabled={disabled}
                onClick={() => setTaskType(type)}
                className={`rounded-lg border px-3 py-3 text-sm font-semibold transition-colors disabled:opacity-40 ${
                  draft.taskType === type
                    ? 'border-primary/40 bg-primary-fixed/25 text-on-surface'
                    : 'border-outline-variant/35 bg-surface-container-lowest text-on-surface-variant'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-on-surface-variant">
            Estratégica move métrica do trimestre. Manutenção mantém a vida funcionando.
          </p>
        </div>

        {draft.taskType === 'STRATEGIC' ? (
          <div className="space-y-4 border-t border-outline-variant/20 pt-4">
            <div>
              <StrategicQuestionLabel>
                Move uma métrica nomeada do trimestre?
              </StrategicQuestionLabel>
              <YesNoButtons
                value={strategic.q1MovesMetric}
                onChange={(v) => setStrategic('q1', v)}
                disabled={disabled}
              />
            </div>
            {showQ2 && !q1No ? (
              <div>
                <StrategicQuestionLabel showConcreteHint>
                  Se eu não fizer, algo concreto dá errado em 30 dias?
                </StrategicQuestionLabel>
                <YesNoButtons
                  value={strategic.q2Consequence30d}
                  onChange={(v) => setStrategic('q2', v)}
                  disabled={disabled}
                />
              </div>
            ) : null}
            {showQ3 ? (
              <div>
                <StrategicQuestionLabel showConcreteHint>
                  Se eu não fizer, algo concreto dá errado em 7 dias?
                </StrategicQuestionLabel>
                <YesNoButtons
                  value={strategic.q3Consequence7d}
                  onChange={(v) => setStrategic('q3', v)}
                  disabled={disabled}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {draft.taskType === 'LIFE_ADMIN' ? (
          <div className="space-y-3 border-t border-outline-variant/20 pt-4">
            <div>
              <p className="mb-2 text-sm font-medium text-on-surface">Tem deadline real?</p>
              <YesNoButtons
                value={lifeAdmin.hasDeadline}
                onChange={(v) =>
                  onChange({
                    ...draft,
                    lifeAdmin: {
                      hasDeadline: v,
                      deadline: v === 'yes' ? lifeAdmin.deadline : null,
                    },
                  })
                }
                disabled={disabled}
              />
            </div>
            {lifeAdmin.hasDeadline === 'yes' ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-on-surface-variant">
                  Data limite
                </label>
                <DatePicker
                  selected={lifeAdmin.deadline ? new Date(lifeAdmin.deadline) : null}
                  onChange={(date: Date | null) =>
                    onChange({
                      ...draft,
                      lifeAdmin: {
                        ...lifeAdmin,
                        deadline: date ? date.toISOString().slice(0, 10) : null,
                      },
                    })
                  }
                  disabled={disabled}
                  className="w-full rounded-lg border border-outline-variant/35 bg-surface-container-lowest px-3 py-2 text-sm"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Selecionar data"
                  isClearable
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <DraftClassificationBadge draft={draft} />
      </div>
    </section>
  )
}

export function classificationDraftToTodoPatch(draft: ClassificationDraft) {
  const result = computeClassificationFromDraft(draft)
  if (!result) return null
  return {
    taskType: result.taskType,
    statusClassification: result.statusClassification,
    lifeAdminSubtype: result.lifeAdminSubtype,
    lifeAdminDeadline: result.lifeAdminDeadline,
    revisaoEm: result.revisaoEm,
    status: result.status,
    needsReclassification: false,
  }
}
