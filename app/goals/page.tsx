"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
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
import { useRef } from "react"

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

const goalOptions = [
  { id: "financial", name: "Financial Freedom", description: "Achieve financial independence and security." },
  { id: "career", name: "Career Advancement", description: "Grow your career and reach new heights." },
  { id: "fitness", name: "Fitness & Health", description: "Improve your physical and mental well-being." },
  { id: "learning", name: "Continuous Learning", description: "Master new skills and knowledge." },
  { id: "personal", name: "Personal Growth", description: "Become the best version of yourself." },
  { id: "business", name: "Business Success", description: "Build, grow, or scale your business to new heights." },
]

const commonGoals = [
  "Get a promotion", "Start a side hustle", "Run a marathon", "Learn a new language", "Build a portfolio", "Grow a business", "Network with peers", "Publish a paper", "Get a certification", "Improve public speaking"
]

const activityOptions = {
  financial: ["Track expenses", "Investing", "Budgeting", "Side hustles", "Financial reading", "Save for retirement", "Pay off debt", "Crypto trading", "Real estate", "Stock market research"],
  career: ["Networking", "Skill courses", "Mock interviews", "Resume building", "Portfolio projects", "LinkedIn optimization", "Job applications", "Mentorship", "Attend webinars", "Public speaking"],
  fitness: ["Running", "Yoga", "Strength training", "Meal planning", "Meditation", "Cycling", "Swimming", "HIIT", "Sports", "Daily steps"],
  learning: ["Online courses", "Reading books", "Practice problems", "Group study", "Workshops", "Podcasts", "Language learning", "Certifications", "Research", "Writing essays"],
  personal: ["Journaling", "Volunteering", "New hobbies", "Mindfulness", "Goal setting", "Travel", "Cooking", "Art", "Gardening", "Meditation"],
  business: ["Market research", "Networking", "Pitching", "Product development", "Sales calls", "Social media", "Fundraising", "Hiring", "Customer feedback", "Branding"],
}

// Helper: Challenge assignment (still personalized)
function getChallenges(score: number, activities: string[]) {
  const daily = score && score > 70
    ? `Complete an advanced task in: ${activities[0] || 'your field'}`
    : `Practice a foundational skill in: ${activities[0] || 'your field'}`
  const monthly = score && score > 70
    ? `Lead a group project or publish a result in: ${activities[1] || activities[0] || 'your field'}`
    : `Finish a beginner project or course in: ${activities[1] || activities[0] || 'your field'}`
  return { daily, monthly }
}

// Filter activities by search
function filteredActivities(
  activityOptions: Record<string, string[]>,
  selectedGoal: string | null,
  activitySearch: string
): string[] {
  if (!selectedGoal || !activityOptions[selectedGoal]) return [];
  return activityOptions[selectedGoal].filter((a: string) =>
    a.toLowerCase().includes(activitySearch.toLowerCase())
  );
}

// Helper: Generate daily/monthly challenges for a goal
function getGoalChallenges(goal: any) {
  // Use goal.category and activities to generate relevant challenges
  const daily =
    goal.category === 'career'
      ? 'Apply to one new job or connect with a peer on LinkedIn.'
      : goal.category === 'fitness'
      ? 'Complete a 20-minute workout or track your steps.'
      : goal.category === 'learning'
      ? 'Study a new topic or complete a lesson in your course.'
      : goal.category === 'financial'
      ? 'Track your expenses and save a small amount today.'
      : goal.category === 'business'
      ? 'Reach out to a potential client or brainstorm a new product idea.'
      : goal.category === 'personal'
      ? 'Reflect in your journal or try a new hobby.'
      : 'Make progress on your goal today.'
  const monthly =
    goal.category === 'career'
      ? 'Complete a mock interview or update your resume.'
      : goal.category === 'fitness'
      ? 'Achieve a new personal best or join a fitness event.'
      : goal.category === 'learning'
      ? 'Finish a course or present what you learned to others.'
      : goal.category === 'financial'
      ? 'Review your budget and set a new savings target.'
      : goal.category === 'business'
      ? 'Launch a campaign or close a new deal.'
      : goal.category === 'personal'
      ? 'Volunteer for a cause or master a new skill.'
      : 'Achieve a major milestone for your goal.'
  return { daily, monthly }
}

export default function GoalsPage() {
  const [step, setStep] = useState<number>(1)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [resume, setResume] = useState<string>("")
  const [score, setScore] = useState<number | null>(null)
  const [challenges, setChallenges] = useState<{ daily: string; monthly: string } | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [activitySearch, setActivitySearch] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showDashboard, setShowDashboard] = useState(false)

  // Step 1: Choose Goal
  // Step 2: Choose Activities
  // Step 3: Upload Resume or Write Summary
  // Step 4: Show Score (mock for now)
  // Step 5: Show assigned challenges (placeholder)

  // Helper: Challenge assignment (still personalized)
  function getChallenges(score: number, activities: string[]) {
    const daily = score && score > 70
      ? `Complete an advanced task in: ${activities[0] || 'your field'}`
      : `Practice a foundational skill in: ${activities[0] || 'your field'}`
    const monthly = score && score > 70
      ? `Lead a group project or publish a result in: ${activities[1] || activities[0] || 'your field'}`
      : `Finish a beginner project or course in: ${activities[1] || activities[0] || 'your field'}`
    return { daily, monthly }
  }

  // Stepper flow
  if (!showDashboard) {
  return (
    <AppShell>
        <div className="flex flex-col min-h-screen bg-black text-white">
          <section className="relative overflow-hidden bg-black pb-16 pt-16 md:pt-24 md:pb-24">
            <div className="absolute inset-0 z-0">
              <div className="absolute top-0 left-0 w-full h-full bg-black" />
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent" />
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-radial from-blue-500/40 via-purple-700/30 to-transparent rounded-full blur-3xl" />
              <div className="absolute top-1/2 -left-24 w-72 h-72 bg-gradient-radial from-purple-700/40 via-pink-600/30 to-transparent rounded-full blur-3xl" />
            </div>
            <div className="container mx-auto px-4 relative z-10 max-w-2xl">
              <AnimatedSection delay={0.1}>
                <h1 className="text-4xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent text-center drop-shadow-[0_0_24px_rgba(80,0,255,0.4)] tracking-tight">
                  Start Your Growth Journey
            </h1>
                <p className="text-zinc-400 text-lg mb-8 text-center">
                  Choose a goal, upload your resume, and get personalized challenges to level up your life!
                </p>
              </AnimatedSection>
              <AnimatedSection delay={0.2}>
                <EnhancedCard variant="default" className="bg-zinc-900/90 border border-blue-700/40 shadow-lg shadow-blue-500/30 p-0 overflow-hidden">
                  <div className="p-6">
                    {/* Stepper UI */}
                    <div className="flex justify-between mb-8">
                      {[1,2,3,4,5].map((s) => (
                        <div key={s} className={`flex-1 flex flex-col items-center ${step === s ? 'text-primary-500' : 'text-zinc-500'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step === s ? 'border-primary-500 bg-primary-500/10' : 'border-zinc-700 bg-zinc-800'}`}>{s}</div>
                          <span className="text-xs mt-2 font-semibold tracking-wide uppercase">{[
                            'Goal', 'Activities', 'Resume', 'Score', 'Challenges'][(s-1)]}</span>
                        </div>
                      ))}
                    </div>

                    {/* Step 1: Choose Goal */}
                    {step === 1 && (
                      <AnimatedSection delay={0.1}>
                        <h2 className="text-2xl font-extrabold mb-6 bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent text-center">Choose Your Goal</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          {goalOptions.map(goal => (
                            <button
                              key={goal.id}
                              className={`p-5 rounded-lg border transition-all text-left shadow-[0_0_8px_0_rgba(80,0,255,0.08)] ${selectedGoal === goal.id ? 'border-primary-500 bg-primary-500/10 text-primary-500' : 'border-blue-700/40 bg-zinc-900/80 text-white'}`}
                              onClick={() => setSelectedGoal(goal.id)}
                            >
                              <div className="font-bold text-lg mb-1 flex items-center gap-2">
                                {goal.id === 'financial' && <BarChart2 className="h-5 w-5" />}
                                {goal.id === 'career' && <Users className="h-5 w-5" />}
                                {goal.id === 'fitness' && <Zap className="h-5 w-5" />}
                                {goal.id === 'learning' && <Star className="h-5 w-5" />}
                                {goal.id === 'personal' && <Trophy className="h-5 w-5" />}
                                {goal.id === 'business' && <BarChart2 className="h-5 w-5" />}
                                {goal.name}
                  </div>
                              <div className="text-xs text-zinc-400">{goal.description}</div>
                            </button>
                          ))}
                </div>
                        <div className="mb-4">
                          <h3 className="text-lg font-bold text-white mb-2">Common Goals</h3>
                          <div className="flex flex-wrap gap-2">
                            {commonGoals.map((g) => (
                              <button
                                key={g}
                                className="px-4 py-1 rounded-full border border-blue-700/40 bg-zinc-900/80 text-white text-xs hover:bg-primary-500/10 hover:text-primary-500 transition-all"
                                onClick={() => setSelectedGoal(g)}
                              >
                                {g}
                              </button>
              ))}
            </div>
          </div>
                        <div className="flex justify-end mt-8">
                          <EnhancedButton
                            size="lg"
                            variant="gradient"
                            rounded="full"
                            animation="shimmer"
                            disabled={!selectedGoal}
                            onClick={() => setStep(2)}
                            className="px-8"
                          >
                            Next <ArrowRight className="ml-2 h-5 w-5" />
                          </EnhancedButton>
                        </div>
        </AnimatedSection>
                    )}

                    {/* Step 2: Choose Activities */}
                    {step === 2 && (
                      <AnimatedSection delay={0.1}>
                        <h2 className="text-2xl font-extrabold mb-6 bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent text-center">Choose Activities You Like</h2>
                        {selectedGoal ? (
                          <>
                            <input
                              type="text"
                              placeholder="Search activities..."
                              value={activitySearch}
                              onChange={e => setActivitySearch(e.target.value)}
                              className="w-full mb-4 p-3 rounded-lg border border-blue-700/40 bg-zinc-900/80 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                            <div className="flex flex-wrap gap-3 justify-center max-h-48 overflow-y-auto">
                              {filteredActivities(activityOptions, selectedGoal, activitySearch).map((activity: string) => (
                                <button
                                  key={activity}
                                  className={`px-5 py-2 rounded-full border transition-all font-semibold tracking-wide shadow-[0_0_8px_0_rgba(80,0,255,0.08)] ${selectedActivities.includes(activity) ? 'border-primary-500 bg-primary-500/10 text-primary-500' : 'border-blue-700/40 bg-zinc-900/80 text-white'}`}
                                  onClick={() => setSelectedActivities(selectedActivities.includes(activity)
                                    ? selectedActivities.filter(a => a !== activity)
                                    : [...selectedActivities, activity])}
                                >
                                  {activity}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-center text-zinc-400 py-8">Please select a goal first.</div>
                        )}
                        <div className="flex justify-between mt-8">
                          <EnhancedButton size="lg" variant="outline" rounded="full" onClick={() => setStep(1)}>
                            Back
                          </EnhancedButton>
              <EnhancedButton
                            size="lg"
                variant="gradient"
                rounded="full"
                animation="shimmer"
                            disabled={selectedActivities.length === 0}
                            onClick={() => setStep(3)}
                            className="px-8"
              >
                            Next <ArrowRight className="ml-2 h-5 w-5" />
              </EnhancedButton>
                        </div>
                      </AnimatedSection>
                    )}

                    {/* Step 3: Upload Resume or Write Summary */}
                    {step === 3 && (
                      <AnimatedSection delay={0.1}>
                        <h2 className="text-2xl font-extrabold mb-6 bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent text-center">Upload Your Resume or Write a Summary</h2>
                        <div className="flex flex-col gap-4 mb-4">
                          {!showSummary && (
                            <>
                              <button
                                className="w-full py-3 rounded-lg border border-blue-700/40 bg-zinc-900/80 text-white font-semibold hover:bg-primary-500/10 hover:text-primary-500 transition-all"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                Upload Resume
                              </button>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.txt"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={e => {
                                  // For demo, just set a random string
                                  setResume("Uploaded resume content")
                                }}
                              />
                              <button
                                className="w-full py-2 text-xs text-blue-400 underline hover:text-primary-500 transition-all"
                                onClick={() => setShowSummary(true)}
                              >
                                Don't have a resume? Write a summary
                              </button>
                            </>
                          )}
                          {showSummary && (
                            <>
                              <textarea
                                className="w-full min-h-[120px] p-4 rounded-lg border border-blue-700/40 bg-zinc-900/80 text-white mb-2 shadow-[0_0_8px_0_rgba(80,0,255,0.08)]"
                                placeholder="Write a summary of your experience..."
                                value={resume}
                                onChange={e => setResume(e.target.value)}
                              />
                              <button
                                className="w-full py-2 text-xs text-blue-400 underline hover:text-primary-500 transition-all"
                                onClick={() => setShowSummary(false)}
                              >
                                Back to upload resume
                              </button>
                            </>
                          )}
                        </div>
                        <div className="flex justify-between mt-8">
                          <EnhancedButton size="lg" variant="outline" rounded="full" onClick={() => setStep(2)}>
                            Back
                          </EnhancedButton>
                          <EnhancedButton
                            size="lg"
                            variant="gradient"
                            rounded="full"
                            animation="shimmer"
                            disabled={resume.length < 10}
                            onClick={() => {
                              const newScore = Math.floor(Math.random() * 100) + 1 // Random score for now
                              setScore(newScore)
                              setChallenges(getChallenges(newScore, selectedActivities))
                              setStep(4)
                            }}
                            className="px-8"
                          >
                            Next <ArrowRight className="ml-2 h-5 w-5" />
                          </EnhancedButton>
                </div>
                      </AnimatedSection>
                    )}

                    {/* Step 4: Show Score */}
                    {step === 4 && (
                      <AnimatedSection delay={0.1}>
                        <h2 className="text-2xl font-extrabold mb-6 bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent text-center">Your Score</h2>
                        <div className="flex flex-col items-center mb-6">
                          <div className="text-7xl font-extrabold text-primary-500 mb-2 drop-shadow-[0_0_24px_rgba(80,0,255,0.4)]">
                            <AnimatedCounter from={0} to={score || 0} duration={1.5} />
                          </div>
                          <p className="text-zinc-400">This score is based on your resume/summary. The higher your score, the more advanced your challenges will be!</p>
                      </div>
                        <div className="flex justify-between mt-8">
                          <EnhancedButton size="lg" variant="outline" rounded="full" onClick={() => setStep(3)}>
                            Back
                          </EnhancedButton>
                          <EnhancedButton size="lg" variant="gradient" rounded="full" animation="shimmer" onClick={() => setStep(5)}>
                            See Challenges <ArrowRight className="ml-2 h-5 w-5" />
                          </EnhancedButton>
                </div>
                      </AnimatedSection>
                    )}

                    {/* Step 5: Show Assigned Challenges (dynamic) */}
                    {step === 5 && (
                      <AnimatedSection delay={0.1}>
                        <h2 className="text-2xl font-extrabold mb-6 bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent text-center">Your Personalized Challenges</h2>
                        <div className="space-y-6 mb-8">
                          <EnhancedCard variant="default" className="bg-zinc-900/90 border border-blue-700/40">
                            <div className="p-5">
                              <div className="font-bold text-primary-500 mb-1 text-lg flex items-center gap-2">
                                <Zap className="h-5 w-5" /> Daily Challenge
                              </div>
                              <div className="text-white">{challenges?.daily}</div>
                </div>
                          </EnhancedCard>
                          <EnhancedCard variant="default" className="bg-zinc-900/90 border border-blue-700/40">
                            <div className="p-5">
                              <div className="font-bold text-secondary-500 mb-1 text-lg flex items-center gap-2">
                                <Trophy className="h-5 w-5" /> Monthly Challenge
                  </div>
                              <div className="text-white">{challenges?.monthly}</div>
                      </div>
                          </EnhancedCard>
                      </div>
                        <EnhancedButton size="lg" variant="gradient" rounded="full" animation="shimmer" onClick={() => setShowDashboard(true)}>
                          Go to My Goals
                        </EnhancedButton>
                      </AnimatedSection>
                    )}
                  </div>
                </EnhancedCard>
              </AnimatedSection>
            </div>
          </section>
                </div>
      </AppShell>
    )
  }

  // After stepper: show dashboard (previous goals page)
  if (showDashboard) {
    return (
      <AppShell>
        <div className="flex flex-col min-h-screen bg-black text-white">
          <section className="relative overflow-hidden bg-black pb-16 pt-16 md:pt-24 md:pb-24">
            <div className="absolute inset-0 z-0">
              <div className="absolute top-0 left-0 w-full h-full bg-black" />
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent" />
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-radial from-blue-500/40 via-purple-700/30 to-transparent rounded-full blur-3xl" />
              <div className="absolute top-1/2 -left-24 w-72 h-72 bg-gradient-radial from-purple-700/40 via-pink-600/30 to-transparent rounded-full blur-3xl" />
            </div>
            <div className="container mx-auto px-4 relative z-10">
              <AnimatedSection delay={0.1}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
                  <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(80,0,255,0.4)] tracking-tight">My Goals</h1>
                  <EnhancedButton
                    size="lg"
                    variant="gradient"
                    rounded="full"
                    animation="shimmer"
                    className="px-8"
                    onClick={() => {
                      setStep(1)
                      setShowDashboard(false)
                    }}
                  >
                    + Add New Goal
                  </EnhancedButton>
                </div>
        </AnimatedSection>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Goals Section */}
          <div className="lg:col-span-2">
                  <AnimatedSection delay={0.2}>
              <div className="space-y-6">
                      {activeGoals.map((goal) => {
                        const challenges = getGoalChallenges(goal)
                        return (
                    <EnhancedCard
                      key={goal.id}
                      variant="default"
                      hover="lift"
                            className="bg-zinc-900/80 border border-blue-700/40 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                                  <h3 className="text-xl font-semibold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">{goal.title}</h3>
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
                              {/* New: Daily/Monthly Challenges */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <EnhancedCard variant="default" className="bg-zinc-900/90 border border-blue-700/40">
                                  <div className="p-4 flex items-center gap-3">
                                    <Zap className="h-5 w-5 text-blue-400" />
                                    <div>
                                      <div className="font-bold text-primary-500 mb-1">Daily Challenge</div>
                                      <div className="text-white text-sm">{challenges.daily}</div>
                                    </div>
                                  </div>
                                </EnhancedCard>
                                <EnhancedCard variant="default" className="bg-zinc-900/90 border border-purple-700/40">
                                  <div className="p-4 flex items-center gap-3">
                                    <Trophy className="h-5 w-5 text-purple-400" />
                                    <div>
                                      <div className="font-bold text-secondary-500 mb-1">Monthly Challenge</div>
                                      <div className="text-white text-sm">{challenges.monthly}</div>
                                    </div>
                                  </div>
                                </EnhancedCard>
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
                        )})}
              </div>
            </AnimatedSection>
          </div>
          {/* Sidebar */}
          <div className="space-y-8">
            {/* Progress Summary */}
                  <AnimatedSection delay={0.3}>
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
                  <AnimatedSection delay={0.4}>
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
                </div>
              </div>
            </div>
          </section>
      </div>
    </AppShell>
  )
}
}
