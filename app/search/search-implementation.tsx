"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Search,
  X,
  Users,
  User,
  TrendingUp,
  Plus,
  ArrowRight,
  Trophy,
  Filter,
  Star,
  Zap,
  CheckCircle,
  Calendar,
  BookOpen,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

import { AppShell } from "@/components/layout/app-shell"
import { Input } from "@/components/ui/input"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EnhancedCard, EnhancedCardContent } from "@/components/ui/enhanced-card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// Mock data for communities
const communities = [
  {
    id: 1,
    name: "Fitness Enthusiasts",
    members: 12453,
    category: "Fitness",
    description: "A community dedicated to fitness goals, workout routines, and healthy living.",
    image: "/images/fitness-community.png",
    joined: false,
    trending: true,
    rating: 4.8,
    activeUsers: 1250,
    postsPerDay: 85,
  },
  {
    id: 2,
    name: "Productivity Masters",
    members: 8762,
    category: "Productivity",
    description: "Share tips, tools, and techniques to maximize your productivity and achieve more.",
    image: "/images/productivity-community.png",
    joined: true,
    trending: true,
    rating: 4.9,
    activeUsers: 980,
    postsPerDay: 64,
  },
  {
    id: 3,
    name: "Mindfulness Practice",
    members: 6291,
    category: "Wellness",
    description: "Learn and practice mindfulness techniques for better mental health and focus.",
    image: "/images/mindfulness-community.png",
    joined: false,
    trending: false,
    rating: 4.7,
    activeUsers: 750,
    postsPerDay: 42,
  },
  {
    id: 4,
    name: "Career Growth",
    members: 9845,
    category: "Career",
    description: "Strategies and support for advancing your career and professional development.",
    image: "/images/career-community.png",
    joined: false,
    trending: true,
    rating: 4.6,
    activeUsers: 1100,
    postsPerDay: 72,
  },
  {
    id: 5,
    name: "Financial Freedom",
    members: 7321,
    category: "Finance",
    description: "Building wealth, investing wisely, and achieving financial independence.",
    image: "/images/finance-community.png",
    joined: false,
    trending: false,
    rating: 4.5,
    activeUsers: 820,
    postsPerDay: 56,
  },
  {
    id: 6,
    name: "Creative Writers",
    members: 4532,
    category: "Creativity",
    description: "A space for writers to share their work, get feedback, and improve their craft.",
    image: "/images/writing-community.png",
    joined: false,
    trending: false,
    rating: 4.4,
    activeUsers: 520,
    postsPerDay: 38,
  },
]

// Mock data for users
const users = [
  {
    id: 1,
    name: "Alex Johnson",
    username: "alex_improvement",
    bio: "Fitness coach | Helping you reach your potential",
    image: "/images/user-alex.png",
    following: false,
    verified: true,
    level: 28,
    xp: 12500,
    completedChallenges: 87,
    topSkill: "Fitness Training",
    joinDate: "1 year ago",
  },
  {
    id: 2,
    name: "Sarah Williams",
    username: "mindful_sarah",
    bio: "Mindfulness practitioner | Daily growth",
    image: "/images/user-sarah.png",
    following: true,
    verified: true,
    level: 35,
    xp: 18750,
    completedChallenges: 124,
    topSkill: "Meditation",
    joinDate: "2 years ago",
  },
  {
    id: 3,
    name: "Michael Chen",
    username: "productivity_mike",
    bio: "Productivity expert | Author | Speaker",
    image: "/images/user-michael.png",
    following: false,
    verified: false,
    level: 42,
    xp: 24680,
    completedChallenges: 156,
    topSkill: "Time Management",
    joinDate: "3 years ago",
  },
  {
    id: 4,
    name: "Emily Rodriguez",
    username: "finance_emily",
    bio: "Financial advisor | Helping you build wealth",
    image: "/images/user-emily.png",
    following: false,
    verified: true,
    level: 31,
    xp: 15400,
    completedChallenges: 98,
    topSkill: "Investment Planning",
    joinDate: "1.5 years ago",
  },
]

// Mock data for challenges
const challenges = [
  {
    id: 1,
    title: "30-Day Fitness Challenge",
    description: "Complete daily workouts to improve strength and endurance",
    category: "Fitness",
    difficulty: "Intermediate",
    participants: 2456,
    completionRate: 68,
    xpReward: 1500,
    duration: "30 days",
    image: "/images/fitness-challenge.png",
  },
  {
    id: 2,
    title: "Productivity Bootcamp",
    description: "Master time management and focus techniques in 2 weeks",
    category: "Productivity",
    difficulty: "Beginner",
    participants: 1872,
    completionRate: 75,
    xpReward: 1200,
    duration: "14 days",
    image: "/images/productivity-challenge.png",
  },
  {
    id: 3,
    title: "Mindfulness Marathon",
    description: "Daily meditation and mindfulness exercises for mental clarity",
    category: "Wellness",
    difficulty: "All Levels",
    participants: 1543,
    completionRate: 62,
    xpReward: 1000,
    duration: "21 days",
    image: "/images/mindfulness-challenge.png",
  },
  {
    id: 4,
    title: "Financial Fitness",
    description: "Build healthy financial habits and create a solid budget",
    category: "Finance",
    difficulty: "Intermediate",
    participants: 1987,
    completionRate: 58,
    xpReward: 1300,
    duration: "28 days",
    image: "/images/finance-challenge.png",
  },
]

// Mock data for mentors
const mentors = [
  {
    id: 1,
    name: "Dr. James Wilson",
    specialty: "Career Development",
    bio: "Executive coach with 15+ years experience helping professionals advance their careers",
    image: "/images/mentor-james.png",
    rating: 4.9,
    reviews: 245,
    hourlyRate: "$120",
    availability: "High",
    verified: true,
  },
  {
    id: 2,
    name: "Lisa Chen, MBA",
    specialty: "Financial Planning",
    bio: "Financial advisor specializing in personal finance and investment strategies",
    image: "/images/mentor-lisa.png",
    rating: 4.8,
    reviews: 187,
    hourlyRate: "$95",
    availability: "Medium",
    verified: true,
  },
  {
    id: 3,
    name: "Mark Johnson",
    specialty: "Fitness & Nutrition",
    bio: "Certified personal trainer and nutritionist with a holistic approach to health",
    image: "/images/mentor-mark.png",
    rating: 4.7,
    reviews: 156,
    hourlyRate: "$85",
    availability: "High",
    verified: true,
  },
]

// Categories for filtering
const categories = [
  "All",
  "Fitness",
  "Productivity",
  "Wellness",
  "Career",
  "Finance",
  "Creativity",
  "Technology",
  "Education",
]

// Difficulty levels
const difficultyLevels = ["All Levels", "Beginner", "Intermediate", "Advanced"]

// Sort options
const sortOptions = [
  { label: "Relevance", value: "relevance" },
  { label: "Most Popular", value: "popular" },
  { label: "Newest", value: "newest" },
  { label: "Highest Rated", value: "rating" },
]

// Recent searches
const recentSearches = [
  {
    id: 1,
    query: "Fitness communities",
    type: "community",
    timestamp: "2 days ago",
  },
  {
    id: 2,
    query: "Productivity coaches",
    type: "user",
    timestamp: "5 days ago",
  },
  {
    id: 3,
    query: "Public speaking skills",
    type: "skill",
    timestamp: "1 week ago",
  },
]

// Auto-suggestions based on input
const getSuggestions = (input: string) => {
  if (!input || input.length < 2) return []

  const suggestions = [
    "fitness challenge",
    "productivity tips",
    "meditation techniques",
    "financial planning",
    "career growth",
    "public speaking",
    "time management",
    "healthy habits",
    "leadership skills",
    "creative writing",
  ]

  return suggestions.filter((suggestion) => suggestion.toLowerCase().includes(input.toLowerCase())).slice(0, 5)
}

export default function SearchImplementation() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedDifficulty, setSelectedDifficulty] = useState("All Levels")
  const [selectedSort, setSelectedSort] = useState("relevance")
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [joinedCommunities, setJoinedCommunities] = useState<number[]>(
    communities.filter((c) => c.joined).map((c) => c.id),
  )
  const [followedUsers, setFollowedUsers] = useState<number[]>(users.filter((u) => u.following).map((u) => u.id))
  const [searchFocused, setSearchFocused] = useState(false)
  const [filteredResults, setFilteredResults] = useState<any[]>([])

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filter results based on search query and filters
  useEffect(() => {
    if (!debouncedQuery) {
      setFilteredResults([])
      return
    }

    // Set loading state
    setIsLoading(true)

    // Simulate API call with timeout
    const timer = setTimeout(() => {
      let results: any[] = []

      if (activeTab === "all" || activeTab === "communities") {
        const filteredCommunities = communities
          .filter(
            (community) =>
              (selectedCategory === "All" || community.category === selectedCategory) &&
              (community.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                community.description.toLowerCase().includes(debouncedQuery.toLowerCase())),
          )
          .map((item) => ({ ...item, type: "community" }))

        if (activeTab === "all") {
          results = [...results, ...filteredCommunities]
        } else {
          results = filteredCommunities
        }
      }

      if (activeTab === "all" || activeTab === "people") {
        const filteredUsers = users
          .filter(
            (user) =>
              user.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
              user.bio.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
              user.username.toLowerCase().includes(debouncedQuery.toLowerCase()),
          )
          .map((item) => ({ ...item, type: "user" }))

        if (activeTab === "all") {
          results = [...results, ...filteredUsers]
        } else {
          results = filteredUsers
        }
      }

      if (activeTab === "all" || activeTab === "challenges") {
        const filteredChallenges = challenges
          .filter(
            (challenge) =>
              (selectedCategory === "All" || challenge.category === selectedCategory) &&
              (selectedDifficulty === "All Levels" || challenge.difficulty === selectedDifficulty) &&
              (challenge.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                challenge.description.toLowerCase().includes(debouncedQuery.toLowerCase())),
          )
          .map((item) => ({ ...item, type: "challenge" }))

        if (activeTab === "all") {
          results = [...results, ...filteredChallenges]
        } else {
          results = filteredChallenges
        }
      }

      if (activeTab === "all" || activeTab === "mentors") {
        const filteredMentors = mentors
          .filter(
            (mentor) =>
              mentor.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
              mentor.specialty.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
              mentor.bio.toLowerCase().includes(debouncedQuery.toLowerCase()),
          )
          .map((item) => ({ ...item, type: "mentor" }))

        if (activeTab === "all") {
          results = [...results, ...filteredMentors]
        } else {
          results = filteredMentors
        }
      }

      // Sort results
      if (selectedSort === "popular") {
        results.sort((a, b) => {
          if (a.type === "community" && b.type === "community") {
            return b.members - a.members
          } else if (a.type === "challenge" && b.type === "challenge") {
            return b.participants - a.participants
          } else if (a.type === "mentor" && b.type === "mentor") {
            return b.reviews - a.reviews
          } else if (a.type === "user" && b.type === "user") {
            return b.xp - a.xp
          }
          return 0
        })
      } else if (selectedSort === "rating") {
        results.sort((a, b) => {
          if (a.rating && b.rating) {
            return b.rating - a.rating
          }
          return 0
        })
      }

      setFilteredResults(results)
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [debouncedQuery, activeTab, selectedCategory, selectedDifficulty, selectedSort])

  // Update suggestions when search query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      setSuggestions(getSuggestions(searchQuery))
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchQuery])

  // Handle search input focus
  const handleSearchFocus = () => {
    setSearchFocused(true)
    if (searchQuery.length >= 2) {
      setShowSuggestions(true)
    }
  }

  // Handle search input blur
  const handleSearchBlur = () => {
    setSearchFocused(false)
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false)
    }, 200)
  }

  // Handle search query change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    if (e.target.value.length > 0) {
      setIsSearching(true)
    } else {
      setIsSearching(false)
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    setIsSearching(true)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // Clear search query
  const clearSearch = () => {
    setSearchQuery("")
    setIsSearching(false)
    setShowSuggestions(false)
  }

  // Toggle join community
  const toggleJoinCommunity = (communityId: number) => {
    if (joinedCommunities.includes(communityId)) {
      setJoinedCommunities(joinedCommunities.filter((id) => id !== communityId))
    } else {
      setJoinedCommunities([...joinedCommunities, communityId])
    }
  }

  // Toggle follow user
  const toggleFollowUser = (userId: number) => {
    if (followedUsers.includes(userId)) {
      setFollowedUsers(followedUsers.filter((id) => id !== userId))
    } else {
      setFollowedUsers([...followedUsers, userId])
    }
  }

  // Remove recent search
  const removeRecentSearch = (id: number) => {
    // In a real app, this would remove the search from the user's history
    console.log(`Remove recent search: ${id}`)
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Reset filters when changing tabs
    setSelectedCategory("All")
    setSelectedDifficulty("All Levels")
    setSelectedSort("relevance")
  }

  return (
    <AppShell title="Search">
      {/* Search Bar */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-lg border-b border-zinc-800 px-4 py-4">
        <div className="relative max-w-4xl mx-auto">
          <div
            className={cn(
              "relative flex items-center transition-all duration-300",
              searchFocused ? "scale-105" : "scale-100",
            )}
          >
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400">
              <Search
                className={cn("transition-all duration-300", searchFocused ? "h-5 w-5 text-primary-500" : "h-5 w-5")}
              />
            </div>
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search communities, people, challenges, mentors..."
              className={cn(
                "pl-10 pr-10 py-6 h-12 bg-zinc-900 text-white rounded-xl shadow-sm transition-all duration-300",
                searchFocused
                  ? "border-primary-500 ring-2 ring-primary-500/20"
                  : "border-zinc-700 focus-visible:ring-primary-500 focus-visible:border-primary-500",
              )}
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />
            {searchQuery && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <EnhancedButton
                  type="button"
                  variant="ghost"
                  size="icon"
                  rounded="full"
                  className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                  onClick={clearSearch}
                >
                  <X className="h-5 w-5" />
                </EnhancedButton>
              </motion.div>
            )}
          </div>

          {/* Auto-suggestions */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-20 mt-2 w-full bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg overflow-hidden"
              >
                <ul className="py-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-zinc-800 flex items-center gap-2"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <Search className="h-4 w-4 text-zinc-500" />
                        <span className="text-white">{suggestion}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs for search categories */}
          <AnimatePresence>
            {(isSearching || searchQuery) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: 0.1 }}
                className="mt-4"
              >
                <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid grid-cols-5 bg-zinc-900 p-1 rounded-lg">
                    <TabsTrigger value="all" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                      All
                    </TabsTrigger>
                    <TabsTrigger
                      value="communities"
                      className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                    >
                      <Users className="h-4 w-4 mr-1 inline-block" />
                      <span className="hidden sm:inline">Communities</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="people"
                      className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                    >
                      <User className="h-4 w-4 mr-1 inline-block" />
                      <span className="hidden sm:inline">People</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="challenges"
                      className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                    >
                      <Trophy className="h-4 w-4 mr-1 inline-block" />
                      <span className="hidden sm:inline">Challenges</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="mentors"
                      className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                    >
                      <BookOpen className="h-4 w-4 mr-1 inline-block" />
                      <span className="hidden sm:inline">Mentors</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Filters - Only show when searching */}
          <AnimatePresence>
            {(isSearching || searchQuery) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: 0.2 }}
                className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
              >
                <EnhancedButton
                  variant="outline"
                  size="sm"
                  rounded="full"
                  className={cn(
                    "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:border-primary-500/50",
                    showFilterMenu && "border-primary-500 bg-zinc-800",
                  )}
                  leftIcon={<Filter className="h-3 w-3" />}
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                >
                  Filters
                </EnhancedButton>

                <div className="h-6 border-l border-zinc-700 mx-1"></div>

                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <span>Sort:</span>
                  <select
                    value={selectedSort}
                    onChange={(e) => setSelectedSort(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category Filters - Show when filter menu is open */}
          <AnimatePresence>
            {showFilterMenu && (isSearching || searchQuery) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden bg-zinc-900 rounded-lg border border-zinc-800 p-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-400 mb-2">Category</h3>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <EnhancedButton
                          key={category}
                          variant="outline"
                          size="sm"
                          rounded="full"
                          className={cn(
                            "text-xs",
                            selectedCategory === category
                              ? "bg-primary-900/30 border-primary-500 text-white"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white",
                          )}
                          onClick={() => setSelectedCategory(category)}
                        >
                          {category}
                        </EnhancedButton>
                      ))}
                    </div>
                  </div>

                  {activeTab === "challenges" && (
                    <div>
                      <h3 className="text-sm font-medium text-zinc-400 mb-2">Difficulty</h3>
                      <div className="flex flex-wrap gap-2">
                        {difficultyLevels.map((level) => (
                          <EnhancedButton
                            key={level}
                            variant="outline"
                            size="sm"
                            rounded="full"
                            className={cn(
                              "text-xs",
                              selectedDifficulty === level
                                ? "bg-primary-900/30 border-primary-500 text-white"
                                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white",
                            )}
                            onClick={() => setSelectedDifficulty(level)}
                          >
                            {level}
                          </EnhancedButton>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Recent Searches */}
      <AnimatePresence>
        {!isSearching && !searchQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-6 max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Searches</h2>
              <EnhancedButton variant="link" className="text-primary-400 text-sm p-0 hover:text-primary-300">
                Clear All
              </EnhancedButton>
            </div>
            <div className="space-y-3">
              {recentSearches.map((search) => (
                <EnhancedCard key={search.id} variant="default" hover="lift" className="bg-zinc-900/50 border-zinc-800">
                  <EnhancedCardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-primary-900/30 rounded-full p-2 mr-3">
                          {search.type === "community" && <Users className="h-4 w-4 text-primary-400" />}
                          {search.type === "user" && <User className="h-4 w-4 text-primary-400" />}
                          {search.type === "skill" && <TrendingUp className="h-4 w-4 text-primary-400" />}
                        </div>
                        <div>
                          <div className="font-medium text-white">{search.query}</div>
                          <div className="text-xs text-zinc-400">Search • {search.timestamp}</div>
                        </div>
                      </div>
                      <EnhancedButton
                        variant="ghost"
                        size="icon"
                        rounded="full"
                        className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                        onClick={() => removeRecentSearch(search.id)}
                      >
                        <X className="h-4 w-4" />
                      </EnhancedButton>
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
              ))}
            </div>

            <Separator className="my-6 bg-zinc-800" />

            <div className="text-center">
              <EnhancedButton
                variant="gradient"
                rounded="full"
                animation="shimmer"
                onClick={() => router.push("/for-you")}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Discover Communities and People
              </EnhancedButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results */}
      <AnimatePresence>
        {(isSearching || searchQuery) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-6 max-w-4xl mx-auto"
          >
            {/* Loading State */}
            {isLoading ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-8 w-48 bg-zinc-800" />
                  <Skeleton className="h-8 w-24 bg-zinc-800" />
                </div>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full bg-zinc-800 rounded-xl" />
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">
                    {filteredResults.length > 0
                      ? `${filteredResults.length} Results for "${debouncedQuery}"`
                      : "No Results Found"}
                  </h2>
                  {filteredResults.length > 0 && (
                    <Badge variant="outline" className="bg-zinc-900 border-zinc-700">
                      {activeTab === "all" ? "All Categories" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </Badge>
                  )}
                </div>

                {filteredResults.length > 0 ? (
                  <div className="space-y-4">
                    {filteredResults.map((result, index) => (
                      <motion.div
                        key={`${result.type}-${result.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <EnhancedCard
                          variant="default"
                          hover="lift"
                          className="bg-zinc-900/50 border-zinc-800 overflow-hidden"
                        >
                          <EnhancedCardContent className="p-0">
                            {/* Community Result */}
                            {result.type === "community" && (
                              <div className="flex items-center gap-3 p-4">
                                <Avatar className="h-14 w-14 rounded-lg">
                                  <AvatarImage src={result.image || "/placeholder.svg?height=56&width=56"} />
                                  <AvatarFallback className="bg-zinc-800">{result.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className="font-medium truncate">{result.name}</div>
                                    {result.trending && (
                                      <Badge className="bg-primary-900/30 text-primary-400 border-primary-500/20">
                                        <TrendingUp className="h-3 w-3 mr-1" /> Trending
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                                    <span>{result.members.toLocaleString()} members</span>
                                    <span className="flex items-center">
                                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                                      {result.rating}
                                    </span>
                                    <span>{result.activeUsers}+ active today</span>
                                  </div>
                                  <div className="text-sm text-zinc-300 mt-2 line-clamp-2">{result.description}</div>
                                </div>
                                <EnhancedButton
                                  variant={joinedCommunities.includes(result.id) ? "outline" : "gradient"}
                                  size="sm"
                                  rounded="full"
                                  animation={joinedCommunities.includes(result.id) ? "none" : "shimmer"}
                                  className={
                                    joinedCommunities.includes(result.id)
                                      ? "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:border-primary-500/50"
                                      : ""
                                  }
                                  leftIcon={
                                    joinedCommunities.includes(result.id) ? (
                                      <CheckCircle className="h-3.5 w-3.5" />
                                    ) : (
                                      <Plus className="h-3.5 w-3.5" />
                                    )
                                  }
                                  onClick={() => toggleJoinCommunity(result.id)}
                                >
                                  {joinedCommunities.includes(result.id) ? "Joined" : "Join"}
                                </EnhancedButton>
                              </div>
                            )}

                            {/* User Result */}
                            {result.type === "user" && (
                              <div className="flex items-center gap-3 p-4">
                                <Avatar className="h-14 w-14">
                                  <AvatarImage src={result.image || "/placeholder.svg?height=56&width=56"} />
                                  <AvatarFallback className="bg-zinc-800">{result.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className="font-medium truncate">{result.name}</div>
                                    {result.verified && (
                                      <svg className="h-4 w-4 text-primary-500 fill-current" viewBox="0 0 24 24">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="text-xs text-zinc-400 mt-1">@{result.username}</div>
                                  <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                                    <span className="flex items-center">
                                      <Trophy className="h-3 w-3 text-primary-400 mr-1" />
                                      Level {result.level}
                                    </span>
                                    <span>{result.completedChallenges} challenges</span>
                                    <span>Joined {result.joinDate}</span>
                                  </div>
                                  <div className="text-sm text-zinc-300 mt-2 line-clamp-2">{result.bio}</div>
                                </div>
                                <EnhancedButton
                                  variant={followedUsers.includes(result.id) ? "outline" : "outline"}
                                  size="sm"
                                  rounded="full"
                                  className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:border-primary-500/50"
                                  leftIcon={
                                    followedUsers.includes(result.id) ? (
                                      <CheckCircle className="h-3.5 w-3.5" />
                                    ) : undefined
                                  }
                                  onClick={() => toggleFollowUser(result.id)}
                                >
                                  {followedUsers.includes(result.id) ? "Following" : "Follow"}
                                </EnhancedButton>
                              </div>
                            )}

                            {/* Challenge Result */}
                            {result.type === "challenge" && (
                              <div className="flex items-center gap-3 p-4">
                                <div className="h-14 w-14 rounded-lg overflow-hidden">
                                  <img
                                    src={result.image || "/placeholder.svg?height=56&width=56"}
                                    alt={result.title}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className="font-medium truncate">{result.title}</div>
                                    <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700">
                                      {result.difficulty}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                                    <span className="flex items-center">
                                      <Users className="h-3 w-3 mr-1" />
                                      {result.participants.toLocaleString()} participants
                                    </span>
                                    <span className="flex items-center">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      {result.duration}
                                    </span>
                                    <span className="flex items-center">
                                      <Zap className="h-3 w-3 text-primary-400 mr-1" />
                                      {result.xpReward} XP
                                    </span>
                                  </div>
                                  <div className="text-sm text-zinc-300 mt-2 line-clamp-2">{result.description}</div>
                                  <div className="mt-2">
                                    <div className="text-xs text-zinc-400 mb-1">
                                      Completion Rate: {result.completionRate}%
                                    </div>
                                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                                        style={{ width: `${result.completionRate}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                                <EnhancedButton variant="gradient" size="sm" rounded="full" animation="shimmer">
                                  Join Challenge
                                </EnhancedButton>
                              </div>
                            )}

                            {/* Mentor Result */}
                            {result.type === "mentor" && (
                              <div className="flex items-center gap-3 p-4">
                                <Avatar className="h-14 w-14">
                                  <AvatarImage src={result.image || "/placeholder.svg?height=56&width=56"} />
                                  <AvatarFallback className="bg-zinc-800">{result.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className="font-medium truncate">{result.name}</div>
                                    {result.verified && (
                                      <svg className="h-4 w-4 text-primary-500 fill-current" viewBox="0 0 24 24">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="text-xs text-zinc-400 mt-1">{result.specialty}</div>
                                  <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                                    <span className="flex items-center">
                                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                                      {result.rating} ({result.reviews} reviews)
                                    </span>
                                    <span>{result.hourlyRate}/hour</span>
                                    <Badge
                                      className={cn(
                                        "text-xs",
                                        result.availability === "High"
                                          ? "bg-green-900/30 text-green-400 border-green-500/20"
                                          : "bg-yellow-900/30 text-yellow-400 border-yellow-500/20",
                                      )}
                                    >
                                      {result.availability} Availability
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-zinc-300 mt-2 line-clamp-2">{result.bio}</div>
                                </div>
                                <EnhancedButton variant="gradient" size="sm" rounded="full" animation="shimmer">
                                  Book Session
                                </EnhancedButton>
                              </div>
                            )}
                          </EnhancedCardContent>
                        </EnhancedCard>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8 bg-zinc-900/30 rounded-xl border border-zinc-800 p-6"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 mb-4">
                      <Search className="h-8 w-8 text-zinc-400" />
                    </div>
                    <div className="text-zinc-300 text-lg mb-2">No results found for "{debouncedQuery}"</div>
                    <div className="text-sm text-zinc-500 mb-4">Try different keywords or browse suggestions below</div>

                    <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto mt-4">
                      {["fitness", "productivity", "meditation", "career growth", "financial planning"].map(
                        (suggestion) => (
                          <EnhancedButton
                            key={suggestion}
                            variant="outline"
                            size="sm"
                            rounded="full"
                            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                            onClick={() => {
                              setSearchQuery(suggestion)
                              setIsSearching(true)
                            }}
                          >
                            {suggestion}
                          </EnhancedButton>
                        ),
                      )}
                    </div>

                    <EnhancedButton
                      variant="outline"
                      rounded="full"
                      className="mt-6 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:border-primary-500/50"
                      onClick={clearSearch}
                    >
                      Clear Search
                    </EnhancedButton>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  )
}

