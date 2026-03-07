import { useState } from "react";
import { Recycle, Sprout, Wrench, Zap, Droplet, Wind, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

interface Mission {
  id: number;
  title: string;
  category: string;
  icon: any;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  time: string;
  impact: number;
  description: string;
  participants: number;
}

export default function MissionsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const missions: Mission[] = [
    {
      id: 1,
      title: "Start a Compost Jar",
      category: "Composting",
      icon: Recycle,
      difficulty: "Beginner",
      time: "2-3 days",
      impact: 85,
      description: "Learn the basics of composting by creating a small compost jar for your kitchen scraps.",
      participants: 1247,
    },
    {
      id: 2,
      title: "Grow a Small Herb Plant",
      category: "Urban Gardening",
      icon: Sprout,
      difficulty: "Beginner",
      time: "2 weeks",
      impact: 70,
      description: "Start your urban gardening journey by growing basil, mint, or parsley in a small pot.",
      participants: 2103,
    },
    {
      id: 3,
      title: "Track Home Electricity Usage",
      category: "Energy Saving",
      icon: Zap,
      difficulty: "Beginner",
      time: "1 week",
      impact: 90,
      description: "Monitor your home's energy consumption for one week and identify areas for improvement.",
      participants: 1856,
    },
    {
      id: 4,
      title: "Repair a Broken Household Item",
      category: "Repair Skills",
      icon: Wrench,
      difficulty: "Intermediate",
      time: "3-5 hours",
      impact: 95,
      description: "Learn basic repair skills by fixing a broken appliance, tool, or furniture piece.",
      participants: 892,
    },
    {
      id: 5,
      title: "Build a Rainwater Collection System",
      category: "Water Conservation",
      icon: Droplet,
      difficulty: "Intermediate",
      time: "1 weekend",
      impact: 88,
      description: "Create a simple rainwater harvesting system for your garden or balcony plants.",
      participants: 634,
    },
    {
      id: 6,
      title: "Create a Windowsill Garden",
      category: "Urban Gardening",
      icon: Sprout,
      difficulty: "Intermediate",
      time: "3 weeks",
      impact: 75,
      description: "Transform your windowsill into a productive mini garden with herbs and microgreens.",
      participants: 1521,
    },
    {
      id: 7,
      title: "Conduct Home Energy Audit",
      category: "Energy Saving",
      icon: Wind,
      difficulty: "Advanced",
      time: "1 day",
      impact: 92,
      description: "Perform a comprehensive energy audit of your home and create an action plan.",
      participants: 412,
    },
    {
      id: 8,
      title: "Build a Compost Bin",
      category: "Composting",
      icon: Recycle,
      difficulty: "Advanced",
      time: "1 weekend",
      impact: 94,
      description: "Construct a full-sized outdoor compost bin for year-round composting.",
      participants: 789,
    },
    {
      id: 9,
      title: "Fix and Upcycle Old Furniture",
      category: "Repair Skills",
      icon: Wrench,
      difficulty: "Advanced",
      time: "1-2 weeks",
      impact: 87,
      description: "Restore and transform old furniture into beautiful, functional pieces.",
      participants: 567,
    },
  ];

  const categories = [
    { id: "all", name: "All Missions", icon: TrendingUp },
    { id: "Composting", name: "Composting", icon: Recycle },
    { id: "Urban Gardening", name: "Urban Gardening", icon: Sprout },
    { id: "Energy Saving", name: "Energy Saving", icon: Zap },
    { id: "Repair Skills", name: "Repair Skills", icon: Wrench },
    { id: "Water Conservation", name: "Water Conservation", icon: Droplet },
  ];

  const filteredMissions = selectedCategory === "all" 
    ? missions 
    : missions.filter(m => m.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-700 border-green-200";
      case "Intermediate": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Advanced": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Climate Missions</h1>
          <p className="text-gray-600">Choose a mission, take real action, and earn badges</p>
        </div>

        {/* Category Tabs */}
        <Tabs defaultValue="all" className="mb-8" onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="flex items-center gap-2 py-3"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{category.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMissions.map((mission) => {
                const Icon = mission.icon;
                return (
                  <Card key={mission.id} className="hover:shadow-lg transition-shadow flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-green-700" />
                        </div>
                        <Badge className={getDifficultyColor(mission.difficulty)} variant="outline">
                          {mission.difficulty}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{mission.title}</CardTitle>
                      <p className="text-sm text-gray-600">{mission.category}</p>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <p className="text-sm text-gray-600 mb-4">{mission.description}</p>
                      
                      <div className="space-y-3 mt-auto">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-4 h-4" />
                            {mission.time}
                          </span>
                          <span className="flex items-center gap-1 text-gray-600">
                            <TrendingUp className="w-4 h-4" />
                            Impact: {mission.impact}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {mission.participants.toLocaleString()} participants
                        </div>

                        <Button className="w-full bg-green-700 hover:bg-green-800">
                          Start Mission
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredMissions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No missions found in this category.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Mission Flow Info */}
        <Card className="mt-12 bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle>How Missions Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-700 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                  1
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Choose Mission</h3>
                <p className="text-sm text-gray-600">Pick a mission that fits your interest and skill level</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-700 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                  2
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Follow Steps</h3>
                <p className="text-sm text-gray-600">Complete real-world actions with guided instructions</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-700 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                  3
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Upload Proof</h3>
                <p className="text-sm text-gray-600">Document your progress with photos or descriptions</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-700 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                  4
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Earn Badge</h3>
                <p className="text-sm text-gray-600">Get certified and add skills to your profile</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
