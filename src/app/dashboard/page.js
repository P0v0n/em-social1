"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { useRouter } from 'next/navigation';
import { useAuth } from "../hooks/useAuth";
import DottedBackground from "@/components/DottedBackground";

const socialPlatforms = [
  { id: "twitter", label: "Twitter", logo: "/X.jpg" },


  { id: "youtube", label: "YouTube", logo: "/Youtube.png" },
];

export default function Home() {
  const [selectedPlatforms, setSelectedPlatforms] = useState(['twitter']);
  const [hashtag, setHashtag] = useState("");
  const [keywordCount, setKeywordCount] = useState("");
  const [status, setStatus] = useState(""); // '', 'loading', 'done'


  const togglePlatform = (id) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };
  const router = useRouter();
  const [searches, setSearches] = useState([]);


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


  const { loadings } = useAuth();

  if (loadings) return <div className="min-h-screen bg-gray-950 text-white px-6 py-4">Loading...</div>;


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
          return Promise.resolve(); // ignore unsupported platforms
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

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/"; // redirect
  };


  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-4 relative">
      <DottedBackground />
      <div className="relative z-10">
      {/* Navbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.gif"
            alt="logo"
            width={60}
            height={60}
            className="rounded-full"
            unoptimized
          />
          <h2 className="text-2xl font-bold">EM-Social</h2>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg cursor-pointer"
          >
            Logout
          </button>
          {/* <button className="rounded-lg border-2 p-2 border-white hover:bg-white hover:text-black transition">
            Playground
          </button> */}
          {/* <button className="rounded-lg border-2 p-2 border-black bg-white text-black hover:bg-gray-200 transition"
            onClick={() => {
              router.push("/dashboard");
            }}
          >
            Dashboard
          </button> */}
        </div>
      </div>

      {/* Input Card */}
      {/* <Card className="bg-gray-900 border-gray-700 text-white mb-6 max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl">Start your Search</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="hashtag">Hashtag</Label>
            <Input
              id="hashtag"
              placeholder="#example"
              value={hashtag}
              onChange={(e) => setHashtag(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="keywords">No. of Keywords</Label>
            <Input
              id="keywords"
              type="number"
              placeholder="5"
              value={keywordCount}
              onChange={(e) => setKeywordCount(e.target.value)}
            />
          </div>
        </CardContent>
      </Card> */}

      {/* Social Media Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
        {socialPlatforms.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.id);

          return (
            <Card
              key={platform.id}
              onClick={() => togglePlatform(platform.id)}
              className={`cursor-pointer transition-all rounded-xl shadow-md border-2 text-center flex flex-col items-center justify-center gap-3 py-6 hover:scale-[1.02] ${isSelected
                ? "border-blue-500 bg-blue-900"
                : "border-gray-700 bg-gray-800 hover:bg-gray-700"}`}
            >
              <Image
                src={platform.logo}
                alt={platform.label}
                width={40}
                height={40}
                className="rounded-sm" />
              <span className="text-sm font-semibold">{platform.label}</span>
              {platform.id === "instagram" && (
                <span className="text-[10px] text-gray-300">Coming soon</span>
              )}
            </Card>
          );
        })}
      </div>
      {/* <div className="flex flex-col items-center mt-6 gap-2">
        <button
          className="text-lg border-md p-4 text-white font-semibold border border-white rounded-lg hover:bg-white hover:text-black transition disabled:opacity-50"
          onClick={handleSubmit}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Loading..." : status === "done" ? "Completed" : "Submit"}
        </button>

      </div>
      <br />
      <div className="py-4 text-lg font-semibold">
        Recent Searches :
        <ul className="list-disc list-inside">
          {searches.length > 0 ? (
            searches.map((name, idx) => (
              <li
                key={idx}
                className="cursor-pointer text-blue-400 hover:underline"
                onClick={() => router.push(`/${name}`)}
              >
                {name}
              </li>
            ))
          ) : (
            <li>Loading collections...</li>
          )}
        </ul>
      </div> */}

      <div className="flex flex-col md:flex-row gap-8 items-start justify-between mt-8 px-6">

        {/* Left Column - Recent Searches */}
    <div className="flex-1 bg-gray-9 border border-gray-0 rounded-xl p-6 text-white shadow-lg">
          <h2 className="text-xl font-bold mb-4">📌 Recent Searches</h2>
          <div className="flex flex-wrap gap-3">
            {searches.length > 0 ? (
              searches.map((name, idx) => (
                <div
                  key={idx}
                  onClick={() => router.push(`/collection/${name}`)}
                  className="px-4 py-2 rounded-lg bg-gray-0 border border-gray-0 cursor-pointer 
                     hover:bg-blue-600 hover:border-blue-400 hover:scale-105 transition 
                     text-blue-300 hover:text-white shadow-md"
                >
                  #{name}
                </div>
              ))
            ) : (
              <p className="text-gray-400">Loading collections...</p>
            )}
          </div>
        </div>

        {/* Right Column - Search Input + Button */}
        <div className="flex-1">
          <Card className="bg-gray-9 border-gray-7 text-white mb-6 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">    🔍 Start your Search</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="hashtag">Hashtag</Label>
                <Input
                  id="hashtag"
                  placeholder="#example"
                  value={hashtag}
                  onChange={(e) => setHashtag(e.target.value)}
                  className="bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500/50"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <button
              className="px-6 py-3 text-lg font-semibold border border-white cursor-pointer rounded-lg hover:bg-white hover:text-black transition disabled:opacity-50"
              onClick={handleSubmit}
              disabled={status === "loading"}
            >
              {status === "loading" ? "Loading..." : status === "done" ? "Completed" : "Submit"}
            </button>
          </div>
        </div>
      </div>

      </div>
    </div>
  );
}
