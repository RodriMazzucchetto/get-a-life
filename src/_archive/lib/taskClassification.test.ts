import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  applyStrategicAnswerCascade,
  canMoveTodoToStatus,
  computeStrategicClassification,
  computeLifeAdminClassification,
  isTodoClassificationIncomplete,
  getKanbanColumnForTodo,
} from './taskClassification.ts'

describe('computeStrategicClassification — roteamento das 3 perguntas', () => {
  const createdAt = '2026-01-01T12:00:00.000Z'

  it('Q1=Não → CORTADA / archived', () => {
    const r = computeStrategicClassification(
      { q1MovesMetric: 'no', q2Consequence30d: null, q3Consequence7d: null },
      createdAt
    )
    assert.equal(r?.statusClassification, 'CORTADA')
    assert.equal(r?.status, 'archived')
  })

  it('Q1=Sim, Q2=Não → ADIADA_30D / backlog + revisao_em', () => {
    const r = computeStrategicClassification(
      { q1MovesMetric: 'yes', q2Consequence30d: 'no', q3Consequence7d: null },
      createdAt
    )
    assert.equal(r?.statusClassification, 'ADIADA_30D')
    assert.equal(r?.status, 'backlog')
    assert.equal(r?.revisaoEm, '2026-01-31')
  })

  it('Q1=Sim, Q2=Sim, Q3=Sim → SIGNAL_SEMANA / current_week', () => {
    const r = computeStrategicClassification(
      { q1MovesMetric: 'yes', q2Consequence30d: 'yes', q3Consequence7d: 'yes' },
      createdAt
    )
    assert.equal(r?.statusClassification, 'SIGNAL_SEMANA')
    assert.equal(r?.status, 'current_week')
  })

  it('Q1=Sim, Q2=Sim, Q3=Não → SIGNAL_BACKLOG / backlog', () => {
    const r = computeStrategicClassification(
      { q1MovesMetric: 'yes', q2Consequence30d: 'yes', q3Consequence7d: 'no' },
      createdAt
    )
    assert.equal(r?.statusClassification, 'SIGNAL_BACKLOG')
    assert.equal(r?.status, 'backlog')
  })
})

describe('canMoveTodoToStatus — LIFE_ADMIN no Kanban', () => {
  const lifeAdmin = {
    taskType: 'LIFE_ADMIN' as const,
    statusClassification: null,
    lifeAdminSubtype: 'SEM_DEADLINE' as const,
    needsReclassification: false,
    status: 'backlog' as const,
  }

  it('permite current_week', () => {
    const r = canMoveTodoToStatus(lifeAdmin, 'current_week')
    assert.equal(r.ok, true)
  })

  it('permite in_progress', () => {
    const r = canMoveTodoToStatus(lifeAdmin, 'in_progress')
    assert.equal(r.ok, true)
  })

  it('bloqueia archived', () => {
    const r = canMoveTodoToStatus(lifeAdmin, 'archived')
    assert.equal(r.ok, false)
  })
})

describe('applyStrategicAnswerCascade', () => {
  it('alterar Q1 limpa Q2 e Q3', () => {
    const next = applyStrategicAnswerCascade(
      { q1MovesMetric: 'yes', q2Consequence30d: 'yes', q3Consequence7d: 'yes' },
      'q1',
      'no'
    )
    assert.equal(next.q1MovesMetric, 'no')
    assert.equal(next.q2Consequence30d, null)
    assert.equal(next.q3Consequence7d, null)
  })

  it('alterar Q2 limpa Q3', () => {
    const next = applyStrategicAnswerCascade(
      { q1MovesMetric: 'yes', q2Consequence30d: 'yes', q3Consequence7d: 'yes' },
      'q2',
      'no'
    )
    assert.equal(next.q2Consequence30d, 'no')
    assert.equal(next.q3Consequence7d, null)
    assert.equal(next.q1MovesMetric, 'yes')
  })
})

describe('computeLifeAdminClassification', () => {
  it('COM_DEADLINE exige data', () => {
    assert.equal(
      computeLifeAdminClassification({ hasDeadline: 'yes', deadline: null }),
      null
    )
  })

  it('SEM_DEADLINE completa sem data', () => {
    const r = computeLifeAdminClassification({ hasDeadline: 'no', deadline: null })
    assert.equal(r?.lifeAdminSubtype, 'SEM_DEADLINE')
    assert.equal(r?.status, 'backlog')
  })
})

describe('isTodoClassificationIncomplete', () => {
  it('STRATEGIC sem status_classification → incompleta', () => {
    assert.equal(
      isTodoClassificationIncomplete({
        task_type: 'STRATEGIC',
        status_classification: null,
      }),
      true
    )
  })

  it('STRATEGIC classificada → completa', () => {
    assert.equal(
      isTodoClassificationIncomplete({
        task_type: 'STRATEGIC',
        status_classification: 'SIGNAL_BACKLOG',
      }),
      false
    )
  })
})

describe('getKanbanColumnForTodo', () => {
  it('STRATEGIC sem status_classification → backlog', () => {
    assert.equal(
      getKanbanColumnForTodo({
        taskType: 'STRATEGIC',
        statusClassification: null,
        needsReclassification: false,
        status: 'backlog',
      }),
      'backlog'
    )
  })

  it('SIGNAL_SEMANA em status backlog (desalinhado) → backlog', () => {
    assert.equal(
      getKanbanColumnForTodo({
        taskType: 'STRATEGIC',
        statusClassification: 'SIGNAL_SEMANA',
        needsReclassification: false,
        status: 'backlog',
      }),
      'backlog'
    )
  })

  it('SIGNAL_SEMANA em current_week → current_week', () => {
    assert.equal(
      getKanbanColumnForTodo({
        taskType: 'STRATEGIC',
        statusClassification: 'SIGNAL_SEMANA',
        needsReclassification: false,
        status: 'current_week',
      }),
      'current_week'
    )
  })

  it('LIFE_ADMIN em backlog → backlog', () => {
    assert.equal(
      getKanbanColumnForTodo({
        taskType: 'LIFE_ADMIN',
        statusClassification: null,
        lifeAdminSubtype: 'COM_DEADLINE',
        needsReclassification: false,
        status: 'backlog',
      }),
      'backlog'
    )
  })

  it('LIFE_ADMIN legacy status life_admin → backlog', () => {
    assert.equal(
      getKanbanColumnForTodo({
        taskType: 'LIFE_ADMIN',
        statusClassification: null,
        lifeAdminSubtype: 'SEM_DEADLINE',
        needsReclassification: false,
        status: 'life_admin',
      }),
      'backlog'
    )
  })
})
