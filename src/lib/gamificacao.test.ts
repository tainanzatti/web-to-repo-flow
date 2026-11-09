import { describe, expect, it } from 'vitest'
import { calcularSequencia, calcularXP, patenteAtual } from './gamificacao'

const l = (data: string, quantidade = 10, acertos = 5, minutos = 20) =>
  ({ id: data, disciplinaId: 'x', topicoId: 'y', quantidade, acertos, minutos, data })

describe('gamificação', () => {
  it('sequência conta dias seguidos até hoje', () => {
    const r = calcularSequencia([l('2026-11-07'), l('2026-11-08'), l('2026-11-09')], '2026-11-09')
    expect(r.atual).toBe(3)
  })
  it('sequência continua valendo se estudou ontem mas não hoje', () => {
    expect(calcularSequencia([l('2026-11-07'), l('2026-11-08')], '2026-11-09').atual).toBe(2)
  })
  it('sequência zera com um dia sem estudo', () => {
    expect(calcularSequencia([l('2026-11-06')], '2026-11-09').atual).toBe(0)
  })
  it('XP = questões + 2×acertos + 1 a cada 10 min', () => {
    expect(calcularXP([l('2026-11-09', 10, 5, 25)])).toBe(10 + 10 + 2)
  })
  it('patente sobe para Soldado com 500 XP', () => {
    expect(patenteAtual(499).patente.nome).toBe('Recruta')
    expect(patenteAtual(500).patente.nome).toBe('Soldado')
  })
})
