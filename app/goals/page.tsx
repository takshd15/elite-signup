"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  CheckCircle,
  Trophy,
  Target,
  BarChart2,
  Users,
  Zap,
  Star,
  Plus,
  Filter,
  TrendingUp,
  Award,
  Clock,
} from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { AnimatedSection } from "@/components/ui/animated-section"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { AnimatedProgress } from "@/components/ui/animated-progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// Sample goal categories
const goalCategories = [
  { id: "academic", name: "Academic", icon: Trophy, color: "from-blue-500 to-indigo-600" },
  { id: "career", name: "Career", icon: TrendingUp, color: "from-purple-500 to-violet-600" },
  { id: "fitness", name: "Fitness", icon: Zap, color: "from-orange-500 to-pink-600" },
  { id: "personal", name: "Personal", icon: Star, color: "from-green-500 to-teal-600" },
]

// Sample active goals
const activeGoals = [
  {
    id: 1,
    title: "Complete Python Certification",
    category: "academic",
    progress: 65,
    daysLeft: 14,
    xpEarned: 450,
    totalXp: 1000,
    level: 3,
    challenges: [
      { id: 1, title: "Complete 5 coding exercises", completed: true },
      { id: 2, title: "Build a small project", completed: true },
      { id: 3, title: "Pass the mock exam", completed: false },
    ],
  },
  {
    id: 2,
    title: "Run 5K under 30 minutes",
    category: "fitness",
    progress: 80,
    daysLeft: 7,
    xpEarned: 720,
    totalXp: 900,
    level: 4,
    challenges: [
      { id: 1, title: "Run 2K without stopping", completed: true },
      { id: 2, title: "Improve pace by 10%", completed: true },
      { id: 3, title: "Complete a 4K run", completed: true },
      { id: 4, title: "Practice sprint intervals", completed: false },
    ],
  },
  {
    id: 3,
    title: "Learn Spanish Basics",
    category: "personal",
    progress: 35,
    daysLeft: 30,
    xpEarned: 280,
    totalXp: 800,
    level: 2,
    challenges: [
      { id: 1, title: "Master 100 common words", completed: true },
      { id: 2, title: "Practice basic conversations", completed: false },
      { id: 3, title: "Complete beginner grammar", completed: false },
    ],
  },
]

// Sample leaderboard data
const leaderboardData = [
  { name: "Alex J.", goal: "Python Mastery", progress: 85, xp: 950 },
  { name: "Sarah T.", goal: "5K Training", progress: 92, xp: 1050 },
  { name: "Miguel R.", goal: "Spanish Fluency", progress: 78, xp: 870 },
  { name: "Priya K.", goal: "Web Development", progress: 73, xp: 820 },
]

// Sample success stories
const successStories = [
  {
    name: "James W.",
    goal: "GMAT Preparation",
    achievement: "Scored in the 95th percentile after 60 days of challenges",
    image: "/images/user-alex.png",
    improvement: "32%",
  },
  {
    name: "Emily L.",
    goal: "Marathon Training",
    achievement: "Completed first half-marathon after following the 90-day plan",
    image: "/images/user-sarah.png",
    improvement: "45%",
  },
  {
    name: "David C.",
    goal: "Public Speaking",
    achievement: "Delivered a conference talk after overcoming anxiety through daily practice",
    image: "/images/user-michael.png",
    improvement: "28%",
  },
]

export default function GoalsPage() {
  const [activeTab, setActiveTab] = useState("active")
  const [selectedCategory, setSelectedCategory] = useState("all")

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <AnimatedSection delay={0.1} className="mb-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              Set, Track, and Conquer Your Goals
            </h1>
            <p className="text-zinc-400 text-lg mb-6">
              Join a community where progress is measured, challenges are fun, and your growth is the ultimate reward.
            </p>

            {/* Key Benefits */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[
                { icon: Target, text: "Personalized Goals", color: "bg-primary-500/20 text-primary-500" },
                { icon: Users, text: "Peer Comparisons", color: "bg-secondary-500/20 text-secondary-500" },
                { icon: BarChart2, text: "Progress Tracking", color: "bg-green-500/20 text-green-500" },
                { icon: Trophy, text: "Gamified Rewards", color: "bg-orange-500/20 text-orange-500" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800"
                >
                  <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-center">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Create Goal CTA */}
        <AnimatedSection delay={0.2} className="mb-10">
          <Dialog>
            <DialogTrigger asChild>
              <EnhancedButton
                variant="gradient"
                rounded="full"
                animation="shimmer"
                className="mx-auto flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Create a New Goal
              </EnhancedButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Create Your Goal</DialogTitle>
                <DialogDescription>
                  Define your goal, set a timeline, and start your journey to success.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="goal-title">Goal Title</Label>
                  <Input
                    id="goal-title"
                    placeholder="E.g., Learn Python, Run 5K, etc."
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Goal Category</Label>
                  <RadioGroup defaultValue="academic" className="grid grid-cols-2 gap-4">
                    {goalCategories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={category.id} id={category.id} />
                        <Label htmlFor={category.id} className="flex items-center gap-2">
                          <category.icon className="h-4 w-4" />
                          {category.name}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal-description">Description</Label>
                  <Textarea
                    id="goal-description"
                    placeholder="Describe your goal and why it matters to you..."
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target-date">Target Date</Label>
                    <Input id="target-date" type="date" className="bg-zinc-800 border-zinc-700" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <RadioGroup defaultValue="public" className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="public" id="public" />
                        <Label htmlFor="public">Public (Compare with peers)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="private" id="private" />
                        <Label htmlFor="private">Private</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-zinc-700">
                      Cancel
                    </Button>
                  </DialogTrigger>
                  <EnhancedButton variant="gradient">Create Goal</EnhancedButton>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </AnimatedSection>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Goals Section */}
          <div className="lg:col-span-2">
            <AnimatedSection delay={0.3}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Your Goals</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="border-zinc-800 flex items-center gap-1">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                  <Tabs defaultValue="active" className="w-[200px]" onValueChange={setActiveTab}>
                    <TabsList className="bg-zinc-900 border border-zinc-800">
                      <TabsTrigger value="active" className="data-[state=active]:bg-primary-500">
                        Active
                      </TabsTrigger>
                      <TabsTrigger value="completed" className="data-[state=active]:bg-primary-500">
                        Completed
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  className={selectedCategory === "all" ? "bg-primary-500" : "border-zinc-800"}
                  onClick={() => setSelectedCategory("all")}
                >
                  All
                </Button>
                {goalCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    className={`flex items-center gap-1 ${selectedCategory === category.id ? "bg-primary-500" : "border-zinc-800"}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <category.icon className="h-4 w-4" />
                    {category.name}
                  </Button>
                ))}
              </div>

              {/* Goals List */}
              <div className="space-y-6">
                {activeGoals
                  .filter((goal) => selectedCategory === "all" || goal.category === selectedCategory)
                  .map((goal) => (
                    <EnhancedCard
                      key={goal.id}
                      variant="default"
                      hover="lift"
                      className="bg-zinc-900/50 border-zinc-800 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold">{goal.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1">
                              <div className="flex items-center gap-1">
                                <Trophy className="h-4 w-4 text-yellow-500" />
                                <span>Level {goal.level}</span>
                              </div>
                              <div className="w-1 h-1 rounded-full bg-zinc-700" />
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-blue-500" />
                                <span>{goal.daysLeft} days left</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="text-sm text-zinc-400">XP Earned</div>
                              <div className="font-bold text-lg">
                                {goal.xpEarned}/{goal.totalXp}
                              </div>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                                {goal.progress}%
                              </div>
                            </div>
                          </div>
                        </div>

                        <AnimatedProgress
                          value={goal.progress}
                          max={100}
                          className="h-2 mb-4"
                          indicatorClassName="bg-gradient-to-r from-primary-500 to-secondary-500"
                          delay={0.5}
                          duration={1}
                        />

                        <div className="space-y-2 mt-4">
                          <h4 className="font-medium">Current Challenges:</h4>
                          {goal.challenges.map((challenge) => (
                            <div key={challenge.id} className="flex items-center gap-2">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center ${challenge.completed ? "bg-green-500/20 text-green-500" : "bg-zinc-800 text-zinc-500"}`}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </div>
                              <span className={challenge.completed ? "line-through text-zinc-500" : ""}>
                                {challenge.title}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center mt-6">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="border-zinc-800">
                              Add Challenge
                            </Button>
                            <Button variant="outline" size="sm" className="border-zinc-800">
                              Invite Friends
                            </Button>
                          </div>
                          <EnhancedButton variant="gradient" size="sm">
                            View Details
                          </EnhancedButton>
                        </div>
                      </div>
                    </EnhancedCard>
                  ))}

                {/* Empty State */}
                {activeGoals.filter((goal) => selectedCategory === "all" || goal.category === selectedCategory)
                  .length === 0 && (
                  <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                    <Target className="h-12 w-12 mx-auto text-zinc-700 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No goals found</h3>
                    <p className="text-zinc-500 mb-6">
                      You don't have any{" "}
                      {selectedCategory !== "all"
                        ? goalCategories.find((c) => c.id === selectedCategory)?.name.toLowerCase()
                        : ""}{" "}
                      goals yet.
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <EnhancedButton variant="gradient" size="sm">
                          Create Your First Goal
                        </EnhancedButton>
                      </DialogTrigger>
                      {/* Dialog content is the same as above */}
                    </Dialog>
                  </div>
                )}
              </div>
            </AnimatedSection>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Progress Summary */}
            <AnimatedSection delay={0.4}>
              <EnhancedCard variant="gradient" className="overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Your Progress</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-zinc-400">Total XP</div>
                        <div className="text-2xl font-bold">
                          <AnimatedCounter from={0} to={1450} duration={2} />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-zinc-400">Current Level</div>
                        <div className="text-2xl font-bold">
                          <AnimatedCounter from={0} to={4} duration={1.5} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Level Progress</span>
                        <span>450/1000 XP</span>
                      </div>
                      <AnimatedProgress
                        value={45}
                        max={100}
                        className="h-2"
                        indicatorClassName="bg-gradient-to-r from-yellow-500 to-orange-500"
                        delay={0.6}
                        duration={1}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-zinc-800/50 rounded-lg p-3">
                        <div className="text-2xl font-bold">
                          <AnimatedCounter from={0} to={3} duration={1} />
                        </div>
                        <div className="text-xs text-zinc-400">Active Goals</div>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-3">
                        <div className="text-2xl font-bold">
                          <AnimatedCounter from={0} to={12} duration={1} />
                        </div>
                        <div className="text-xs text-zinc-400">Completed</div>
                      </div>
                    </div>
                  </div>
                </div>
              </EnhancedCard>
            </AnimatedSection>

            {/* Leaderboard */}
            <AnimatedSection delay={0.5}>
              <EnhancedCard variant="default" className="bg-zinc-900/50 border-zinc-800">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Leaderboard</h3>
                    <Button variant="outline" size="sm" className="text-xs border-zinc-800">
                      View All
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {leaderboardData.map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500 text-white font-medium text-xs">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{user.name}</div>
                            <div className="text-xs text-zinc-400">{user.goal}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">{user.xp} XP</div>
                          <div className="text-xs text-green-500">{user.progress}%</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 border border-dashed border-zinc-700 rounded-lg text-center">
                    <p className="text-zinc-400 text-sm">You're ranked #6 this week</p>
                    <p className="text-xs text-zinc-500">Complete challenges to climb the ranks!</p>
                  </div>
                </div>
              </EnhancedCard>
            </AnimatedSection>

            {/* Upcoming Challenges */}
            <AnimatedSection delay={0.6}>
              <EnhancedCard variant="default" className="bg-zinc-900/50 border-zinc-800">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Today's Challenges</h3>
                  <div className="space-y-3">
                    {[
                      { title: "Complete Python Exercise #12", xp: 50, time: "15 min" },
                      { title: "Run 2K at target pace", xp: 75, time: "25 min" },
                      { title: "Practice Spanish vocabulary", xp: 30, time: "10 min" },
                    ].map((challenge, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                            <Zap className="h-4 w-4 text-yellow-500" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{challenge.title}</div>
                            <div className="text-xs text-zinc-400">{challenge.time}</div>
                          </div>
                        </div>
                        <div className="text-xs font-medium text-primary-500">+{challenge.xp} XP</div>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700">View All Challenges</Button>
                </div>
              </EnhancedCard>
            </AnimatedSection>
          </div>
        </div>

        {/* Success Stories */}
        <AnimatedSection delay={0.7} className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Success Stories</h2>
            <p className="text-zinc-400">See how others achieved their goals using our platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {successStories.map((story, index) => (
              <EnhancedCard key={index} variant="default" hover="lift" className="bg-zinc-900/50 border-zinc-800">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      <Image
                        src={story.image || "/placeholder.svg"}
                        alt={story.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-medium">{story.name}</div>
                      <div className="text-sm text-zinc-400">{story.goal}</div>
                    </div>
                  </div>

                  <p className="text-zinc-300 mb-4">"{story.achievement}"</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Achievement Unlocked</span>
                    </div>
                    <div className="text-sm text-green-500">+{story.improvement} improvement</div>
                  </div>
                </div>
              </EnhancedCard>
            ))}
          </div>
        </AnimatedSection>

        {/* Ethical Messaging */}
        <AnimatedSection delay={0.8} className="mt-12 mb-6">
          <EnhancedCard variant="glass" className="border-zinc-800/50">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-3">Balanced Growth Philosophy</h2>
              <p className="text-zinc-400 mb-4">
                Our platform is designed to help you achieve meaningful progress while maintaining balance in your life.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-800/30 p-4 rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary-500" />
                    Progress Over Perfection
                  </h3>
                  <p className="text-sm text-zinc-400">
                    We measure your growth journey, not just end results. Every step forward counts.
                  </p>
                </div>

                <div className="bg-zinc-800/30 p-4 rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-secondary-500" />
                    Community Support
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Competition is friendly and designed to motivate, not stress. We're all growing together.
                  </p>
                </div>

                <div className="bg-zinc-800/30 p-4 rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    Digital Well-being
                  </h3>
                  <p className="text-sm text-zinc-400">
                    We encourage healthy engagement patterns and regular breaks to maintain balance.
                  </p>
                </div>
              </div>

              <div className="mt-4 text-sm text-zinc-500 text-center">
                <p>Remember: Your well-being comes first. Take breaks when needed and celebrate your progress.</p>
              </div>
            </div>
          </EnhancedCard>
        </AnimatedSection>

        {/* Call to Action */}
        <AnimatedSection delay={0.9} className="mt-12 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Ready to Achieve More?</h2>
          <p className="text-zinc-400 mb-6">
            Set meaningful goals, track your progress, and join a community of achievers who are committed to growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="#" className="flex items-center">
              <EnhancedButton variant="gradient" rounded="full" animation="shimmer" className="group">
                Create Your First Goal
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </EnhancedButton>
            </Link>
            <Button variant="outline" className="border-zinc-800">
              Explore Popular Goals
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </AppShell>
  )
}

