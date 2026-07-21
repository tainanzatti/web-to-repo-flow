import { useEffect, useState, useCallback } from 'react'
import { PenLine, Send, RefreshCw, FileText, Award } from 'lucide-react'
import {
  fetchRedacoes,
  insertRedacao,
  updateRedacaoCorrecao,
  fetchLancamentos,
  insertLancamento,
} from '../../lib/db'
import type { Redacao } from '../../lib/types'
import { callAiFunction, slugForKind } from '../../lib/ai-client'

export default function RedacaoView() {
  const [redacoes, setRedacoes] = useState<Redacao[]>([])
  const [tema, setTema] = useState('')
  const [texto, setTexto] = useState('')
  const [correcao, setCorrecao] = useState<Redacao | null>(null)
  const [loading, setLoading] = useState(true)
  const [gerandoTema, setGerandoTema] = useState(false)
  const [corrigindo, setCorrigindo] = useState(false)
  const [redacaoSalvaId, setRedacaoSalvaId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const r = await fetchRedacoes()
    setRedacoes(r)
    if (r.length > 0 && !tema) {
      setTema(r[0].tema)
    }
    setLoading(false)
  }, [tema])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function gerarTema() {
    setGerandoTema(true)
    try {
      const result = await callAiFunction(slugForKind('redacao-tema'), {
        disciplina_id: 'redacao',
      })
      const novoTema =
        (result.tema as string) ??
        (result.titulo as string) ??
        'Tema dissertativo-argumentativo sobre questão de segurança pública'
      setTema(novoTema)
      setTexto('')
      setCorrecao(null)
      setRedacaoSalvaId(null)
    } finally {
      setGerandoTema(false)
    }
  }

  async function enviarCorrecao() {
    if (!texto.trim()) return
    setCorrigindo(true)
    try {
      let redId = redacaoSalvaId
      if (!redId) {
        const saved = await insertRedacao(tema, texto)
        redId = saved?.id ?? null
        setRedacaoSalvaId(redId)
      }
      const result = await callAiFunction(slugForKind('redacao-correcao'), {
        disciplina_id: 'redacao',
        tema,
        texto,
      })
      const nota =
        (result.nota as number) ??
        (result.nota_total as number) ??
        0
      const feedback = (result.feedback as Record<string, unknown>) ?? result
      if (redId) {
        await updateRedacaoCorrecao(redId, nota, feedback)
        const r = await fetchRedacoes()
        setRedacoes(r)
        const updated = r.find((x) => x.id === redId) ?? null
        setCorrecao(updated)
      }
      if (nota > 0) {
        await insertLancamento({
          disciplina_id: 'redacao',
          topico_id: null,
          mastery: nota * 10,
          minutos: 0,
          is_primeiro_contato: false,
        })
      }
    } finally {
      setCorrigindo(false)
    }
  }

  if (loading) {
    return <div className="loading-spinner">Carregando redação...</div>
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Redação</h1>
        <p className="view-subtitle">
          Treine redações dissertativo-argumentativas com tema gerado por IA e
          correção por critérios.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Tema atual</h3>
          <button
            className="btn btn-ghost btn-sm"
            disabled={gerandoTema}
            onClick={gerarTema}
          >
            {gerandoTema ? (
              <RefreshCw size={14} className="spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Gerar novo tema
          </button>
        </div>
        <div
          style={{
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-sm)',
            padding: 16,
            fontSize: 15,
            lineHeight: 1.6,
            border: '1px solid var(--border)',
          }}
        >
          {tema || 'Clique em "Gerar novo tema" para começar.'}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
          Sua redação
        </h3>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva sua redação dissertativo-argumentativa aqui..."
          style={{
            width: '100%',
            minHeight: 300,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: 16,
            fontSize: 15,
            lineHeight: 1.7,
            resize: 'vertical',
            outline: 'none',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 12,
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {texto.length} caracteres
          </span>
          <button
            className="btn btn-primary"
            disabled={!texto.trim() || corrigindo}
            onClick={enviarCorrecao}
          >
            {corrigindo ? (
              <RefreshCw size={16} className="spin" />
            ) : (
              <Send size={16} />
            )}
            Enviar para correção
          </button>
        </div>
      </div>

      {correcao && (
        <div className="card slide-up">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <Award size={24} color="var(--warning)" />
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Nota
              </div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>
                {correcao.nota != null
                  ? Number(correcao.nota).toFixed(1)
                  : '—'}
                <span
                  style={{
                    fontSize: 16,
                    color: 'var(--text-muted)',
                    fontWeight: 400,
                  }}
                >
                  /10
                </span>
              </div>
            </div>
          </div>

          {correcao.feedback_json && (
            <div style={{ marginTop: 16 }}>
              <h4
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 12,
                  color: 'var(--text-secondary)',
                }}
              >
                Feedback por critério
              </h4>
              {Object.entries(correcao.feedback_json).map(([key, val]) => (
                <div
                  key={key}
                  style={{
                    padding: '10px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      marginBottom: 4,
                    }}
                  >
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    {typeof val === 'object'
                      ? JSON.stringify(val)
                      : String(val)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {redacoes.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            Histórico de redações
          </h3>
          {redacoes.map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <FileText size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  {r.tema}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {new Date(r.criado_em).toLocaleDateString('pt-BR')}
                </div>
              </div>
              {r.nota != null && (
                <span
                  className="badge badge-primary"
                  style={{ flexShrink: 0 }}
                >
                  {Number(r.nota).toFixed(1)}/10
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
