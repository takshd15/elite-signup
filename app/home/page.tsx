"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  ThumbsUp,
  Award,
  FileText,
  Plus,
  Image,
  Link2,
  Send,
  MessageSquare,
  Trophy,
  Calendar,
  Clock,
  CheckCircle,
  BarChart2,
  Zap,
  Users,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import {
  EnhancedCard,
  EnhancedCardContent,
  EnhancedCardFooter,
  EnhancedCardHeader,
  EnhancedCardTitle,
} from "@/components/ui/enhanced-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { XPNotification } from "@/components/xp-notification"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { AnimatedProgress } from "@/components/ui/animated-progress"
import { AnimatedSection } from "@/components/ui/animated-section"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Mock data for professional posts
const posts = [
  {
    id: 1,
    user: {
      name: "Alex Johnson",
      title: "Software Engineer at Google",
      username: "alex_improvement",
      image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces",
      verified: true,
    },
    content: {
      text: "Just completed the Advanced System Design course! 🚀 Excited to apply these new architectural patterns to our current project. #SystemDesign #ProfessionalDevelopment",
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop",
      type: "achievement",
      achievement: "Completed Advanced System Design Course",
    },
    timestamp: "2 hours ago",
    likes: 243,
    comments: 18,
    liked: false,
    saved: false,
  },
  {
    id: 2,
    user: {
      name: "Sarah Williams",
      title: "Product Manager at Microsoft",
      username: "mindful_sarah",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
      verified: true,
    },
    content: {
      text: "Proud to announce that our team's project was selected for the company-wide innovation showcase! This was the result of 3 months of hard work and collaboration. Looking forward to presenting next week! #Innovation #Leadership",
      type: "milestone",
      milestone: "Project selected for innovation showcase",
    },
    timestamp: "5 hours ago",
    likes: 512,
    comments: 42,
    liked: true,
    saved: true,
  },
  {
    id: 3,
    user: {
      name: "Michael Chen",
      title: "Data Scientist at Amazon",
      username: "productivity_mike",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
      verified: false,
    },
    content: {
      text: "Just published my research paper on 'Optimizing Machine Learning Models for Production Environments' in the IEEE Journal. It's been a long journey, but so rewarding to see it finally published! Link to the paper in comments. #MachineLearning #Research",
      type: "publication",
      publication: "Research paper published in IEEE Journal",
    },
    timestamp: "Yesterday",
    likes: 189,
    comments: 27,
    liked: false,
    saved: false,
  },
  {
    id: 4,
    user: {
      name: "Emily Rodriguez",
      title: "UX Designer at Adobe",
      username: "design_emily",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces",
      verified: true,
    },
    content: {
      text: "Just completed my 30-day UI challenge! I designed a new interface component every day for a month. Swipe to see some of my favorite designs. This experience really pushed my creativity and technical skills. #UIDesign #30DayChallenge",
      image: "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=600&h=400&fit=crop",
      type: "challenge",
      challenge: "Completed 30-day UI design challenge",
    },
    timestamp: "2 days ago",
    likes: 345,
    comments: 31,
    liked: false,
    saved: false,
  },
]

// Mock data for upcoming tasks
const upcomingTasks = [
  {
    id: 1,
    title: "Complete System Design Assignment",
    dueDate: "Today",
    dueTime: "5:00 PM",
    priority: "High",
    completed: false,
    category: "Learning",
  },
  {
    id: 2,
    title: "Review Team Presentations",
    dueDate: "Tomorrow",
    dueTime: "2:00 PM",
    priority: "Medium",
    completed: false,
    category: "Work",
  },
  {
    id: 3,
    title: "Prepare for Technical Interview",
    dueDate: "Jun 15, 2023",
    dueTime: "10:00 AM",
    priority: "High",
    completed: false,
    category: "Career",
  },
  {
    id: 4,
    title: "Weekly Fitness Goal",
    dueDate: "Jun 18, 2023",
    dueTime: "All day",
    priority: "Medium",
    completed: false,
    category: "Health",
  },
]

// Mock data for network suggestions
const networkSuggestions = [
  {
    id: 1,
    name: "David Kim",
    title: "Frontend Developer at Netflix",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
    mutualConnections: 12,
  },
  {
    id: 2,
    name: "Jessica Lee",
    title: "Product Manager at Spotify",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces",
    mutualConnections: 8,
  },
  {
    id: 3,
    name: "Ryan Martinez",
    title: "Data Engineer at Airbnb",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=faces",
    mutualConnections: 5,
  },
]

// Mock data for user stats
const userStats = {
  level: 5,
  xp: 2450,
  nextLevelXp: 3000,
  streak: 7,
  tasksCompleted: 23,
  tasksTotal: 30,
  connectionsGrowth: 15,
  skillsImproved: 4,
}

export default function HomePage() {
  const router = useRouter()
  const [likedPosts, setLikedPosts] = useState<number[]>(posts.filter((p) => p.liked).map((p) => p.id))
  const [savedPosts, setSavedPosts] = useState<number[]>(posts.filter((p) => p.saved).map((p) => p.id))
  const [showXpNotification, setShowXpNotification] = useState(false)
  const [showChatDialog, setShowChatDialog] = useState(false)
  const [postText, setPostText] = useState("")
  const [completedTasks, setCompletedTasks] = useState<number[]>([])
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1)

  // Check if it's the user's first visit
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem("hasVisitedBefore")
    if (!hasVisitedBefore) {
      setShowOnboarding(true)
      localStorage.setItem("hasVisitedBefore", "true")
    }
  }, [])

  const toggleLike = (postId: number) => {
    if (likedPosts.includes(postId)) {
      setLikedPosts(likedPosts.filter((id) => id !== postId))
    } else {
      setLikedPosts([...likedPosts, postId])
      setShowXpNotification(true)
    }
  }

  const toggleSave = (postId: number) => {
    if (savedPosts.includes(postId)) {
      setSavedPosts(savedPosts.filter((id) => id !== postId))
    } else {
      setSavedPosts([...savedPosts, postId])
    }
  }

  const handleCreatePost = () => {
    if (postText.trim()) {
      // In a real app, this would create a new post
      console.log("Creating post:", postText)
      setPostText("")
      setShowXpNotification(true)
    }
  }

  const toggleTaskCompletion = (taskId: number) => {
    if (completedTasks.includes(taskId)) {
      setCompletedTasks(completedTasks.filter((id) => id !== taskId))
    } else {
      setCompletedTasks([...completedTasks, taskId])
      setShowXpNotification(true)
    }
  }

  const nextOnboardingStep = () => {
    if (onboardingStep < 3) {
      setOnboardingStep(onboardingStep + 1)
    } else {
      setShowOnboarding(false)
    }
  }

  const skipOnboarding = () => {
    setShowOnboarding(false)
  }

  // Calculate progress percentage
  const progressPercentage = (userStats.xp / userStats.nextLevelXp) * 100
  const taskCompletionPercentage = (completedTasks.length / upcomingTasks.length) * 100

  return (
    <DashboardLayout>
      {/* Onboarding Tutorial */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="text-center mb-6">
                <div className="relative h-12 w-12 mx-auto mb-4 overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-secondary-500">
                  <div className="absolute inset-0.5 rounded-full bg-zinc-900 flex items-center justify-center text-white font-bold text-lg">
                    S
                  </div>
                </div>
                <h2 className="text-xl font-bold">Welcome to Strivio!</h2>
                <p className="text-zinc-400 mt-2">Your journey to self-improvement starts here</p>
              </div>

              {onboardingStep === 1 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Track Your Progress</h3>
                  <p className="text-sm text-zinc-400">
                    Set goals, track your progress, and earn XP as you improve your skills and complete tasks.
                  </p>
                  <div className="bg-zinc-800 rounded-lg p-4 flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-primary-500" />
                    <div>
                      <div className="text-sm font-medium">Level up your skills</div>
                      <div className="text-xs text-zinc-500">Earn XP and badges as you progress</div>
                    </div>
                  </div>
                </div>
              )}

              {onboardingStep === 2 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Connect with Others</h3>
                  <p className="text-sm text-zinc-400">
                    Join communities, follow other users, and share your achievements with your network.
                  </p>
                  <div className="bg-zinc-800 rounded-lg p-4 flex items-center gap-3">
                    <Users className="h-8 w-8 text-primary-500" />
                    <div>
                      <div className="text-sm font-medium">Build your network</div>
                      <div className="text-xs text-zinc-500">Learn from others on similar journeys</div>
                    </div>
                  </div>
                </div>
              )}

              {onboardingStep === 3 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Get Personalized Guidance</h3>
                  <p className="text-sm text-zinc-400">
                    Receive tailored recommendations and insights based on your goals and progress.
                  </p>
                  <div className="bg-zinc-800 rounded-lg p-4 flex items-center gap-3">
                    <Zap className="h-8 w-8 text-primary-500" />
                    <div>
                      <div className="text-sm font-medium">Accelerate your growth</div>
                      <div className="text-xs text-zinc-500">Get AI-powered recommendations</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8">
                <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={skipOnboarding}>
                  Skip
                </Button>
                <EnhancedButton variant="gradient" rounded="full" animation="shimmer" onClick={nextOnboardingStep}>
                  {onboardingStep < 3 ? "Next" : "Get Started"}
                </EnhancedButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Profile & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Profile Card */}
            <AnimatedSection delay={0.1}>
              <EnhancedCard variant="gradient" hover="lift" className="overflow-hidden">
                <EnhancedCardContent className="p-0">
                  <div className="bg-gradient-to-r from-primary-600/30 to-secondary-600/30 h-24 rounded-t-lg relative overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=1200')] bg-cover bg-center opacity-20"
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <div className="px-4 pb-4 relative">
                    <Avatar className="h-16 w-16 border-4 border-black -mt-8 ring-2 ring-primary-500 interactive">
                      <AvatarImage src="/placeholder.svg?height=150&width=150" />
                      <AvatarFallback className="bg-zinc-800">U</AvatarFallback>
                    </Avatar>
                    <div className="mt-2 flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">Alex Morgan</h3>
                        <p className="text-sm text-zinc-400">Software Engineer</p>
                      </div>
                      <EnhancedButton
                        variant="outline"
                        size="sm"
                        rounded="full"
                        className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                        onClick={() => router.push("/profile")}
                      >
                        View Profile
                      </EnhancedButton>
                    </div>

                    {/* Divider */}
                    <div className="my-3 h-px bg-zinc-800" />

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span className="text-zinc-400">Level {userStats.level}</span>
                          <span className="text-zinc-400">
                            {userStats.xp}/{userStats.nextLevelXp} XP
                          </span>
                        </div>
                        <AnimatedProgress
                          value={userStats.xp}
                          max={userStats.nextLevelXp}
                          className="h-2 bg-zinc-800"
                          delay={0.3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-zinc-800/50 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary-500" />
                            <span className="text-xs text-zinc-400">Streak</span>
                          </div>
                          <div className="font-bold mt-1">
                            <AnimatedCounter from={0} to={userStats.streak} duration={1} delay={0.4} /> days
                          </div>
                        </div>
                        <div className="bg-zinc-800/50 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary-500" />
                            <span className="text-xs text-zinc-400">Tasks</span>
                          </div>
                          <div className="font-bold mt-1">
                            <AnimatedCounter from={0} to={userStats.tasksCompleted} duration={1} delay={0.5} />/
                            {userStats.tasksTotal}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </EnhancedCardContent>
              </EnhancedCard>
            </AnimatedSection>

            {/* Stats Card */}
            <AnimatedSection delay={0.2}>
              <EnhancedCard variant="default" hover="glow" className="bg-zinc-900/50 border-zinc-800">
                <EnhancedCardHeader className="pb-2">
                  <EnhancedCardTitle className="text-lg flex items-center">
                    <BarChart2 className="h-5 w-5 mr-2 text-primary-500" />
                    Your Progress
                  </EnhancedCardTitle>
                </EnhancedCardHeader>
                <EnhancedCardContent className="p-4 pt-0">
                  <div className="space-y-4">
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Weekly Goal Progress</span>
                        <span className="text-xs text-zinc-400">{Math.round(taskCompletionPercentage)}%</span>
                      </div>
                      <AnimatedProgress value={completedTasks.length} max={upcomingTasks.length} delay={0.6} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-800/50 rounded-lg p-3">
                        <div className="text-xs text-zinc-400 mb-1">Network Growth</div>
                        <div className="flex items-end gap-1">
                          <span className="text-lg font-bold text-primary-500">+</span>
                          <AnimatedCounter
                            from={0}
                            to={userStats.connectionsGrowth}
                            className="text-lg font-bold"
                            delay={0.7}
                          />
                        </div>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-3">
                        <div className="text-xs text-zinc-400 mb-1">Skills Improved</div>
                        <div className="flex items-end gap-1">
                          <AnimatedCounter
                            from={0}
                            to={userStats.skillsImproved}
                            className="text-lg font-bold"
                            delay={0.8}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </EnhancedCardContent>
              </EnhancedCard>
            </AnimatedSection>

            {/* Upcoming Tasks */}
            <AnimatedSection delay={0.3}>
              <EnhancedCard variant="default" hover="glow" className="bg-zinc-900/50 border-zinc-800">
                <EnhancedCardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <EnhancedCardTitle className="text-lg flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-primary-500" />
                      Upcoming Tasks
                    </EnhancedCardTitle>
                    <EnhancedButton
                      variant="ghost"
                      size="sm"
                      rounded="full"
                      className="text-zinc-400 hover:text-white"
                      onClick={() => router.push("/goals")}
                    >
                      View All
                    </EnhancedButton>
                  </div>
                </EnhancedCardHeader>
                <EnhancedCardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    {upcomingTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-start p-3 rounded-lg transition-all duration-300",
                          completedTasks.includes(task.id)
                            ? "bg-primary-900/10 border border-primary-800/30"
                            : "bg-zinc-800/50 hover:bg-zinc-800",
                        )}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-3 h-3 rounded-full flex-shrink-0",
                                task.priority === "High"
                                  ? "bg-red-500"
                                  : task.priority === "Medium"
                                    ? "bg-yellow-500"
                                    : "bg-green-500",
                              )}
                            />
                            <h4
                              className={cn(
                                "text-sm font-medium",
                                completedTasks.includes(task.id) && "line-through text-zinc-500",
                              )}
                            >
                              {task.title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-3 mt-1 ml-5">
                            <div className="flex items-center text-xs text-zinc-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              {task.dueDate}
                            </div>
                            <div className="flex items-center text-xs text-zinc-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {task.dueTime}
                            </div>
                          </div>
                        </div>
                        <EnhancedButton
                          variant={completedTasks.includes(task.id) ? "outline" : "default"}
                          size="sm"
                          rounded="full"
                          className={cn(
                            "h-7 px-2 text-xs",
                            completedTasks.includes(task.id)
                              ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white"
                              : "bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700",
                          )}
                          onClick={() => toggleTaskCompletion(task.id)}
                        >
                          {completedTasks.includes(task.id) ? (
                            <div className="flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Done
                            </div>
                          ) : (
                            "Complete"
                          )}
                        </EnhancedButton>
                      </div>
                    ))}
                  </div>
                </EnhancedCardContent>
              </EnhancedCard>
            </AnimatedSection>
          </div>

          {/* Middle Column - Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            <AnimatedSection delay={0.2}>
              <EnhancedCard variant="default" hover="lift" className="bg-zinc-900/50 border-zinc-800">
                <EnhancedCardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 interactive">
                      <AvatarImage src="/placeholder.svg?height=150&width=150" />
                      <AvatarFallback className="bg-zinc-800">A</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Input
                        placeholder="Share an achievement or update..."
                        className="bg-zinc-800 border-zinc-700 text-white focus:border-primary-500 transition-all duration-300"
                        value={postText}
                        onChange={(e) => setPostText(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between mt-4">
                    <div className="flex gap-2">
                      <EnhancedButton
                        variant="outline"
                        size="sm"
                        rounded="full"
                        className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:border-primary-500/50"
                        leftIcon={<Image className="h-4 w-4" />}
                      >
                        Photo
                      </EnhancedButton>
                      <EnhancedButton
                        variant="outline"
                        size="sm"
                        rounded="full"
                        className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:border-primary-500/50"
                        leftIcon={<Award className="h-4 w-4" />}
                      >
                        Achievement
                      </EnhancedButton>
                      <EnhancedButton
                        variant="outline"
                        size="sm"
                        rounded="full"
                        className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:border-primary-500/50"
                        leftIcon={<Link2 className="h-4 w-4" />}
                      >
                        Link
                      </EnhancedButton>
                    </div>
                    <EnhancedButton
                      size="sm"
                      rounded="full"
                      variant="gradient"
                      animation="shimmer"
                      onClick={handleCreatePost}
                      disabled={!postText.trim()}
                    >
                      Post
                    </EnhancedButton>
                  </div>
                </EnhancedCardContent>
              </EnhancedCard>
            </AnimatedSection>

            {/* Feed Tabs */}
            <Tabs defaultValue="feed" className="w-full">
              <TabsList className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-1 mb-4">
                <TabsTrigger
                  value="feed"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-600/20 data-[state=active]:to-secondary-600/20 data-[state=active]:text-white rounded-md transition-all duration-300"
                >
                  Feed
                </TabsTrigger>
                <TabsTrigger
                  value="network"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-600/20 data-[state=active]:to-secondary-600/20 data-[state=active]:text-white rounded-md transition-all duration-300"
                >
                  Network
                </TabsTrigger>
                <TabsTrigger
                  value="achievements"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-600/20 data-[state=active]:to-secondary-600/20 data-[state=active]:text-white rounded-md transition-all duration-300"
                >
                  Achievements
                </TabsTrigger>
              </TabsList>

              <TabsContent value="feed" className="space-y-4">
                {/* Posts */}
                {posts.map((post, index) => (
                  <AnimatedSection key={post.id} delay={0.2 + index * 0.1}>
                    <EnhancedCard
                      variant="default"
                      hover="lift"
                      className="bg-zinc-900/50 border-zinc-800 overflow-hidden"
                    >
                      <EnhancedCardHeader className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10 interactive">
                              <AvatarImage src={post.user.image} />
                              <AvatarFallback className="bg-zinc-800">{post.user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center">
                                <span className="font-medium">{post.user.name}</span>
                                {post.user.verified && (
                                  <svg className="h-4 w-4 ml-1 text-primary-500 fill-current" viewBox="0 0 24 24">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                  </svg>
                                )}
                              </div>
                              <div className="text-xs text-zinc-400">{post.user.title}</div>
                              <div className="text-xs text-zinc-500">{post.timestamp}</div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 rounded-full hover:bg-zinc-800"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </div>
                      </EnhancedCardHeader>
                      <EnhancedCardContent className="px-4 pb-2">
                        <p className="text-sm mb-3">{post.content.text}</p>

                        {/* Achievement/Milestone Badge */}
                        {post.content.type && (
                          <div
                            className={cn(
                              "p-3 rounded-lg mb-3 transition-all duration-300 hover:shadow-md",
                              post.content.type === "achievement"
                                ? "bg-primary-900/20 border border-primary-800/30"
                                : post.content.type === "milestone"
                                  ? "bg-secondary-900/20 border border-secondary-800/30"
                                  : post.content.type === "publication"
                                    ? "bg-accent-success/20 border border-accent-success/30"
                                    : "bg-accent-warning/20 border border-accent-warning/30",
                            )}
                          >
                            <div className="flex items-center">
                              {post.content.type === "achievement" && (
                                <Award className="h-5 w-5 mr-2 text-primary-400" />
                              )}
                              {post.content.type === "milestone" && (
                                <Trophy className="h-5 w-5 mr-2 text-secondary-400" />
                              )}
                              {post.content.type === "publication" && (
                                <FileText className="h-5 w-5 mr-2 text-accent-success" />
                              )}
                              {post.content.type === "challenge" && (
                                <Award className="h-5 w-5 mr-2 text-accent-warning" />
                              )}
                              <div>
                                <p className="font-medium text-sm">
                                  {post.content.achievement ||
                                    post.content.milestone ||
                                    post.content.publication ||
                                    post.content.challenge}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {post.content.image && (
                          <div className="rounded-lg overflow-hidden mb-3 transition-all duration-300 hover:shadow-lg">
                            <img
                              src={post.content.image || "/placeholder.svg"}
                              alt="Post content"
                              className="w-full h-auto object-cover transition-transform duration-500 hover:scale-105"
                            />
                          </div>
                        )}
                      </EnhancedCardContent>
                      <EnhancedCardFooter className="p-4 pt-0">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-4">
                            <EnhancedButton
                              variant="ghost"
                              size="sm"
                              rounded="full"
                              className={cn(
                                "transition-all duration-300",
                                likedPosts.includes(post.id) ? "text-primary-500" : "text-zinc-400",
                              )}
                              onClick={() => toggleLike(post.id)}
                            >
                              <ThumbsUp
                                className={cn("h-4 w-4 mr-1", likedPosts.includes(post.id) && "fill-current")}
                              />
                              <span className="text-xs">{post.likes}</span>
                            </EnhancedButton>
                            <EnhancedButton
                              variant="ghost"
                              size="sm"
                              rounded="full"
                              className="text-zinc-400 hover:text-zinc-300 transition-all duration-300"
                              onClick={() => {
                                // In a real app, this would open the comments
                                console.log(`View comments for post ${post.id}`)
                              }}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              <span className="text-xs">{post.comments}</span>
                            </EnhancedButton>
                            <EnhancedButton
                              variant="ghost"
                              size="sm"
                              rounded="full"
                              className="text-zinc-400 hover:text-zinc-300 transition-all duration-300"
                              onClick={() => {
                                // In a real app, this would open the share dialog
                                console.log(`Share post ${post.id}`)
                              }}
                            >
                              <Share2 className="h-4 w-4 mr-1" />
                              <span className="text-xs">Share</span>
                            </EnhancedButton>
                          </div>
                          <EnhancedButton
                            variant="ghost"
                            size="sm"
                            rounded="full"
                            className={cn(
                              "transition-all duration-300",
                              savedPosts.includes(post.id) ? "text-primary-500" : "text-zinc-400",
                            )}
                            onClick={() => toggleSave(post.id)}
                          >
                            <Bookmark className={cn("h-4 w-4", savedPosts.includes(post.id) && "fill-current")} />
                          </EnhancedButton>
                        </div>
                      </EnhancedCardFooter>
                    </EnhancedCard>
                  </AnimatedSection>
                ))}
              </TabsContent>

              <TabsContent value="network" className="space-y-4">
                <h3 className="text-lg font-semibold mb-2">People You May Know</h3>
                {networkSuggestions.map((person, index) => (
                  <AnimatedSection key={person.id} delay={0.2 + index * 0.1}>
                    <EnhancedCard variant="default" hover="lift" className="bg-zinc-900/50 border-zinc-800">
                      <EnhancedCardContent className="p-4">
                        <div className="flex items-center">
                          <Avatar className="h-12 w-12 mr-3 interactive">
                            <AvatarImage src={person.image} />
                            <AvatarFallback className="bg-zinc-800">{person.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium">{person.name}</h4>
                            <p className="text-sm text-zinc-400">{person.title}</p>
                            <p className="text-xs text-zinc-500 mt-1">{person.mutualConnections} mutual connections</p>
                          </div>
                          <EnhancedButton
                            size="sm"
                            rounded="full"
                            variant="gradient"
                            animation="shimmer"
                            leftIcon={<Plus className="h-3.5 w-3.5" />}
                          >
                            Connect
                          </EnhancedButton>
                        </div>
                      </EnhancedCardContent>
                    </EnhancedCard>
                  </AnimatedSection>
                ))}
                <div className="text-center mt-4">
                  <EnhancedButton
                    variant="outline"
                    rounded="full"
                    className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:border-primary-500/50"
                  >
                    View More Suggestions
                  </EnhancedButton>
                </div>
              </TabsContent>

              <TabsContent value="achievements" className="space-y-4">
                <AnimatedSection delay={0.2} staggerChildren staggerDelay={0.1}>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-primary-500" />
                    Your Recent Achievements
                  </h3>

                  <EnhancedCard variant="gradient" hover="lift" className="border-primary-800/30">
                    <EnhancedCardContent className="p-3">
                      <div className="flex items-start">
                        <div className="bg-primary-900/30 p-2 rounded-full mr-3">
                          <Award className="h-5 w-5 text-primary-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">Completed Advanced React Course</h3>
                            <Badge className="bg-primary-900/50 text-primary-300 border-primary-800 text-[10px]">
                              +500 XP
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-400 mt-1">Earned certificate of completion</p>
                          <div className="text-xs text-zinc-500 mt-1">2 weeks ago</div>
                        </div>
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>

                  <EnhancedCard variant="gradient" hover="lift" className="border-secondary-800/30">
                    <EnhancedCardContent className="p-3">
                      <div className="flex items-start">
                        <div className="bg-secondary-900/30 p-2 rounded-full mr-3">
                          <Trophy className="h-5 w-5 text-secondary-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">Promoted to Senior Developer</h3>
                            <Badge className="bg-secondary-900/50 text-secondary-300 border-secondary-800 text-[10px]">
                              +750 XP
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-400 mt-1">Career milestone achievement</p>
                          <div className="text-xs text-zinc-500 mt-1">1 month ago</div>
                        </div>
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>

                  <EnhancedCard variant="gradient" hover="lift" className="border-accent-success/30">
                    <EnhancedCardContent className="p-3">
                      <div className="flex items-start">
                        <div className="bg-accent-success/20 p-2 rounded-full mr-3">
                          <FileText className="h-5 w-5 text-accent-success" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">Published Technical Article</h3>
                            <Badge className="bg-accent-success/20 text-accent-success border-accent-success/30 text-[10px]">
                              +300 XP
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-400 mt-1">10,000+ views on Medium</p>
                          <div className="text-xs text-zinc-500 mt-1">2 months ago</div>
                        </div>
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>

                  <div className="text-center mt-4">
                    <EnhancedButton
                      variant="gradient"
                      rounded="full"
                      animation="shimmer"
                      onClick={() => router.push("/profile")}
                    >
                      View All Achievements
                    </EnhancedButton>
                  </div>
                </AnimatedSection>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Chat Button */}
      <div className="fixed bottom-20 right-4 z-50">
        <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
          <DialogTrigger asChild>
            <EnhancedButton
              className="h-12 w-12 rounded-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 shadow-lg hover:shadow-primary-500/20"
              size="icon"
              animation="pulse"
            >
              <MessageSquare className="h-5 w-5" />
            </EnhancedButton>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Messages</DialogTitle>
              <DialogDescription className="text-zinc-400">Chat with your connections</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto py-4">
              {/* Chat List */}
              <div className="space-y-2">
                {networkSuggestions.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center p-2 hover:bg-zinc-800 rounded-lg cursor-pointer transition-all duration-300"
                  >
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={person.image} />
                      <AvatarFallback className="bg-zinc-800">{person.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{person.name}</h4>
                      <p className="text-xs text-zinc-400">Online</p>
                    </div>
                    <div className="h-2 w-2 bg-accent-success rounded-full relative">
                      <span className="absolute inset-0 bg-accent-success rounded-full animate-ping opacity-75"></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Input
                placeholder="Type a message..."
                className="bg-zinc-800 border-zinc-700 text-white focus:border-primary-500 transition-all duration-300"
              />
              <EnhancedButton size="icon" variant="gradient" rounded="full">
                <Send className="h-4 w-4" />
              </EnhancedButton>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* XP Notification */}
      {showXpNotification && (
        <XPNotification xp={10} message="Action completed!" onComplete={() => setShowXpNotification(false)} />
      )}
    </DashboardLayout>
  )
}

