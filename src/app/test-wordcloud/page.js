'use client';

import WordCloud from '@/components/WordCloud';
import DottedBackground from '@/components/DottedBackground';

export default function TestWordCloudPage() {
  // Sample keyword frequency data for testing
  const sampleKeywordFrequency = {
    "cricket": 45,
    "match": 38,
    "player": 32,
    "team": 30,
    "win": 28,
    "score": 25,
    "game": 22,
    "tournament": 20,
    "champion": 18,
    "victory": 16,
    "performance": 15,
    "strategy": 14,
    "coach": 12,
    "training": 11,
    "fans": 10,
    "stadium": 9,
    "trophy": 8,
    "league": 7,
    "season": 6,
    "final": 5
  };

  // Test with empty data
  const emptyKeywordFrequency = {};

  // Test with MongoDB-style data (with $numberInt)
  const mongoStyleKeywordFrequency = {
    "cricket": { "$numberInt": "45" },
    "match": { "$numberInt": "38" },
    "player": { "$numberInt": "32" },
    "team": { "$numberInt": "30" },
    "win": { "$numberInt": "28" }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 relative">
      <DottedBackground />
      <div className="relative z-10 max-w-7xl mx-auto space-y-12">
        <div>
          <h1 className="text-4xl font-bold text-sky-400 mb-2">
            Word Cloud Component Test
          </h1>
          <p className="text-gray-400">
            Testing the WordCloud component with different data scenarios
          </p>
        </div>

        {/* Test 1: Normal keyword frequency data */}
        <section className="bg-gray-900 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-sky-400">
            Test 1: Normal Keyword Frequency Data
          </h2>
          <p className="text-gray-400 mb-4 text-sm">
            Testing with standard object format: &#123;"keyword": count&#125;
          </p>
          <WordCloud keywordFrequency={sampleKeywordFrequency} />
        </section>

        {/* Test 2: Empty data */}
        <section className="bg-gray-900 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-sky-400">
            Test 2: Empty Keyword Frequency Data
          </h2>
          <p className="text-gray-400 mb-4 text-sm">
            Testing with empty object - should show "No keyword data available" message
          </p>
          <WordCloud keywordFrequency={emptyKeywordFrequency} />
        </section>

        {/* Test 3: MongoDB-style data */}
        <section className="bg-gray-900 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-sky-400">
            Test 3: MongoDB-Style Keyword Frequency Data
          </h2>
          <p className="text-gray-400 mb-4 text-sm">
            Testing with MongoDB format: &#123;"keyword": &#123;"$numberInt": "count"&#125;&#125;
          </p>
          <WordCloud keywordFrequency={mongoStyleKeywordFrequency} />
        </section>

        {/* Test 4: Null/undefined data */}
        <section className="bg-gray-900 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-sky-400">
            Test 4: Null Keyword Frequency Data
          </h2>
          <p className="text-gray-400 mb-4 text-sm">
            Testing with null - should show "No keyword data available" message
          </p>
          <WordCloud keywordFrequency={null} />
        </section>

        {/* Component Details */}
        <section className="bg-gray-900 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-sky-400">
            Component Details
          </h2>
          <div className="space-y-2 text-sm text-gray-300">
            <p><strong className="text-white">Library:</strong> react-wordcloud</p>
            <p><strong className="text-white">Max Words:</strong> 100 (top keywords by frequency)</p>
            <p><strong className="text-white">Font Size Range:</strong> 16-80px</p>
            <p><strong className="text-white">Rotations:</strong> -90° and 0°</p>
            <p><strong className="text-white">Colors:</strong> 7 theme colors (green, blue, purple, amber, red, pink, cyan)</p>
            <p><strong className="text-white">Tooltip:</strong> Hover over words to see keyword and frequency</p>
            <p><strong className="text-white">Features:</strong></p>
            <ul className="list-disc list-inside ml-4">
              <li>Deterministic layout (same input = same output)</li>
              <li>Smooth transitions (1000ms)</li>
              <li>Responsive sizing</li>
              <li>Sorted by frequency (highest first)</li>
            </ul>
          </div>
        </section>

        {/* Sample Data Display */}
        <section className="bg-gray-900 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-sky-400">
            Sample Data Structure
          </h2>
          <pre className="bg-gray-800 p-4 rounded overflow-x-auto text-xs">
            <code className="text-green-400">
              {JSON.stringify(sampleKeywordFrequency, null, 2)}
            </code>
          </pre>
        </section>
      </div>
    </div>
  );
}


