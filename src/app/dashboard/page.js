"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { useRouter } from 'next/navigation';
import { useAuth } from "../hooks/useAuth";
import DottedBackground from "@/components/DottedBackground";

export default function Home() {
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
          </div>
        </div>

        {/* Welcome Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Welcome to EM-Social Dashboard</h1>
            <p className="text-gray-400 text-lg">
              Monitor social media conversations and analyze trends across platforms
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card 
              className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800 transition cursor-pointer"
              onClick={() => router.push('/keywords')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span className="text-2xl">🔍</span>
                  Search Keywords
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Configure and search for keywords across Twitter and YouTube. Set up new searches and manage existing ones.
                </p>
              </CardContent>
            </Card>

            <Card 
              className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800 transition cursor-pointer"
              onClick={() => router.push('/analytics')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span className="text-2xl">📊</span>
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  View detailed analytics and insights about your social media presence and engagement metrics.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Searches */}
          <Card className="bg-gray-900 border-gray-700 text-white">
            <CardHeader>
              <CardTitle className="text-xl">📌 Recent Searches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {searches.length > 0 ? (
                  searches.map((name, idx) => (
                    <div
                      key={idx}
                      onClick={() => router.push(`/collection/${name}`)}
                      className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 cursor-pointer hover:bg-blue-600 hover:border-blue-400 hover:scale-105 transition text-blue-300 hover:text-white shadow-md"
                    >
                      #{name}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No recent searches yet. Go to Keywords Configuration to start searching!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
