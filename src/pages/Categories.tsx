
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DumpCard from "@/components/DumpCard";
import { categories, getDumpsByCategory, updateCategoryStats, type DumpWithTimestamp } from "@/services/supabaseService";
import { Filter, TrendingUp } from "lucide-react";

const Categories = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredDumps, setFilteredDumps] = useState<DumpWithTimestamp[]>([]);
  const [categoryStats, setCategoryStats] = useState(categories);
  const [loading, setLoading] = useState(false);

  // Load category stats on component mount
  useEffect(() => {
    const loadCategoryStats = async () => {
      const stats = await updateCategoryStats();
      setCategoryStats(stats);
    };
    loadCategoryStats();
  }, []);

  const handleCategoryClick = async (categoryName: string) => {
    const category = categoryName.toLowerCase();
    if (selectedCategory === category) {
      setSelectedCategory(null);
      setFilteredDumps([]);
    } else {
      setLoading(true);
      setSelectedCategory(category);
      try {
        const dumps = await getDumpsByCategory(category);
        setFilteredDumps(dumps);
      } catch (error) {
        console.error('Failed to fetch dumps by category:', error);
        setFilteredDumps([]);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-6 pt-24 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
            CATEGORIES
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Explore dumps by category. Find exactly the type of content you're looking for.
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {categoryStats.map((category) => (
            <Card 
              key={category.name}
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:scale-105 ${
                selectedCategory === category.name.toLowerCase() 
                  ? 'ring-2 ring-accent bg-accent/10' 
                  : 'bg-white/10 backdrop-blur-sm border-white/20'
              }`}
              onClick={() => handleCategoryClick(category.name)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-lg ${
                    selectedCategory === category.name.toLowerCase() ? 'text-accent' : 'text-white'
                  }`}>
                    {category.name}
                  </CardTitle>
                  <Filter className={`w-5 h-5 ${
                    selectedCategory === category.name.toLowerCase() ? 'text-accent' : 'text-white/60'
                  }`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {category.count} dumps
                  </Badge>
                  <TrendingUp className="w-4 h-4 text-white/60" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selected Category Results */}
        {selectedCategory && (
          <div className="space-y-8">
            {loading && (
              <div className="text-center py-12">
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-md mx-auto">
                  <p className="text-white/80 text-lg">Loading dumps...</p>
                </div>
              </div>
            )}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2 capitalize">
                {selectedCategory} Dumps
              </h2>
              <p className="text-white/80">
                {filteredDumps.length} dumps found
              </p>
              <Button
                onClick={() => {
                  setSelectedCategory(null);
                  setFilteredDumps([]);
                }}
                variant="outline"
                className="mt-4 bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                Clear Filter
              </Button>
            </div>

            {!loading && <div className="grid gap-8">
              {filteredDumps.map((dump) => (
                <DumpCard key={dump.id} dump={dump} className="animate-fade-in" />
              ))}
            </div>}

            {filteredDumps.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-md mx-auto">
                  <p className="text-white/80 text-lg">
                    No dumps found in this category yet.
                  </p>
                  <p className="text-white/60 mt-2">
                    Be the first to submit one!
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Default State */}
        {!selectedCategory && (
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-4">
                Choose a Category
              </h3>
              <p className="text-white/80 text-lg">
                Click on any category above to explore dumps of that type.
                Each category contains authentic, anonymous submissions from real users.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;