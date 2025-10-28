'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Info, MoreVertical, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import KeywordConfigModal from '@/components/keywords/KeywordConfigModal';
const mockKeywords = [];

const socialPlatforms = [
  { id: "twitter", label: "Twitter", logo: "/X.jpg" },
  { id: "youtube", label: "YouTube", logo: "/Youtube.png" },
];

export default function KeywordsPage() {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState('Twinkle Khanna');
  
  // Keyword search states
  const [selectedPlatforms, setSelectedPlatforms] = useState(['twitter']);
  const [hashtag, setHashtag] = useState("");
  const [keywordCount, setKeywordCount] = useState("");
  const [status, setStatus] = useState(""); // '', 'loading', 'done'
  const [searches, setSearches] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const res = await fetch('/api/collections');
        const data = await res.json();
        setSearches(data.collections || []);
      } catch (err) {
        console.error('Failed to load collections:', err);
      }
    };

    fetchCollections();
  }, []);

  const togglePlatform = (id) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!hashtag || selectedPlatforms.length === 0) {
      alert("Please enter a hashtag and select at least one platform.");
      return;
    }

    setStatus("loading");

    // Clean the keyword to match collection naming
    const cleaned = (hashtag || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    const fetchPromises = selectedPlatforms.map((platform) => {
      switch (platform) {
        case "youtube":
          return fetch("/api/youtube", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: hashtag,
              maxResults: Number(keywordCount) || 20,
            }),
          })
            .then(async (res) => {
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "YouTube fetch failed");
              if (process.env.NODE_ENV !== "production") {
                console.log("YouTube Data:", data);
              }
            });

        case "twitter":
          return fetch("/api/x", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: hashtag }),
          })
            .then(async (res) => {
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Twitter fetch failed");
              if (process.env.NODE_ENV !== "production") {
                console.log("Twitter Data:", data);
              }
            });

        default:
          return Promise.resolve();
      }
    });

    try {
      const results = await Promise.allSettled(fetchPromises);
      const anySuccess = results.some(r => r.status === 'fulfilled');
      if (!anySuccess) {
        const reasons = results
          .map(r => (r.status === 'rejected' ? (r.reason?.message || String(r.reason)) : null))
          .filter(Boolean)
          .join('\n');
        throw new Error(reasons || 'All selected platform requests failed');
      }
      setStatus("done");

      // Refresh collections list
      try {
        const res = await fetch('/api/collections', { cache: 'no-store' });
        const data = await res.json();
        setSearches(data.collections || []);
      } catch (_) {}

      // Navigate to the new collection page
      if (cleaned) {
        router.push(`/collection/${cleaned}`);
      }
    } catch (err) {
      console.error("Error in one of the fetches:", err);
      alert(`Error: ${err.message}`);
      setStatus("");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Real Time Keywords Configuration
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="Twinkle Khanna">Twinkle Khanna</option>
              <option value="Vantara">Vantara</option>
            </select>
            <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Keywords/Social Profiles
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6">
        <div className="flex gap-6">
          <button className="py-3 px-1 text-sm font-medium border-b-2 border-blue-600 text-blue-600">
            Real Time Keywords Configuration
          </button>
          <button className="py-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            Historic Keywords Configuration
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        
        {/* Keyword Search Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🔍 Search Keywords</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Platform Selection & Search Input */}
            <div className="space-y-6">
              {/* Platform Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Platforms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {socialPlatforms.map((platform) => {
                      const isSelected = selectedPlatforms.includes(platform.id);
                      return (
                        <div
                          key={platform.id}
                          onClick={() => togglePlatform(platform.id)}
                          className={`cursor-pointer transition-all rounded-lg border-2 text-center flex flex-col items-center justify-center gap-2 py-4 hover:scale-[1.02] ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700"
                          }`}
                        >
                          <Image
                            src={platform.logo}
                            alt={platform.label}
                            width={32}
                            height={32}
                            className="rounded-sm"
                          />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {platform.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Search Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Enter Keyword</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="hashtag">Hashtag</Label>
                    <Input
                      id="hashtag"
                      placeholder="#example"
                      value={hashtag}
                      onChange={(e) => setHashtag(e.target.value)}
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={status === "loading"}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {status === "loading" ? "Searching..." : status === "done" ? "Completed" : "Search & Collect Data"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Recent Searches */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📌 Recent Searches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {searches.length > 0 ? (
                    searches.map((name, idx) => (
                      <div
                        key={idx}
                        onClick={() => router.push(`/collection/${name}`)}
                        className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-blue-600 hover:border-blue-400 hover:text-white transition text-gray-900 dark:text-white"
                      >
                        #{name}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No recent searches yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300 dark:border-gray-700 my-8"></div>

        {/* Keywords Configuration Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">⚙️ Keyword Configuration</h2>
          
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by Group Name, Keyword"
                  className="pl-10 w-96"
                />
              </div>
              <Button variant="outline" size="icon">
                <Search className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Active Keywords / Total Keywords :
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">4 / 4</span>
            </div>
          </div>

          {/* Keywords Table */}
          <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Keywords Group Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Keywords/Keywords Query
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Channels
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {mockKeywords.map((keyword) => (
                  <tr key={keyword.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {keyword.groupName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {keyword.query}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {keyword.channels.map((channel, idx) => (
                          <div key={idx} className="relative group">
                            {channel.icon === 'twitter' && (
                              <div className="w-6 h-6 bg-black dark:bg-white rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white dark:text-black" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                              </div>
                            )}
                            {channel.icon === 'facebook' && (
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                              </div>
                            )}
                            {channel.icon === 'instagram' && (
                              <div className="w-6 h-6 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                                  <path d="M12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                              </div>
                            )}
                            {channel.icon === 'youtube' && (
                              <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                </svg>
                              </div>
                            )}
                            {channel.count > 1 && (
                              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                +{channel.count}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {keyword.createdOn}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                        {keyword.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => {
                            setSelectedKeyword(keyword);
                            setShowConfigModal(true);
                          }}
                        >
                          <Info className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </Card>
        </div>
      </div>

      {/* Keyword Configuration Modal */}
      {showConfigModal && (
        <KeywordConfigModal
          keyword={selectedKeyword}
          onClose={() => {
            setShowConfigModal(false);
            setSelectedKeyword(null);
          }}
        />
      )}
    </div>
  );
}

