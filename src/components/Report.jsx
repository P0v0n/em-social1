	'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import WordCloud from './WordCloud';

const COLORS = ['#10B981', '#3B82F6', '#EF4444']; // green, blue, red

export default function Report({ analysis, collectionName }) {
  if (!Array.isArray(analysis) || analysis.length === 0) {
    return <div>No analysis data to display.</div>;
  }

  // Support both old and new shapes
  const first = analysis[0] || {};
  const hasNewSchema = !!first.languages || !!first.summary;

  const topEngagers = first.topEngagers || [];
  const contentThemes = hasNewSchema ? (first.languages?.en?.themes || first.languages?.hi?.themes || first.languages?.mr?.themes || []) : first.contentThemes;

  // Pie data (overall sentiment)
  const overall = first.summary?.overallDistribution;
  const narrative = first.summary?.narrative;
  const highlights = first.summary?.highlights || [];
  const recommendations = first.summary?.recommendations || [];
  const oldSentiment = first.sentimentDistribution;
  const pieData = overall
    ? Object.entries(overall).map(([k, v]) => ({ name: k, value: Number(v) || 0 }))
    : oldSentiment
      ? Object.entries(oldSentiment).map(([key, value]) => ({ name: key, value: (Array.isArray(value) ? value.length : Number(value) || 0) }))
      : [];

  // Collect top 10 comments across languages by highest confidence
  const languages = first.languages || {};
  const langKeys = Object.keys(languages);
  const allSamples = [];
  langKeys.forEach(lang => {
    const samples = languages[lang]?.samplePosts || [];
    samples.forEach(s => {
      if (s?.text) {
        allSamples.push({
          text: s.text,
          sentiment: s.sentiment,
          confidence: Number(s.confidence) || 0,
          lang,
        });
      }
    });
  });
  allSamples.sort((a, b) => b.confidence - a.confidence);

  // Manual override state: key by unique text snippet
  const [overridesByText, setOverridesByText] = useState(first?.overrides || {});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Keep local overrides in sync if analysis prop changes (e.g., after reload)
  const initialOverrides = first?.overrides || {};
  const initialOverridesKey = JSON.stringify(initialOverrides);
  useEffect(() => {
    setOverridesByText(initialOverrides);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOverridesKey]);

  // Apply overrides to samples
  const samplesWithOverrides = useMemo(() => {
    return allSamples.map(s => {
      const key = s.text;
      const override = overridesByText[key];
      return override ? { ...s, sentiment: override } : s;
    });
  }, [allSamples, overridesByText]);

  // Compute pie data from samples if available; otherwise fall back to API provided distribution
  const computedDistribution = useMemo(() => {
    if (!samplesWithOverrides.length) return null;
    const counts = { positive: 0, neutral: 0, negative: 0 };
    samplesWithOverrides.forEach(s => {
      if (s.sentiment === 'positive') counts.positive += 1;
      else if (s.sentiment === 'negative') counts.negative += 1;
      else counts.neutral += 1;
    });
    return counts;
  }, [samplesWithOverrides]);

  const effectivePieData = computedDistribution
    ? Object.entries(computedDistribution).map(([name, value]) => ({ name, value }))
    : pieData;

  const topComments = samplesWithOverrides.slice(0, 10);

  async function handleSaveOverrides() {
    if (!collectionName) {
      setSaveMsg('Missing collection name.');
      return;
    }
    try {
      setSaving(true);
      setSaveMsg('');
      const res = await fetch(`/api/collections/${collectionName}/analysis`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides: overridesByText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Save failed (${res.status})`);
      }
      setSaveMsg('Saved');
    } catch (e) {
      setSaveMsg(e.message || 'Save failed');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 2000);
    }
  }

  return (
    <div className="space-y-12">
      {/* AI Summary of Comments */}
      {(narrative || highlights.length || recommendations.length) && (
        <section className="bg-gray-900 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-2 text-sky-400">AI Summary of Comments</h2>
          {narrative && (
            <p className="text-gray-200 text-sm leading-6">{narrative}</p>
          )}
          {highlights.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold text-white mb-2">Key Highlights</h3>
              <ul className="list-disc list-inside text-gray-300 text-sm">
                {highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}
          {recommendations.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold text-white mb-2">Recommendations</h3>
              <ul className="list-disc list-inside text-gray-300 text-sm">
                {recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
      {/* Sentiment Distribution (Pie Chart) */}
      <section className="bg-gray-900 p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-sky-400">Sentiment Distribution (Pie)</h2>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-sm disabled:opacity-50"
              onClick={handleSaveOverrides}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save overrides'}
            </button>
            {saveMsg && <span className="text-xs text-gray-300">{saveMsg}</span>}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={effectivePieData}
              dataKey="value"
              nameKey="name"
              outerRadius={120}
              innerRadius={60}
              label
            >
              {effectivePieData.map((entry, index) => (
                <Cell key={`cell - ${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </section>

      {/* Word Cloud */}
      {first.keywordFrequency && (
        <section className="bg-gray-900 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-sky-400">☁️ Keyword Word Cloud</h2>
          <WordCloud keywordFrequency={first.keywordFrequency} />
        </section>
      )}

      {/* Top 10 Comments */}
      <section className="bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-sky-400">Top 10 Comments</h2>
        {topComments.length ? (
          <ul className="space-y-3">
            {topComments.map((c, i) => (
              <li key={i} className="p-3 bg-gray-800 rounded border border-gray-700">
                <div className="flex items-center justify-between text-xs mb-1 text-gray-400">
                  <span>Lang: {c.lang}</span>
                  <span>Confidence: {c.confidence.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-200 mb-1">{c.text}</div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded ${c.sentiment === 'positive' ? 'bg-green-600' : c.sentiment === 'negative' ? 'bg-red-600' : 'bg-blue-600'}`}>
                    {c.sentiment}
                  </span>
                  <select
                    className="bg-gray-700 text-xs text-gray-200 rounded px-2 py-1 border border-gray-600"
                    value={c.sentiment}
                    onChange={(e) => {
                      const next = e.target.value;
                      setOverridesByText(prev => ({ ...prev, [c.text]: next }));
                    }}
                  >
                    <option value="positive">positive</option>
                    <option value="neutral">neutral</option>
                    <option value="negative">negative</option>
                  </select>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-400">No comments available.</div>
        )}
      </section>

      {/* Top Engagers */}
      <section className="bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-sky-400">Top Engagers</h2>
        <div className="space-y-4">
          {(topEngagers || []).map((engager, index) => (
            <div key={index} className="p-4 bg-gray-800 rounded-lg">
              <div className="text-lg font-bold">{engager.channelTitle}</div>
              <div className="text-gray-400 text-sm">{engager.reason}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Removed Content Themes in favor of AI Summary of Comments */}

    </div>
  );
}