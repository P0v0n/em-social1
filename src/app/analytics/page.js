'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, ChevronDown, TrendingUp, MessageSquare, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Report from '@/components/Report';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function AnalyticsPage() {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState(null);

  // Read preselected collection from query (?collection=foo)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('collection');
    if (fromQuery) {
      setSelectedCollection(fromQuery);
    }
  }, []);

  // Fetch available collections
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const res = await fetch('/api/collections');
        const data = await res.json();
        setCollections(data.collections || []);
        
        // If no preselected value, auto-select first collection
        if (!selectedCollection && data.collections && data.collections.length > 0) {
          setSelectedCollection(data.collections[0]);
        }
      } catch (err) {
        console.error('Failed to load collections:', err);
        setError('Failed to load collections');
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [selectedCollection]);

  // Fetch analysis data when collection changes
  useEffect(() => {
    if (!selectedCollection) {
      setRawData(null);
      return;
    }

    const fetchAnalysis = async () => {
      setLoadingAnalysis(true);
      setError(null);
      try {
        const res = await fetch(`/api/collections/${selectedCollection}/analysis`);
        if (!res.ok) {
          throw new Error(`Failed to fetch analysis: ${res.status}`);
        }
        const data = await res.json();
        setRawData(data || null);
      } catch (err) {
        console.error('Error fetching analysis:', err);
        setError(err.message);
      } finally {
        setLoadingAnalysis(false);
      }
    };

    fetchAnalysis();
  }, [selectedCollection]);

  const handleRefresh = () => {
    if (selectedCollection) {
      const event = new CustomEvent('refresh');
      window.dispatchEvent(event);
      // Trigger re-fetch by setting the collection to the same value
      const current = selectedCollection;
      setSelectedCollection('');
      setTimeout(() => setSelectedCollection(current), 0);
    }
  };

  // Compute analytics metrics from rawData
  const analytics = useMemo(() => {
    if (!rawData || !rawData.analysis || !rawData.analysis.length) {
      return null;
    }

    const first = rawData.analysis[0] || {};

    // New schema preferred: summary.overallDistribution
    const overall = first.summary?.overallDistribution;
    // Old schema fallback: sentimentDistribution (keys may be arrays or numbers)
    const legacy = first.sentimentDistribution;

    const normalized = overall
      ? {
          positive: Number(overall.positive || overall.Positive || 0),
          neutral: Number(overall.neutral || overall.Neutral || 0),
          negative: Number(overall.negative || overall.Negative || 0),
        }
      : legacy
      ? {
          positive: Array.isArray(legacy.positive) ? legacy.positive.length : Number(legacy.positive || legacy.Positive || 0),
          neutral: Array.isArray(legacy.neutral) ? legacy.neutral.length : Number(legacy.neutral || legacy.Neutral || 0),
          negative: Array.isArray(legacy.negative) ? legacy.negative.length : Number(legacy.negative || legacy.Negative || 0),
        }
      : { positive: 0, neutral: 0, negative: 0 };

    const total = normalized.positive + normalized.neutral + normalized.negative;
    const positivePercent = total > 0 ? ((normalized.positive / total) * 100).toFixed(1) : 0;
    const neutralPercent = total > 0 ? ((normalized.neutral / total) * 100).toFixed(1) : 0;
    const negativePercent = total > 0 ? ((normalized.negative / total) * 100).toFixed(1) : 0;

    // Pie chart data
    const pieData = [
      { name: 'Positive', value: normalized.positive },
      { name: 'Neutral', value: normalized.neutral },
      { name: 'Negative', value: normalized.negative },
    ].filter(item => item.value > 0);

    // Top engagers count
    const engagersCount = Array.isArray(first.topEngagers) ? first.topEngagers.length : 0;
    
    // Top comments: count sample posts across languages (new schema)
    let commentsCount = 0;
    if (first.languages && typeof first.languages === 'object') {
      Object.values(first.languages).forEach(lang => {
        if (Array.isArray(lang?.samplePosts)) commentsCount += lang.samplePosts.length;
      });
    } else if (Array.isArray(first.topComments)) {
      // Old schema fallback
      commentsCount = first.topComments.length;
    }

    // Extract trend data if available (Locobuzz-style)
    let trend = [];
    const trendSrc = first.summary?.trend || first.trend || first.timeline;
    if (Array.isArray(trendSrc)) {
      trend = trendSrc.map(p => ({
        date: p.date || p.day || p.ts || '',
        positive: Number(p.positive ?? p.Positive ?? 0),
        neutral: Number(p.neutral ?? p.Neutral ?? 0),
        negative: Number(p.negative ?? p.Negative ?? 0),
        total: Number(p.total ?? p.Total ?? ((Number(p.positive||0)+Number(p.neutral||0)+Number(p.negative||0))))
      })).filter(d => d.date);
    } else if (trendSrc && Array.isArray(trendSrc.daily)) {
      trend = trendSrc.daily.map(p => ({
        date: p.date || p.day || p.ts || '',
        positive: Number(p.positive ?? p.Positive ?? 0),
        neutral: Number(p.neutral ?? p.Neutral ?? 0),
        negative: Number(p.negative ?? p.Negative ?? 0),
        total: Number(p.total ?? p.Total ?? ((Number(p.positive||0)+Number(p.neutral||0)+Number(p.negative||0))))
      })).filter(d => d.date);
    }

    return {
      total,
      positive: normalized.positive,
      neutral: normalized.neutral,
      negative: normalized.negative,
      positivePercent,
      neutralPercent,
      negativePercent,
      pieData,
      engagersCount,
      commentsCount,
      trend,
    };
  }, [rawData]);

  const COLORS = {
    positive: '#10b981',
    neutral: '#f59e0b',
    negative: '#ef4444',
    chart: ['#10b981', '#f59e0b', '#ef4444'],
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700/50 px-6 py-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-3">
              <svg className="w-8 h-8 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics & Reports
          </h1>
            <p className="text-gray-400 mt-1 text-sm">Real-time sentiment analysis and insights</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 font-medium">Collection:</span>
              <div className="relative">
              <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  disabled={loading || collections.length === 0}
                  className="appearance-none pl-4 pr-10 py-2 bg-gray-800 border-2 border-gray-700 hover:border-gray-600 focus:border-sky-500 rounded-lg text-white font-medium cursor-pointer focus:ring-2 focus:ring-sky-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {collections.length === 0 ? (
                    <option value="">No collections available</option>
                  ) : (
                    collections.map((col) => (
                      <option key={col} value={col} className="bg-gray-800">
                        {col}
                      </option>
                    ))
                  )}
              </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            </div>
            
            <Button
              onClick={handleRefresh}
              disabled={!selectedCollection || loadingAnalysis}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingAnalysis ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-10">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 mx-auto mb-4 text-sky-400 animate-spin" />
              <p className="text-gray-400 text-lg">Loading collections...</p>
        </div>
      </div>
        )}

        {/* No Collections State */}
        {!loading && collections.length === 0 && (
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="p-12 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 text-center">
              <svg className="w-20 h-20 mx-auto mb-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-2xl font-bold text-white mb-2">No Collections Found</h3>
              <p className="text-gray-400 mb-6">Create a keyword search to start analyzing data</p>
              <Button
                onClick={() => window.location.href = '/keywords'}
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
              >
                Go to Keywords Configuration
          </Button>
            </Card>
        </div>
        )}

        {/* Analysis Loading State */}
        {!loading && selectedCollection && loadingAnalysis && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 mx-auto mb-4 text-sky-400 animate-spin" />
              <p className="text-gray-400 text-lg">Loading analysis for <span className="text-sky-400 font-semibold">{selectedCollection}</span>...</p>
              </div>
            </div>
        )}

        {/* Error State */}
        {error && !loading && !loadingAnalysis && (
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="p-12 bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-700/50 text-center">
              <svg className="w-20 h-20 mx-auto mb-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              <h3 className="text-2xl font-bold text-white mb-2">Error Loading Data</h3>
              <p className="text-gray-400 mb-6">{error}</p>
              <Button
                onClick={handleRefresh}
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
          </Button>
          </Card>
        </div>
        )}

        {/* Real Analytics Data */}
        {!loading && !loadingAnalysis && !error && rawData && rawData.analysis && rawData.analysis.length > 0 && analytics && (
          <>
            {/* Mentions Trend (Locobuzz-style) */}
            {analytics.trend && analytics.trend.length > 1 && (
              <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700/50 text-white p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-3">
                    <svg className="w-7 h-7 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18" />
                    </svg>
                    Mentions Trend
              </h3>
              <div className="flex items-center gap-2">
                    {['7','30','90','all'].map(r => (
                      <button
                        key={r}
                        onClick={() => setTrendRange(r)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${trendRange===r ? 'bg-sky-600 border-sky-500' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}
                      >
                        {r === 'all' ? 'All' : `${r}d`}
                      </button>
                    ))}
              </div>
            </div>

                <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={(function(){
                        const data = analytics.trend;
                        if (trendRange==='all') return data;
                        const n = Number(trendRange);
                        return data.slice(-n);
                      })()}
                    >
                  <defs>
                        <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.positive} stopOpacity={0.6}/>
                          <stop offset="95%" stopColor={COLORS.positive} stopOpacity={0.05}/>
                    </linearGradient>
                        <linearGradient id="colorNeu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.neutral} stopOpacity={0.6}/>
                          <stop offset="95%" stopColor={COLORS.neutral} stopOpacity={0.05}/>
                    </linearGradient>
                        <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.negative} stopOpacity={0.6}/>
                          <stop offset="95%" stopColor={COLORS.negative} stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} tickMargin={8} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor:'#111827', border:'1px solid #374151', borderRadius: 12 }} labelStyle={{ color: '#9ca3af' }} />
                      <Legend wrapperStyle={{ color:'#cbd5e1' }} />
                      <Area type="monotone" dataKey="positive" stroke={COLORS.positive} fillOpacity={1} fill="url(#colorPos)" strokeWidth={2} />
                      <Area type="monotone" dataKey="neutral" stroke={COLORS.neutral} fillOpacity={1} fill="url(#colorNeu)" strokeWidth={2} />
                      <Area type="monotone" dataKey="negative" stroke={COLORS.negative} fillOpacity={1} fill="url(#colorNeg)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
              </Card>
            )}

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Mentions */}
              <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-700/50 text-white p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-300 text-sm font-medium mb-2">Total Mentions</p>
                    <p className="text-4xl font-bold text-white">{analytics.total.toLocaleString()}</p>
                </div>
                  <div className="bg-purple-600/30 p-4 rounded-xl">
                    <BarChart3 className="w-8 h-8 text-purple-400" />
                </div>
                </div>
          </Card>

              {/* Positive Sentiment */}
              <Card className="bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-700/50 text-white p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-300 text-sm font-medium mb-2">Positive</p>
                    <p className="text-4xl font-bold text-white">{analytics.positive.toLocaleString()}</p>
                    <p className="text-green-400 text-sm font-semibold mt-1">{analytics.positivePercent}%</p>
                </div>
                  <div className="bg-green-600/30 p-4 rounded-xl">
                    <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </Card>

              {/* Neutral Sentiment */}
              <Card className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-700/50 text-white p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm font-medium mb-2">Neutral</p>
                    <p className="text-4xl font-bold text-white">{analytics.neutral.toLocaleString()}</p>
                    <p className="text-blue-400 text-sm font-semibold mt-1">{analytics.neutralPercent}%</p>
                  </div>
                  <div className="bg-blue-600/30 p-4 rounded-xl">
                    <MessageSquare className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </Card>

              {/* Negative Sentiment */}
              <Card className="bg-gradient-to-br from-red-900/40 to-red-800/20 border-red-700/50 text-white p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm font-medium mb-2">Negative</p>
                    <p className="text-4xl font-bold text-white">{analytics.negative.toLocaleString()}</p>
                    <p className="text-red-400 text-sm font-semibold mt-1">{analytics.negativePercent}%</p>
                  </div>
                  <div className="bg-red-600/30 p-4 rounded-xl">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
            </div>
            </div>
          </Card>
        </div>

        {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              {/* Sentiment Distribution Pie Chart */}
              <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700/50 text-white p-8 hover:shadow-2xl transition-all duration-300">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent mb-6 flex items-center gap-3">
                  <svg className="w-7 h-7 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
              Sentiment Distribution
            </h3>
                <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                        data={analytics.pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        innerRadius={70}
                        paddingAngle={5}
                    dataKey="value"
                        animationBegin={0}
                        animationDuration={1000}
                      >
                        {analytics.pieData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`}
                            fill={COLORS.chart[index % COLORS.chart.length]}
                            stroke="#1f2937"
                            strokeWidth={3}
                          />
                    ))}
                  </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '12px',
                          padding: '12px',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        }}
                        itemStyle={{ color: '#e5e7eb', fontWeight: '600' }}
                        labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                      />
                </PieChart>
              </ResponsiveContainer>
            </div>
                
                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500 shadow-lg"></div>
                    <span className="text-sm text-gray-300 font-medium">Positive ({analytics.positive})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500 shadow-lg"></div>
                    <span className="text-sm text-gray-300 font-medium">Neutral ({analytics.neutral})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500 shadow-lg"></div>
                    <span className="text-sm text-gray-300 font-medium">Negative ({analytics.negative})</span>
                  </div>
                </div>
              </Card>

              {/* Engagement Stats */}
              <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700/50 text-white p-8 hover:shadow-2xl transition-all duration-300">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent mb-6 flex items-center gap-3">
                  <Users className="w-7 h-7 text-sky-400" />
                  Engagement Overview
                </h3>
                
                <div className="space-y-6 mt-8">
                  {/* Top Engagers */}
                  <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 hover:bg-gray-800/70 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 font-medium">Top Engagers</span>
                      <span className="text-3xl font-bold text-sky-400">{analytics.engagersCount}</span>
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-sky-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((analytics.engagersCount / 10) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Top Comments */}
                  <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 hover:bg-gray-800/70 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 font-medium">Top Comments</span>
                      <span className="text-3xl font-bold text-purple-400">{analytics.commentsCount}</span>
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((analytics.commentsCount / 10) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Sentiment Health Score */}
                  <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 hover:bg-gray-800/70 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 font-medium">Sentiment Health</span>
                      <span className="text-3xl font-bold text-green-400">
                        {analytics.total > 0 ? ((analytics.positive / analytics.total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${analytics.positivePercent}%` }}
                      ></div>
                    </div>
                  </div>
            </div>
          </Card>
        </div>

            {/* Detailed Report Component */}
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 p-6 rounded-xl border border-gray-700/30 mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent mb-6 flex items-center gap-3">
                <svg className="w-7 h-7 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Detailed Analysis Report
              </h2>
              <Report analysis={rawData.analysis} collectionName={selectedCollection} />
            </div>
          </>
        )}

        {/* No Analysis Data State */}
        {!loading && !loadingAnalysis && !error && selectedCollection && rawData && (!rawData.analysis || rawData.analysis.length === 0) && (
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="p-12 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 text-center">
              <svg className="w-20 h-20 mx-auto mb-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-2xl font-bold text-white mb-2">No Analysis Available</h3>
              <p className="text-gray-400 mb-6">This collection hasn't been analyzed yet. Click below to analyze the data.</p>
              <Button
                onClick={async () => {
                  try {
                    setLoadingAnalysis(true);
                    const res = await fetch(`/api/analyse/${selectedCollection}`, { method: 'POST' });
                    if (res.ok) {
                      // Refresh data
                      handleRefresh();
                    }
                  } catch (err) {
                    console.error('Analysis failed:', err);
                  } finally {
                    setLoadingAnalysis(false);
                  }
                }}
                disabled={loadingAnalysis}
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
              >
                {loadingAnalysis ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Collection'
                )}
              </Button>
          </Card>
        </div>
        )}
      </div>
    </div>
  );
}
