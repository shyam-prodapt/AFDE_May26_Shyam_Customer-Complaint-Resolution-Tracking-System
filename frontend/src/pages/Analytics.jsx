import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts'
import Layout from '../components/Layout'
import {
  runEtl,
  getAnalyticsSummary,
  getSlaReport,
  getCategoryAnalysis,
  getResolutionTrends,
  getAgentPerformance,
} from '../api/analytics'
import '../styles/analytics.css'

const TICK   = { fill: '#3a4760', fontSize: 11, fontFamily: 'JetBrains Mono' }
const GRID   = { stroke: 'rgba(255,255,255,0.04)' }
const TOOLTIP_STYLE = {
  backgroundColor: '#12172b',
  border: '1px solid rgba(255,200,80,0.15)',
  borderRadius: 8,
  fontSize: 12,
  fontFamily: 'JetBrains Mono, monospace',
  color: '#d4d9ee',
}

export default function Analytics() {
  const [etlRunning, setEtlRunning] = useState(false)
  const [etlResult, setEtlResult]   = useState(null)
  const [summary, setSummary]       = useState(null)
  const [sla, setSla]               = useState([])
  const [categories, setCategories] = useState([])
  const [trends, setTrends]         = useState([])
  const [agents, setAgents]         = useState([])
  const [loading, setLoading]       = useState(true)

  const loadAll = () => {
    setLoading(true)
    Promise.all([
      getAnalyticsSummary(),
      getSlaReport(),
      getCategoryAnalysis(),
      getResolutionTrends(),
      getAgentPerformance(),
    ])
      .then(([s, sl, cat, tr, ag]) => {
        setSummary(s.data)
        setSla(sl.data)
        setCategories(cat.data)
        setTrends(tr.data)
        setAgents(ag.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, [])

  const handleRunEtl = () => {
    setEtlRunning(true)
    setEtlResult(null)
    runEtl()
      .then((r) => {
        setEtlResult(`↳ ${r.data.extracted} extracted → ${r.data.transformed} transformed → ${r.data.loaded} loaded`)
        loadAll()
      })
      .catch(() => setEtlResult('Pipeline error — check server logs'))
      .finally(() => setEtlRunning(false))
  }

  return (
    <Layout title="Analytics">
      <div className="analytics-page">
        <h2>ETL Analytics</h2>
        <p className="sub">Import complaint data via the pipeline, then explore operational metrics below.</p>

        <div className="etl-bar">
          <p>Load complaint records from the CSV dataset into the analytics warehouse.</p>
          {etlResult && <span className="etl-result">{etlResult}</span>}
          <button className="btn-etl" onClick={handleRunEtl} disabled={etlRunning}>
            {etlRunning ? '⟳ Running' : '▶ Run ETL'}
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <span className="loading-dot" />
            Loading analytics data…
          </div>
        ) : (
          <>
            {summary && (
              <div className="summary-grid">
                <SummaryCard value={summary.total_records}       label="Total Records" />
                <SummaryCard value={summary.resolved}            label="Resolved" color="#34d399" />
                <SummaryCard value={summary.sla_breached}        label="SLA Breached" color="#fb7185" />
                <SummaryCard value={summary.sla_compliant}       label="SLA Compliant" color="#2dd4bf" />
                <SummaryCard value={`${summary.breach_rate}%`}   label="Breach Rate" color={summary.breach_rate > 30 ? '#fb7185' : '#ffc84a'} />
                <SummaryCard value={summary.avg_resolution_hours ?? '—'} label="Avg Res. Hours" />
              </div>
            )}

            <div className="analytics-grid">
              {/* SLA Breach by Priority */}
              <div className="a-card">
                <h3>SLA Breach by Priority</h3>
                {sla.length === 0 ? (
                  <p className="no-data">No data — run ETL first</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={sla} margin={{ top: 4, right: 10, left: -14, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" {...GRID} />
                      <XAxis dataKey="priority" tick={TICK} />
                      <YAxis tick={TICK} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                        formatter={(v, n) => [v, n === 'breached' ? 'Breached' : 'Compliant']}
                      />
                      <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: '#6b7a9e' }} />
                      <Bar dataKey="compliant" fill="#2dd4bf" name="Compliant" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="breached"  fill="#fb7185" name="Breached"  radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Category Analysis */}
              <div className="a-card">
                <h3>Complaints by Category</h3>
                {categories.length === 0 ? (
                  <p className="no-data">No data — run ETL first</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={categories} layout="vertical" margin={{ top: 4, right: 16, left: 64, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" {...GRID} />
                      <XAxis type="number" tick={TICK} />
                      <YAxis dataKey="category" type="category" tick={{ ...TICK, fontSize: 10 }} width={64} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      />
                      <Bar dataKey="total" fill="#ffc84a" name="Total" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Resolution Trends */}
              <div className="a-card">
                <h3>Monthly Resolution Trends</h3>
                {trends.length === 0 ? (
                  <p className="no-data">No data — run ETL first</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={trends} margin={{ top: 4, right: 10, left: -14, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" {...GRID} />
                      <XAxis dataKey="month" tick={{ ...TICK, fontSize: 10 }} />
                      <YAxis tick={TICK} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        cursor={{ stroke: 'rgba(255,200,74,0.2)' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: '#6b7a9e' }} />
                      <Line type="monotone" dataKey="total"    stroke="#60a5fa" strokeWidth={2} dot={false} name="Total" />
                      <Line type="monotone" dataKey="resolved" stroke="#34d399" strokeWidth={2} dot={false} name="Resolved" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Agent Performance */}
              <div className="a-card">
                <h3>Agent Performance</h3>
                {agents.length === 0 ? (
                  <p className="no-data">No data — run ETL first</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="agent-table">
                      <thead>
                        <tr>
                          <th>Agent</th>
                          <th>Total</th>
                          <th>Done</th>
                          <th>Breached</th>
                          <th>Avg Hrs</th>
                          <th>Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agents.map((a) => (
                          <tr key={a.agent}>
                            <td>{a.agent || '—'}</td>
                            <td>{a.total_assigned}</td>
                            <td style={{ color: '#34d399' }}>{a.resolved}</td>
                            <td style={{ color: a.sla_breached > 0 ? '#fb7185' : '#3a4760' }}>{a.sla_breached}</td>
                            <td>{a.avg_resolution_hours ?? '—'}</td>
                            <td>
                              <div className="rate-bar-wrap">
                                <div className="rate-bar">
                                  <div className="rate-bar-fill" style={{ width: `${a.resolution_rate}%` }} />
                                </div>
                                <span style={{ fontSize: 10, minWidth: 34, color: '#6b7a9e' }}>{a.resolution_rate}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

function SummaryCard({ value, label, color }) {
  return (
    <div className="summary-card">
      <div className="s-value" style={color ? { color } : undefined}>{value}</div>
      <div className="s-label">{label}</div>
    </div>
  )
}
