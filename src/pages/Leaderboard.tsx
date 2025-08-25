import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DumpCard from "@/components/DumpCard";
import { getTopRatedDumps, getRecentDumps, getDumpStats, type DumpWithTimestamp } from "@/services/supabaseService";
import { Trophy, TrendingUp, Clock, Star } from "lucide-react";

const Leaderboard = () => {
  const [topRatedDumps, setTopRatedDumps] = useState<DumpWithTimestamp[]>([]);
  const [recentDumps, setRecentDumps] = useState<DumpWithTimestamp[]>([]);
  const [stats, setStats] = useState({
    totalDumps: 0,
    activeToday: 0,
    topRating: 0,
    categories: 8
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [topDumps, recent, dumpStats] = await Promise.all([
          getTopRatedDumps(),
          getRecentDumps(3),
          getDumpStats()
        ]);
        
        setTopRatedDumps(topDumps);
        setRecentDumps(recent);
        
        // Calculate top rating
        const topRating = topDumps.length > 0 ? Math.max(...topDumps.map(d => d.rating)) : 0;
        
        setStats({
          totalDumps: dumpStats.totalDumps,
          activeToday: recent.length, // Simplified - you might want to filter by today's date
          topRating: Number(topRating.toFixed(1)),
          categories: 8
        });
      } catch (error) {
        console.error('Failed to load leaderboard data:', error);
      }
      setLoading(false);
    };
    
    loadData();
  }, []);

  const dumpOfTheDay = topRatedDumps[0];

  const statsDisplay = [
    { 
      label: "Total Dumps", 
      value: `${(700 + stats.totalDumps).toLocaleString()}`, 
      icon: TrendingUp 
    },
    { label: "Recent Dumps", value: stats.activeToday.toString(), icon: Clock },
    { label: "Top Rating", value: `${stats.topRating}★`, icon: Star },
    { label: "Categories", value: stats.categories.toString(), icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-6 pt-24 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
            LEADERBOARD
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            The most loved dumps from our community. Rankings update in real-time based on user votes.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {statsDisplay.map((stat, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-accent/10 rounded-full -translate-y-10 translate-x-10"></div>
                <stat.icon className="w-12 h-12 text-accent mx-auto mb-4 relative z-10" />
                <div className="text-3xl font-black text-white mb-2 relative z-10">
                  {stat.value}
                </div>
                <div className="text-white/70 text-base font-medium relative z-10">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-md mx-auto">
              <p className="text-white/80 text-lg">Loading leaderboard...</p>
            </div>
          </div>
        )}

        {/* Dump of the Day */}
        {!loading && dumpOfTheDay && <div className="mb-16">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <h2 className="text-3xl font-bold text-white">Dump of the Day</h2>
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-white/80">
              The highest-rated dump in the last 24 hours
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute -top-4 -left-4 z-10">
              <Badge className="bg-yellow-400 text-black font-bold text-lg px-4 py-2">
                #1 Today
              </Badge>
            </div>
            <DumpCard dump={dumpOfTheDay} className="border-2 border-yellow-400/50 shadow-xl shadow-yellow-400/20" hideCommentsButton={true} />
          </div>
        </div>}

        {/* Top Rated Dumps */}
        {!loading && <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Top Rated Dumps</h2>
            <p className="text-white/80">
              All-time favorites from the community
            </p>
          </div>

          <div className="space-y-8">
            {topRatedDumps.slice(1).map((dump, index) => (
              <div key={dump.id} className="relative">
                <div className="absolute -top-4 -left-4 z-10">
                  <Badge 
                    variant="secondary" 
                    className="bg-white/20 text-white font-bold text-lg px-4 py-2"
                  >
                    #{index + 2}
                  </Badge>
                </div>
                <DumpCard dump={dump} className="animate-fade-in" hideCommentsButton={true} />
              </div>
            ))}
          </div>
        </div>}

        {/* Recent Activity */}
        {!loading && <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Recent Activity</h2>
            <p className="text-white/80">
              Latest dumps from the community
            </p>
          </div>

          <div className="space-y-8">
            {recentDumps.map((dump) => (
              <div key={dump.id} className="relative">
                <div className="absolute -top-4 -left-4 z-10">
                  <Badge 
                    variant="outline" 
                    className="bg-green-500/20 border-green-500 text-green-400 font-bold px-3 py-1"
                  >
                    New
                  </Badge>
                </div>
                <DumpCard dump={dump} className="animate-fade-in" hideCommentsButton={true} />
              </div>
            ))}
          </div>
        </div>}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-primary border-0 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                Want to see your dump here?
              </h3>
              <p className="text-white/90 mb-6">
                Submit your anonymous thoughts and see how the community reacts. 
                The best dumps make it to the top of the leaderboard!
              </p>
              <Badge className="bg-white text-primary font-bold px-6 py-2">
                Submit a Dump →
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;