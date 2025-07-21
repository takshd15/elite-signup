"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
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
  MapPin,
  Briefcase,
  GraduationCap,
  Building,
  Target,
  Award,
  MessageCircle,
  Send,
  UserPlus,
  Hash,
  Clock,
  Verified,
  ChevronDown,
  SlidersHorizontal,
  Eye,
  Heart,
  Share2,
  Bookmark,
  Sparkles,
  Brain,
  TrendingDown,
  Link,
  Copy,
  ExternalLink,
  MessageSquare,
  Phone,
  Video,
  MoreHorizontal,
  Settings,
  Bell,
  BellOff,
  Save,
  Download,
  Upload,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  Lightbulb,
  Compass,
  Network,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Flame,
  Crown,
  Shield,
  Rocket,
  Globe,
  Flag,
  Mail,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

import { AppShell } from "@/components/layout/app-shell"
import { Input } from "@/components/ui/input"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from "@/components/ui/enhanced-card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

// Enhanced mock data with richer content
const users = [
  {
    id: 1,
    name: "Alex Johnson",
    username: "alex_improvement",
    bio: "Harvard CS '25 | Google SWE Intern | Building AI for Social Good | 4.0 GPA | Published Researcher",
    profileImage: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces",
    coverImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=200&fit=crop",
    following: false,
    verified: true,
    level: 42,
    score: 3247,
    xp: 18750,
    university: "Harvard University",
    major: "Computer Science",
    year: "Senior",
    location: "Cambridge, MA",
    hometown: "San Francisco, CA",
    connections: 1247,
    joinDate: "2 years ago",
    skills: ["Machine Learning", "Python", "React", "Leadership", "Research", "AI Ethics"],
    achievements: ["Dean's List (4 semesters)", "Best Paper Award - ICML 2024", "Google CodeU Winner", "Harvard Innovation Lab Fellow"],
    dreamJob: "Principal AI Engineer at OpenAI",
    currentRole: "Research Assistant at MIT CSAIL",
    previousRoles: ["SWE Intern at Google", "TA for CS50"],
    gpa: "4.0/4.0",
    activities: ["ACM President", "Harvard Debate Team", "Volunteer at Code.org"],
    lastActive: "2 hours ago",
    mutualConnections: 23,
    posts: 156,
    engagement: "Very High",
    languages: ["English (Native)", "Spanish (Fluent)", "Mandarin (Conversational)"],
    interests: ["AI Safety", "Sustainable Tech", "Education Reform"],
    personalityType: "ENTJ",
    availability: "Open to collaboration",
    responseRate: "95%",
    avgResponseTime: "2 hours",
    endorsements: 87,
    recommendations: 12,
    coursework: ["Advanced Algorithms", "Machine Learning", "Computer Vision", "Ethics in AI"],
    projects: ["AI Tutoring System", "Climate Change Predictor", "Social Impact Tracker"],
    publications: ["Deep Learning for Social Good - ICML 2024", "Ethical AI Framework - NeurIPS Workshop"],
    certifications: ["AWS ML Specialist", "Google Cloud Professional", "Deep Learning Specialization"],
    socialImpact: "Founded nonprofit teaching coding to underprivileged youth",
    funFacts: ["Speaks 3 languages", "Marathon runner", "Chess enthusiast"],
    mentorshipOffering: ["Career advice", "Technical interview prep", "Research guidance"],
    seekingMentorship: ["Startup advice", "Industry connections"],
    workStyle: ["Remote-friendly", "Collaborative", "Detail-oriented"],
    careerGoals: ["Lead AI research team", "Start social impact startup", "Become CS professor"],
  },
  // Add more enhanced user profiles...
  {
    id: 2,
    name: "Sarah Chen",
    username: "sarah_stanford_mba",
    bio: "Stanford MBA '25 | Ex-McKinsey | Building the Future of FinTech | Venture Capital Enthusiast",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
    coverImage: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=200&fit=crop",
    following: true,
    verified: true,
    level: 45,
    score: 3456,
    xp: 21200,
    university: "Stanford Graduate School of Business",
    major: "MBA - Entrepreneurship & Innovation",
    year: "Second Year",
    location: "Palo Alto, CA",
    hometown: "New York, NY",
    connections: 1890,
    joinDate: "3 years ago",
    skills: ["Strategic Consulting", "Venture Capital", "Financial Modeling", "Leadership", "Product Strategy", "Market Analysis"],
    achievements: ["McKinsey Top 10% Performer", "Stanford Venture Capital Fellow", "Case Competition Winner", "Forbes 30 Under 30 Nominee"],
    dreamJob: "Partner at Andreessen Horowitz",
    currentRole: "MBA Candidate & VC Intern at Kleiner Perkins",
    previousRoles: ["Senior Business Analyst at McKinsey", "Product Manager at Stripe", "Investment Banking Analyst at Goldman Sachs"],
    gpa: "3.9/4.0",
    activities: ["Stanford Venture Capital Club VP", "Women in Business Co-President", "Entrepreneurship Competition Judge"],
    lastActive: "1 hour ago",
    mutualConnections: 45,
    posts: 234,
    engagement: "Very High",
    languages: ["English (Native)", "Mandarin (Native)", "French (Conversational)"],
    interests: ["FinTech Innovation", "Women in Leadership", "Sustainable Investing"],
    personalityType: "ENFJ",
    availability: "Open to networking",
    responseRate: "98%",
    avgResponseTime: "30 minutes",
    endorsements: 156,
    recommendations: 28,
    coursework: ["Venture Capital & Private Equity", "Strategic Management", "Entrepreneurial Finance", "Data-Driven Marketing"],
    projects: ["FinTech Market Analysis", "Women-Led Startup Database", "Impact Investing Framework"],
    publications: ["The Future of FinTech - Stanford Business Review", "Women in VC: Breaking Barriers"],
    certifications: ["CFA Level 2", "Google Analytics Certified", "Bloomberg Market Concepts"],
    socialImpact: "Mentor for female entrepreneurs through Stanford Women's Program",
    funFacts: ["Traveled to 30+ countries", "Competitive tennis player", "Wine enthusiast"],
    mentorshipOffering: ["Business strategy", "VC networking", "Career transitions", "Leadership development"],
    seekingMentorship: ["Board governance", "Late-stage investing"],
    workStyle: ["Results-driven", "Collaborative", "Data-oriented"],
    careerGoals: ["Become VC partner", "Launch impact fund", "Join corporate board"],
  },
]

const communities = [
  {
    id: 1,
    name: "Harvard Computer Science Network",
    members: 3247,
    category: "University",
    description: "Elite network of Harvard CS students and alumni. Share internship opportunities, collaborate on research, and build lifelong connections in tech.",
    image: "https://images.unsplash.com/photo-1562774053-701939374585?w=150&h=150&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=200&fit=crop",
    joined: false,
    trending: true,
    rating: 4.9,
    activeUsers: 892,
    postsPerWeek: 127,
    moderators: ["Alex Johnson", "Emma Davis", "Prof. David Malan"],
    requirements: "Current Harvard CS student or alumni",
    topics: ["Algorithms", "AI/ML", "Systems", "Theory", "Industry Insights", "Research"],
    level: "University",
    privacy: "Private",
    establishedDate: "2019",
    rules: ["Be respectful", "No spam", "Academic integrity", "Help others"],
    events: ["Weekly coding challenges", "Industry speaker series", "Mock interviews", "Research presentations"],
    partnerships: ["Google", "Microsoft", "Meta", "Apple"],
    averageScore: 3100,
    topContributors: ["Alex Johnson", "Michael Zhang", "Priya Patel"],
    recentAchievements: ["500+ successful internship placements", "50+ research publications", "25+ startup launches"],
    meetupFrequency: "Weekly",
    onlineActivity: "Daily",
    exclusivity: "High",
    networkValue: "Premium",
    alumniNetwork: "5000+ in top tech companies",
    mentorshipProgram: true,
    careerSupport: "Industry connections, resume reviews, interview prep",
    academicSupport: "Study groups, research collaborations, course recommendations",
  },
  {
    id: 2,
    name: "Future FAANG Engineers",
    members: 15678,
    category: "Career",
    description: "The ultimate community for aspiring software engineers targeting Facebook, Apple, Amazon, Netflix, Google. Interview prep, coding challenges, and insider insights.",
    image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=150&h=150&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=200&fit=crop",
    joined: true,
    trending: true,
    rating: 4.8,
    activeUsers: 3456,
    postsPerWeek: 445,
    moderators: ["Current FAANG Engineers", "Ex-Googler Sarah", "Meta Staff Engineer John"],
    requirements: "CS student or professional, active participation",
    topics: ["System Design", "Data Structures & Algorithms", "Behavioral Interviews", "Salary Negotiation", "Career Growth"],
    level: "All Levels",
    privacy: "Public",
    establishedDate: "2020",
    rules: ["Quality over quantity", "Help fellow engineers", "Share authentic experiences", "No self-promotion"],
    events: ["Daily coding challenges", "Mock interview sessions", "Industry AMA", "Salary transparency discussions"],
    partnerships: ["LeetCode", "Pramp", "InterviewBit", "Blind"],
    averageScore: 2800,
    topContributors: ["SeniorSWE@Google", "StaffEng@Meta", "L6@Amazon"],
    recentAchievements: ["10,000+ successful hires", "95% interview success rate", "500+ salary bumps"],
    meetupFrequency: "Bi-weekly",
    onlineActivity: "24/7",
    exclusivity: "Medium",
    networkValue: "High",
    alumniNetwork: "25,000+ at top tech companies",
    mentorshipProgram: true,
    careerSupport: "Referrals, interview prep, salary negotiation, career planning",
    academicSupport: "Algorithm practice, system design tutorials, coding bootcamps",
  },
]

const companies = [
  {
    id: 1,
    name: "Google",
    logo: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=150&h=150&fit=crop",
    industry: "Technology",
    size: "156,000+",
    location: "Mountain View, CA",
    description: "Organize the world's information and make it universally accessible and useful. Join us in building products that help billions of people.",
    employees: 1247,
    averageScore: 3234,
    topRoles: ["Software Engineer", "Product Manager", "Data Scientist", "UX Designer", "Research Scientist"],
    hiringSeasons: ["Year-round", "Peak: Summer, Fall"],
    requirements: "Top-tier university, 3.5+ GPA, strong technical skills",
    culture: ["Innovation", "Collaboration", "Impact", "Learning", "Diversity"],
    benefits: ["Health & Wellness", "Stock Options", "Free Food", "20% Time", "Learning Budget"],
    recentHires: 156,
    trending: true,
    founded: "1998",
    revenue: "$282.8B",
    stockSymbol: "GOOGL",
    headquarters: "Googleplex, Mountain View",
    offices: "70+ countries",
    missionStatement: "To organize the world's information and make it universally accessible and useful",
    values: ["Focus on the user", "Democracy on the web", "Great just isn't good enough"],
    workLifeBalance: 4.2,
    diversityScore: 4.1,
    innovationRating: 4.8,
    careerGrowth: 4.3,
    compensation: 4.7,
    interviewProcess: ["Phone Screen", "Technical Phone", "Onsite (4-5 rounds)", "Team Matching"],
    averageInterviewTime: "4-6 weeks",
    acceptanceRate: "0.2%",
    internshipPrograms: ["STEP", "Software Engineering Intern", "Product Management Intern"],
    newGradPrograms: ["Software Engineer", "Associate Product Manager"],
    remotePolicy: "Hybrid (3 days in office)",
    patentPortfolio: "100,000+ patents",
    researchAreas: ["AI/ML", "Quantum Computing", "Cloud Technology", "Autonomous Vehicles"],
    socialImpact: ["AI for Social Good", "Digital Skills Training", "Environmental Sustainability"],
    partnerUniversities: ["Stanford", "MIT", "Carnegie Mellon", "UC Berkeley", "Harvard"],
  },
]

const universities = [
  {
    id: 1,
    name: "Harvard University",
    logo: "https://images.unsplash.com/photo-1562774053-701939374585?w=150&h=150&fit=crop",
    location: "Cambridge, MA",
    ranking: 1,
    acceptance: "3.4%",
    students: 1647,
    averageScore: 3445,
    avgSAT: "1520-1580",
    avgGPA: "4.18",
    topMajors: ["Economics", "Computer Science", "Government", "Psychology", "Biology"],
    culture: ["Academic Excellence", "Leadership", "Innovation", "Service", "Tradition"],
    notableAlumni: ["Barack Obama", "Mark Zuckerberg", "Bill Gates", "Natalie Portman", "Conan O'Brien"],
    recentAdmits: 47,
    trending: true,
    founded: "1636",
    endowment: "$53.2B",
    studentFacultyRatio: "6:1",
    campusSize: "5,076 acres",
    tuition: "$54,002",
    financialAid: "100% of need met",
    graduationRate: "98%",
    employmentRate: "95% within 6 months",
    averageStartingSalary: "$75,000",
    researchFunding: "$900M annually",
    librarySystem: "17 million books",
    studyAbroadPrograms: "100+ countries",
    schoolsAndColleges: ["Harvard College", "Medical School", "Law School", "Business School", "Kennedy School"],
    admissionRequirements: ["SAT/ACT", "Essays", "Recommendations", "Extracurriculars", "Interview"],
    applicationDeadline: "January 1",
    earlyDecision: "November 1",
    internationalStudents: "25%",
    diversityStats: "50% students of color",
    campusLife: ["350+ student organizations", "42 varsity sports", "12 residential houses"],
    careerServices: ["Career counseling", "Job search support", "Alumni network", "Internship programs"],
    researchOpportunities: ["Undergraduate research", "Independent study", "Faculty mentorship"],
    competitivePrograms: ["Rhodes Scholarship", "Fulbright", "Marshall Scholarship"],
  },
]

// AI-powered recommendation engine (mock)
const getAIRecommendations = (userProfile: any, searchHistory: string[]) => {
  return [
    {
      type: "person",
      reason: "Similar academic background and career goals",
      confidence: 95,
      item: users[0],
    },
    {
      type: "community",
      reason: "Matches your interests in AI and machine learning",
      confidence: 88,
      item: communities[0],
    },
    {
      type: "opportunity",
      reason: "Perfect fit for your skills and experience level",
      confidence: 92,
      title: "Google AI Residency Program",
      description: "1-year program for aspiring AI researchers",
      deadline: "March 15, 2024",
    },
  ]
}

// Advanced search suggestions with context
const getContextualSuggestions = (query: string, userContext: any) => {
  const baseSuggestions = [
    "Harvard computer science students",
    "Google software engineers",
    "Stanford MBA candidates",
    "Machine learning researchers",
    "Venture capital interns",
    "McKinsey consultants",
    "Y Combinator alumni",
    "MIT artificial intelligence",
  ]
  
  // Add contextual suggestions based on user's profile
  if (userContext?.university === "Harvard") {
    baseSuggestions.unshift("Harvard alumni at Google", "Harvard CS research opportunities")
  }
  
  return baseSuggestions
    .filter(s => s.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8)
}

export default function EnhancedSearchImplementation() {
  const router = useRouter()
  
  // Core search state
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState("all")
  
  // Advanced features state
  const [showSavedSearches, setShowSavedSearches] = useState(false)
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null)
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatPartnerId, setChatPartnerId] = useState<number | null>(null)
  const [searchAnalytics, setSearchAnalytics] = useState(true)
  const [realTimeNotifications, setRealTimeNotifications] = useState(true)
  
  // Search enhancement state
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [sortBy, setSortBy] = useState("relevance")
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [savedSearches, setSavedSearches] = useState<any[]>([])
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([])
  
  // User interaction state
  const [followedUsers, setFollowedUsers] = useState<number[]>([])
  const [joinedCommunities, setJoinedCommunities] = useState<number[]>([])
  const [bookmarkedPosts, setBookmarkedPosts] = useState<number[]>([])
  const [likedPosts, setLikedPosts] = useState<number[]>([])
  const [viewedProfiles, setViewedProfiles] = useState<number[]>([])
  
  // Performance and UX state
  const [performanceMode, setPerformanceMode] = useState(false)
  const [accessibility, setAccessibility] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  
  // Filter state
  const [filters, setFilters] = useState({
    location: "All Locations",
    university: "All Universities", 
    major: "All Majors",
    year: "All Years",
    score: "All Scores",
    company: "All Companies",
    availability: "All",
    verified: false,
    hasProfile: false,
    recentlyActive: false,
  })

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Enhanced search categories with analytics
  const searchCategories = [
    { id: "all", label: "All", icon: Search, count: 0 },
    { id: "people", label: "People", icon: User, count: users.length },
    { id: "communities", label: "Communities", icon: Users, count: communities.length },
    { id: "companies", label: "Companies", icon: Building, count: companies.length },
    { id: "universities", label: "Universities", icon: GraduationCap, count: universities.length },
    { id: "opportunities", label: "Opportunities", icon: Rocket, count: 15 },
  ]

  // Performance optimizations
  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }, [])

  const debouncedSearch = useCallback(
    debounce((query: string) => setDebouncedQuery(query), 300),
    []
  )

  // Enhanced search logic with AI insights
  const searchResults = useMemo(() => {
    if (!debouncedQuery) return { people: [], communities: [], companies: [], universities: [], opportunities: [], events: [] }

    const query = debouncedQuery.toLowerCase()
    
    // Enhanced people filtering with semantic search
    let filteredPeople = users.filter(user => {
      const textMatch = [
        user.name, user.bio, user.university, user.major, user.currentRole,
        ...user.skills, ...user.interests, ...user.achievements
      ].some(field => field?.toLowerCase().includes(query))
      
      // Apply advanced filters
      let passesFilters = true
      
      if (filters.location !== "All Locations") {
        passesFilters = passesFilters && user.location.includes(filters.location.split(",")[0])
      }
      if (filters.university !== "All Universities") {
        passesFilters = passesFilters && user.university.toLowerCase().includes(filters.university.toLowerCase())
      }
      if (filters.verified) {
        passesFilters = passesFilters && user.verified
      }
      if (filters.recentlyActive) {
        passesFilters = passesFilters && ["Online", "2 hours ago", "1 hour ago", "30 minutes ago"].includes(user.lastActive)
      }
      
      return textMatch && passesFilters
    })

    // Enhanced community filtering
    const filteredCommunities = communities.filter(community => {
      return [
        community.name, community.description, community.category,
        ...(community.topics || []), ...((community && "culture" in community && Array.isArray((community as any).culture)) ? (community as any).culture : [])
      ].some(field => field?.toLowerCase().includes(query))
    })

    // Enhanced company filtering
    const filteredCompanies = companies.filter(company => {
      return [
        company.name, company.industry, company.description,
        ...(company.topRoles || []), ...((company && "culture" in company && Array.isArray((company as any).culture)) ? (company as any).culture : [])
      ].some(field => field?.toLowerCase().includes(query))
    })

    // Enhanced university filtering
    const filteredUniversities = universities.filter(university => {
      return [
        university.name, university.location,
        ...(university.topMajors || []), ...((university && "culture" in university && Array.isArray((university as any).culture)) ? (university as any).culture : [])
      ].some(field => field?.toLowerCase().includes(query))
    })

    // Mock opportunities and events
    const opportunities = [
      { id: 1, title: "Google AI Residency 2024", company: "Google", type: "Research", deadline: "Mar 15", score: 3000 },
      { id: 2, title: "Harvard Innovation Lab Fellow", company: "Harvard", type: "Fellowship", deadline: "Apr 1", score: 2800 },
    ].filter(opp => opp.title.toLowerCase().includes(query))

    const events = [
      { id: 1, title: "Stanford AI Conference 2024", date: "Feb 20", location: "Palo Alto", attendees: 500 },
      { id: 2, title: "Harvard Tech Career Fair", date: "Mar 5", location: "Cambridge", attendees: 200 },
    ].filter(event => event.title.toLowerCase().includes(query))

    // Sort results based on selection
    const sortResults = (items: any[], type: string) => {
      switch (sortBy) {
        case "score":
          return items.sort((a, b) => (b.score || b.averageScore || 0) - (a.score || a.averageScore || 0))
        case "recent":
          return items.sort((a, b) => new Date(b.lastActive || b.timestamp || 0).getTime() - new Date(a.lastActive || a.timestamp || 0).getTime())
        case "connections":
          return items.sort((a, b) => (b.connections || b.members || 0) - (a.connections || a.members || 0))
        case "relevance":
        default:
          return items
      }
    }

    return {
      people: sortResults(filteredPeople, "people"),
      communities: sortResults(filteredCommunities, "communities"),
      companies: sortResults(filteredCompanies, "companies"),
      universities: sortResults(filteredUniversities, "universities"),
      opportunities: sortResults(opportunities, "opportunities"),
      events: sortResults(events, "events"),
    }
  }, [debouncedQuery, filters, sortBy])

  // Get current results based on active category
  const getCurrentResults = () => {
    if (activeCategory === "all") {
      return [
        ...searchResults.people.map(item => ({ ...item, type: "people" })),
        ...searchResults.communities.map(item => ({ ...item, type: "communities" })),
        ...searchResults.companies.map(item => ({ ...item, type: "companies" })),
        ...searchResults.universities.map(item => ({ ...item, type: "universities" })),
        ...searchResults.opportunities.map(item => ({ ...item, type: "opportunities" })),
        ...searchResults.events.map(item => ({ ...item, type: "events" })),
      ].slice(0, 20) // Limit for performance
    }
    return searchResults[activeCategory as keyof typeof searchResults]?.map(item => ({ ...item, type: activeCategory })) || []
  }

  const currentResults = getCurrentResults()

  // Enhanced search handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setIsSearching(value.length > 0)
    debouncedSearch(value)
    
    // Generate contextual suggestions
    if (value.length >= 2) {
      const contextualSuggestions = getContextualSuggestions(value, { university: "Harvard" })
      setSuggestions(contextualSuggestions)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      // Add to search history
      setSearchHistory(prev => [searchQuery, ...prev.filter(q => q !== searchQuery)].slice(0, 10))
      
      // Track search analytics
      if (searchAnalytics) {
        console.log("Search analytics:", { query: searchQuery, timestamp: new Date(), results: currentResults.length })
      }
    }
  }

  const saveCurrentSearch = () => {
    const searchData = {
      id: Date.now(),
      query: searchQuery,
      filters: { ...filters },
      category: activeCategory,
      resultCount: currentResults.length,
      timestamp: new Date().toISOString(),
    }
    setSavedSearches(prev => [searchData, ...prev])
  }

  // Load AI recommendations
  useEffect(() => {
    if (isSearching) {
      const recommendations = getAIRecommendations({ university: "Harvard" }, searchHistory)
      setAiRecommendations(recommendations)
    }
  }, [isSearching, searchHistory])

  // Enhanced interaction handlers
  const openProfileModal = (userId: number) => {
    setSelectedProfileId(userId)
    setViewedProfiles(prev => [...prev, userId])
  }

  const startChat = (userId: number) => {
    setChatPartnerId(userId)
    setShowChatModal(true)
  }

  const toggleFollow = (userId: number) => {
    setFollowedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  // Performance monitoring
  useEffect(() => {
    if (performanceMode) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          console.log("Performance:", entry.name, entry.duration)
        })
      })
      observer.observe({ entryTypes: ['measure'] })
      
      return () => observer.disconnect()
    }
  }, [performanceMode])

  return (
    <AppShell title="Advanced Search">
      <TooltipProvider>
        {/* Enhanced Background with Better Performance */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-radial from-blue-500/20 via-purple-700/15 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -left-24 w-72 h-72 bg-gradient-radial from-purple-700/20 via-pink-600/15 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-gradient-radial from-fuchsia-500/15 via-blue-600/10 to-transparent rounded-full blur-3xl animate-pulse delay-2000" />
        </div>

        <div className="relative z-10">
          {/* Advanced Search Header */}
          <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-blue-700/30 shadow-[0_0_32px_0_rgba(80,0,255,0.3)]">
            <div className="max-w-7xl mx-auto px-4 py-6">
              {/* Main Search Bar with AI Enhancement */}
              <div className="relative">
                <div className={cn(
                  "relative flex items-center transition-all duration-300",
                  searchFocused ? "scale-[1.02]" : "scale-100"
                )}>
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400">
                    <Search className={cn(
                      "transition-all duration-300",
                      searchFocused ? "h-5 w-5 text-blue-400" : "h-5 w-5"
                    )} />
                  </div>
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search for people, communities, opportunities..."
                    className={cn(
                      "pl-12 pr-32 py-4 h-16 bg-zinc-900/80 border text-white rounded-xl shadow-lg transition-all duration-300 text-lg",
                      searchFocused
                        ? "border-blue-500 ring-2 ring-blue-500/20 shadow-[0_0_24px_0_rgba(80,0,255,0.3)]"
                        : "border-blue-700/40 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                    )}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                  />
                  
                  {/* Advanced search controls */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    {searchQuery && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <EnhancedButton
                            variant="ghost"
                            size="icon"
                            rounded="full"
                            className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                            onClick={saveCurrentSearch}
                          >
                            <Save className="h-4 w-4" />
                          </EnhancedButton>
                        </TooltipTrigger>
                        <TooltipContent>Save Search</TooltipContent>
                      </Tooltip>
                    )}
                    
                    {searchQuery && (
                      <EnhancedButton
                        variant="ghost"
                        size="icon"
                        rounded="full"
                        className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                        onClick={() => {
                          setSearchQuery("")
                          setIsSearching(false)
                          setShowSuggestions(false)
                        }}
                      >
                        <X className="h-5 w-5" />
                      </EnhancedButton>
                    )}
                  </div>
                </div>

                {/* Enhanced Search Suggestions */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-30 mt-3 w-full bg-zinc-900/95 border border-blue-700/40 rounded-xl shadow-[0_0_32px_0_rgba(80,0,255,0.3)] backdrop-blur-xl overflow-hidden"
                    >
                      <div className="p-2">
                        <div className="text-xs text-zinc-400 px-4 py-2 flex items-center gap-2">
                          <Sparkles className="h-3 w-3" />
                          Suggested searches
                        </div>
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            className="w-full text-left px-4 py-3 hover:bg-zinc-800/80 rounded-lg flex items-center gap-3 transition-colors group"
                            onClick={() => {
                              setSearchQuery(suggestion)
                              setShowSuggestions(false)
                              setIsSearching(true)
                            }}
                          >
                            <Search className="h-4 w-4 text-blue-400 group-hover:text-blue-300" />
                            <span className="text-white font-medium">{suggestion}</span>
                            <ArrowRight className="h-3 w-3 text-zinc-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Enhanced Category Tabs */}
              <AnimatePresence>
                {isSearching && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-6"
                  >
                    <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                      <TabsList className="grid grid-cols-7 bg-zinc-900/80 border border-blue-700/30 p-1 rounded-xl shadow-[0_0_16px_0_rgba(80,0,255,0.2)]">
                        {searchCategories.map((category) => (
                          <TabsTrigger
                            key={category.id}
                            value={category.id}
                            className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 data-[state=active]:border data-[state=active]:border-blue-500/30 data-[state=active]:shadow-[0_0_8px_0_rgba(59,130,246,0.3)] text-white font-medium rounded-lg transition-all relative"
                          >
                            <category.icon className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">{category.label}</span>
                            {category.count > 0 && (
                              <Badge className="ml-1 h-4 px-1 text-[10px] bg-zinc-700 text-zinc-300">
                                {category.count}
                              </Badge>
                            )}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Advanced Controls */}
              <AnimatePresence>
                {isSearching && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 flex flex-wrap gap-3 items-center justify-between"
                  >
                    <div className="flex flex-wrap gap-3 items-center">
                      <EnhancedButton
                        variant="outline"
                        size="sm"
                        rounded="full"
                        className={cn(
                          "bg-zinc-900/80 border-blue-700/40 text-white hover:bg-zinc-800 hover:border-blue-600/50 shadow-[0_0_8px_0_rgba(80,0,255,0.2)]",
                          showSavedSearches && "border-blue-500 bg-blue-900/20"
                        )}
                        leftIcon={<SlidersHorizontal className="h-3 w-3" />}
                        onClick={() => setShowSavedSearches(!showSavedSearches)}
                      >
                        Saved Searches
                      </EnhancedButton>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-300 text-sm font-medium">Sort:</span>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="bg-zinc-900/80 border border-blue-700/40 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-[0_0_8px_0_rgba(80,0,255,0.2)]"
                        >
                          <option value="relevance">Most Relevant</option>
                          <option value="score">Highest Score</option>
                          <option value="recent">Most Recent</option>
                          <option value="connections">Most Connected</option>
                        </select>
                      </div>

                      {currentResults.length > 0 && (
                        <Badge className="bg-blue-900/50 text-blue-300 border-blue-800">
                          {currentResults.length} result{currentResults.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI Insights Panel */}
              <AnimatePresence>
                {showSavedSearches && isSearching && aiRecommendations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 overflow-hidden bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-700/40 rounded-xl p-6 shadow-[0_0_24px_0_rgba(147,51,234,0.3)]"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className="h-5 w-5 text-purple-400" />
                      <h3 className="text-lg font-bold text-white">AI-Powered Insights</h3>
                      <Badge className="bg-purple-900/50 text-purple-300 border-purple-800">BETA</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {aiRecommendations.map((rec, index) => (
                        <EnhancedCard key={index} className="bg-zinc-900/60 border border-purple-700/30">
                          <EnhancedCardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="h-4 w-4 text-purple-400" />
                              <Badge className="bg-purple-900/30 text-purple-300 text-xs">
                                {rec.confidence}% match
                              </Badge>
                            </div>
                            <p className="text-sm text-zinc-300 mb-3">{rec.reason}</p>
                            {rec.type === "opportunity" && (
                              <div>
                                <h4 className="font-medium text-white text-sm">{rec.title}</h4>
                                <p className="text-xs text-zinc-400">{rec.description}</p>
                              </div>
                            )}
                          </EnhancedCardContent>
                        </EnhancedCard>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Enhanced Search Results */}
          <div className="max-w-7xl mx-auto px-4 py-8">
            {!isSearching ? (
              // Enhanced Landing State
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12"
              >
                {/* Hero Section */}
                <div className="text-center space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <h1 className="text-4xl md:text-6xl font-extrabold">
                      <span className="bg-gradient-to-r from-[#2bbcff] via-[#a259ff] to-[#ff6b9d] bg-clip-text text-transparent">
                        Discover Your Path
                      </span>
                    </h1>
                    <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
                      Connect with peers, explore opportunities, and learn from those who've achieved your goals
                    </p>
                  </motion.div>

                  <div className="flex flex-wrap justify-center gap-3">
                    {["harvard students", "google engineers", "stanford mba", "ai researchers"].map((term, index) => (
                      <motion.div
                        key={term}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <EnhancedButton
                          variant="outline"
                          size="sm"
                          rounded="full"
                          className="bg-zinc-900/60 border-blue-700/30 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-blue-500/50 transition-all"
                          onClick={() => {
                            setSearchQuery(term)
                            setIsSearching(true)
                          }}
                        >
                          {term}
                        </EnhancedButton>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Trending & Analytics Dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Trending Communities */}
                  <EnhancedCard className="bg-zinc-900/80 border border-blue-700/40 shadow-[0_0_16px_0_rgba(80,0,255,0.3)]">
                    <EnhancedCardHeader>
                      <EnhancedCardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-400" />
                        <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">
                          Trending Communities
                        </span>
                      </EnhancedCardTitle>
                    </EnhancedCardHeader>
                    <EnhancedCardContent className="space-y-4">
                      {communities.slice(0, 3).map((community, index) => (
                        <motion.div
                          key={community.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSearchQuery(community.name)
                            setIsSearching(true)
                          }}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={community.image} />
                            <AvatarFallback className="bg-zinc-800">{community.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white text-sm truncate">{community.name}</div>
                            <div className="text-xs text-zinc-400">{community.members.toLocaleString()} members</div>
                          </div>
                          {community.trending && (
                            <Badge className="bg-green-900/30 text-green-400 border-green-700/40 text-xs">
                              <Flame className="h-3 w-3" />
                            </Badge>
                          )}
                        </motion.div>
                      ))}
                    </EnhancedCardContent>
                  </EnhancedCard>

                  {/* Top Performers */}
                  <EnhancedCard className="bg-zinc-900/80 border border-purple-700/40 shadow-[0_0_16px_0_rgba(147,51,234,0.3)]">
                    <EnhancedCardHeader>
                      <EnhancedCardTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-purple-400" />
                        <span className="bg-gradient-to-r from-[#a259ff] to-[#ff6b9d] bg-clip-text text-transparent font-extrabold">
                          Top Performers
                        </span>
                      </EnhancedCardTitle>
                    </EnhancedCardHeader>
                    <EnhancedCardContent className="space-y-4">
                      {users.slice(0, 3).map((user, index) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer"
                          onClick={() => openProfileModal(user.id)}
                        >
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.profileImage} />
                              <AvatarFallback className="bg-zinc-800">{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className={cn(
                              "absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center",
                              index === 0 ? "bg-yellow-500 text-black" : 
                              index === 1 ? "bg-gray-400 text-black" : "bg-orange-500 text-black"
                            )}>
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white text-sm truncate flex items-center gap-1">
                              {user.name}
                              {user.verified && <Verified className="h-3 w-3 text-blue-400 fill-current" />}
                            </div>
                            <div className="text-xs text-zinc-400">Score: {user.score.toLocaleString()}</div>
                          </div>
                          <Progress value={(user.score / 4000) * 100} className="w-16 h-2" />
                        </motion.div>
                      ))}
                    </EnhancedCardContent>
                  </EnhancedCard>

                  {/* Quick Actions */}
                  <EnhancedCard className="bg-zinc-900/80 border border-fuchsia-700/40 shadow-[0_0_16px_0_rgba(217,70,239,0.3)]">
                    <EnhancedCardHeader>
                      <EnhancedCardTitle className="flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-fuchsia-400" />
                        <span className="bg-gradient-to-r from-[#ff6b9d] to-[#ffd93d] bg-clip-text text-transparent font-extrabold">
                          Quick Actions
                        </span>
                      </EnhancedCardTitle>
                    </EnhancedCardHeader>
                    <EnhancedCardContent className="space-y-3">
                      <EnhancedButton
                        variant="outline"
                        size="sm"
                        className="w-full justify-start bg-zinc-800/60 border-blue-700/30 text-white hover:bg-zinc-700"
                        leftIcon={<Users className="h-4 w-4" />}
                        onClick={() => {
                          setSearchQuery("Harvard students")
                          setIsSearching(true)
                        }}
                      >
                        Find Harvard Students
                      </EnhancedButton>
                      <EnhancedButton
                        variant="outline"
                        size="sm"
                        className="w-full justify-start bg-zinc-800/60 border-purple-700/30 text-white hover:bg-zinc-700"
                        leftIcon={<Building className="h-4 w-4" />}
                        onClick={() => {
                          setSearchQuery("Google employees")
                          setIsSearching(true)
                        }}
                      >
                        Explore Google Network
                      </EnhancedButton>
                      <EnhancedButton
                        variant="outline"
                        size="sm"
                        className="w-full justify-start bg-zinc-800/60 border-fuchsia-700/30 text-white hover:bg-zinc-700"
                        leftIcon={<Target className="h-4 w-4" />}
                        onClick={() => {
                          setSearchQuery("AI researchers")
                          setIsSearching(true)
                        }}
                      >
                        Connect with AI Researchers
                      </EnhancedButton>
                      <EnhancedButton
                        variant="outline"
                        size="sm"
                        className="w-full justify-start bg-zinc-800/60 border-green-700/30 text-white hover:bg-zinc-700"
                        leftIcon={<Compass className="h-4 w-4" />}
                        onClick={() => setShowSavedSearches(true)}
                      >
                        View Saved Searches
                      </EnhancedButton>
                    </EnhancedCardContent>
                  </EnhancedCard>
                </div>

                {/* Search Analytics */}
                {searchAnalytics && searchHistory.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <EnhancedCard className="bg-zinc-900/60 border border-green-700/40 shadow-[0_0_16px_0_rgba(34,197,94,0.3)]">
                      <EnhancedCardHeader>
                        <EnhancedCardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-green-400" />
                          <span className="bg-gradient-to-r from-[#34d399] to-[#10b981] bg-clip-text text-transparent font-extrabold">
                            Your Search Activity
                          </span>
                        </EnhancedCardTitle>
                      </EnhancedCardHeader>
                      <EnhancedCardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">{searchHistory.length}</div>
                            <div className="text-xs text-zinc-400">Total Searches</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">{followedUsers.length}</div>
                            <div className="text-xs text-zinc-400">Connections Made</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">{joinedCommunities.length}</div>
                            <div className="text-xs text-zinc-400">Communities Joined</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">{viewedProfiles.length}</div>
                            <div className="text-xs text-zinc-400">Profiles Viewed</div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-zinc-300 mb-3">Recent Searches</h4>
                          <div className="flex flex-wrap gap-2">
                            {searchHistory.slice(0, 6).map((query, index) => (
                              <button
                                key={index}
                                className="px-3 py-1 bg-zinc-800/60 border border-zinc-700/40 rounded-full text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                                onClick={() => {
                                  setSearchQuery(query)
                                  setIsSearching(true)
                                }}
                              >
                                {query}
                              </button>
                            ))}
                          </div>
                        </div>
                      </EnhancedCardContent>
                    </EnhancedCard>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              // Enhanced Search Results
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {isLoading ? (
                  // Enhanced Loading State
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                      <span className="text-zinc-300">Searching across our network...</span>
                    </div>
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-40 w-full bg-zinc-800/50 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : currentResults.length > 0 ? (
                  // Enhanced Results Display
                  <div className="space-y-6">
                    {/* Results Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          Search Results for "{debouncedQuery}"
                        </h2>
                        <p className="text-zinc-400">
                          Found {currentResults.length} results • Showing {activeCategory === "all" ? "all categories" : activeCategory}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <EnhancedButton
                              variant="outline"
                              size="sm"
                              rounded="full"
                              className="bg-zinc-900/60 border-zinc-700/40 text-white hover:bg-zinc-800"
                              leftIcon={<Download className="h-3 w-3" />}
                            >
                              Export
                            </EnhancedButton>
                          </TooltipTrigger>
                          <TooltipContent>Export search results</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <EnhancedButton
                              variant="outline"
                              size="sm"
                              rounded="full"
                              className="bg-zinc-900/60 border-zinc-700/40 text-white hover:bg-zinc-800"
                              leftIcon={<Share2 className="h-3 w-3" />}
                            >
                              Share
                            </EnhancedButton>
                          </TooltipTrigger>
                          <TooltipContent>Share search results</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Results Grid */}
                    <div className="space-y-4">
                      {currentResults.map((result, index) => (
                        <motion.div
                          key={`${result.type}-${result.id}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <EnhancedCard className="bg-zinc-900/80 border border-blue-700/40 shadow-[0_0_16px_0_rgba(80,0,255,0.3)] hover:shadow-[0_0_24px_0_rgba(80,0,255,0.4)] transition-all group">
                            <EnhancedCardContent className="p-6">
                              {/* Enhanced Person Card */}
                              {result.type === "people" && (
                                <div className="flex items-start gap-4">
                                  <div className="relative">
                                    <Avatar 
                                      className="h-16 w-16 border-2 border-blue-500/30 cursor-pointer hover:border-blue-500/60 transition-colors"
                                      onClick={() => openProfileModal(result.id)}
                                    >
                                      <AvatarImage src={result.profileImage} />
                                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                                        {result.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    {result.verified && (
                                      <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                                        <Verified className="h-3 w-3 text-white fill-current" />
                                      </div>
                                    )}
                                    <div className="absolute -top-1 -left-1">
                                      <Badge className="bg-blue-900/80 text-blue-300 border-blue-700 text-xs px-1 py-0">
                                        #{result.level}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-3">
                                      <div>
                                        <h3 className="font-bold text-white text-lg hover:text-blue-400 cursor-pointer transition-colors"
                                            onClick={() => openProfileModal(result.id)}>
                                          {result.name}
                                        </h3>
                                        <p className="text-zinc-400 text-sm">@{result.username}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge className="bg-blue-900/50 text-blue-300 border-blue-800 text-xs">
                                            Score: {result.score.toLocaleString()}
                                          </Badge>
                                          <Badge className="bg-zinc-800/60 text-zinc-300 border-zinc-700 text-xs">
                                            Level {result.level}
                                          </Badge>
                                          {result.availability === "Available for chat" && (
                                            <Badge className="bg-green-900/30 text-green-400 border-green-700/40 text-xs">
                                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1" />
                                              Available
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <EnhancedButton
                                              variant="ghost"
                                              size="icon"
                                              rounded="full"
                                              className="h-8 w-8 text-zinc-400 hover:text-blue-400 hover:bg-blue-900/20"
                                              onClick={() => startChat(result.id)}
                                            >
                                              <MessageSquare className="h-4 w-4" />
                                            </EnhancedButton>
                                          </TooltipTrigger>
                                          <TooltipContent>Send message</TooltipContent>
                                        </Tooltip>
                                        
                                        <EnhancedButton
                                          variant={followedUsers.includes(result.id) ? "outline" : "gradient"}
                                          size="sm"
                                          rounded="full"
                                          animation={followedUsers.includes(result.id) ? "none" : "shimmer"}
                                          className={followedUsers.includes(result.id) 
                                            ? "bg-zinc-800/60 border-zinc-700/40 text-white hover:bg-zinc-700" 
                                            : "bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_8px_0_rgba(80,0,255,0.4)]"
                                          }
                                          leftIcon={followedUsers.includes(result.id) ? <CheckCircle className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                                          onClick={() => toggleFollow(result.id)}
                                        >
                                          {followedUsers.includes(result.id) ? "Following" : "Follow"}
                                        </EnhancedButton>
                                      </div>
                                    </div>
                                    
                                    <p className="text-zinc-200 mb-3 leading-relaxed line-clamp-2">{result.bio}</p>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                      <div className="flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4 text-blue-400" />
                                        <span className="text-zinc-300 truncate">{result.university}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-green-400" />
                                        <span className="text-zinc-300 truncate">{result.location}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-purple-400" />
                                        <span className="text-zinc-300">{result.connections} connections</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-fuchsia-400" />
                                        <span className="text-zinc-300">{result.lastActive}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2">
                                      {result.skills.slice(0, 4).map((skill: string) => (
                                        <Badge key={skill} className="bg-zinc-800/60 text-zinc-300 border-zinc-700/40 text-xs hover:bg-zinc-700/60 cursor-pointer">
                                          {skill}
                                        </Badge>
                                      ))}
                                      {result.mutualConnections > 0 && (
                                        <Badge className="bg-blue-900/30 text-blue-400 border-blue-700/40 text-xs">
                                          <Network className="h-3 w-3 mr-1" />
                                          {result.mutualConnections} mutual
                                        </Badge>
                                      )}
                                      {result.skills.length > 4 && (
                                        <Badge className="bg-zinc-700/40 text-zinc-400 border-zinc-600/40 text-xs">
                                          +{result.skills.length - 4} more
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    {/* Quick action buttons */}
                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-800/50">
                                      <EnhancedButton
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-zinc-400 hover:text-blue-400"
                                        leftIcon={<Eye className="h-3 w-3" />}
                                        onClick={() => openProfileModal(result.id)}
                                      >
                                        View Profile
                                      </EnhancedButton>
                                      <EnhancedButton
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-zinc-400 hover:text-green-400"
                                        leftIcon={<Mail className="h-3 w-3" />}
                                      >
                                        Email
                                      </EnhancedButton>
                                      <EnhancedButton
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-zinc-400 hover:text-purple-400"
                                        leftIcon={<Share2 className="h-3 w-3" />}
                                      >
                                        Share
                                      </EnhancedButton>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {/* Company Card */}
                              {result.type === "companies" && (
                                <div className="flex items-center gap-4">
                                  <div>
                                    {result.logo ? (
                                      <img src={result.logo} alt={result.name} className="h-16 w-16 rounded-full border-2 border-blue-500/30 bg-white object-contain" />
                                    ) : null}
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-white text-lg">{result.name}</h3>
                                    <p className="text-zinc-400 text-sm mb-2">{result.industry}</p>
                                    <p className="text-zinc-200 mb-2 line-clamp-2">{result.description}</p>
                                    {result.location ? <p className="text-zinc-400 text-xs">{result.location}</p> : null}
                                  </div>
                                </div>
                              )}
                              {/* Community Card */}
                              {result.type === "communities" && (
                                <div className="flex items-center gap-4">
                                  <div>
                                    {result.image ? (
                                      <img src={result.image} alt={result.name} className="h-16 w-16 rounded-full border-2 border-purple-500/30 bg-white object-cover" />
                                    ) : null}
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-white text-lg">{result.name}</h3>
                                    <p className="text-zinc-400 text-sm mb-2">{result.category}</p>
                                    <p className="text-zinc-200 mb-2 line-clamp-2">{result.description}</p>
                                    {result.members ? <p className="text-zinc-400 text-xs">{result.members} members</p> : null}
                                  </div>
                                </div>
                              )}
                              {/* University Card */}
                              {result.type === "universities" && (
                                <div className="flex items-center gap-4">
                                  <div>
                                    {result.logo ? (
                                      <img src={result.logo} alt={result.name} className="h-16 w-16 rounded-full border-2 border-green-500/30 bg-white object-contain" />
                                    ) : null}
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-white text-lg">{result.name}</h3>
                                    <p className="text-zinc-400 text-sm mb-2">{result.location}</p>
                                    <p className="text-zinc-200 mb-2 line-clamp-2">{result.ranking ? `Ranked #${result.ranking}` : null}</p>
                                    <p className="text-zinc-400 text-xs">{result.description}</p>
                                  </div>
                                </div>
                              )}
                              {result.type === "opportunities" ? (
                                <div className="flex items-center gap-4 p-4 bg-zinc-900/70 rounded-xl border border-blue-700/30 shadow-sm">
                                  <div className="flex-shrink-0">
                                    <Rocket className="h-12 w-12 text-blue-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white text-lg mb-1 truncate">{result.title}</h3>
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <span className="text-zinc-400 text-sm">{result.company}</span>
                                      <span className="text-zinc-500 text-xs">{result.type}</span>
                                      <span className="text-blue-400 text-xs font-medium">Deadline: {result.deadline}</span>
                                    </div>
                                    {result.score && (
                                      <span className="inline-block bg-blue-900/40 text-blue-300 border border-blue-700/30 rounded-full px-2 py-0.5 text-xs font-semibold mr-2">Score: {result.score}</span>
                                    )}
                                    {result.description && (
                                      <p className="text-zinc-300 text-xs mt-1 line-clamp-2">{result.description}</p>
                                    )}
                                  </div>
                                </div>
                              ) : null}
                            </EnhancedCardContent>
                          </EnhancedCard>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Enhanced No Results State
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 bg-zinc-900/60 rounded-xl border border-blue-700/30 shadow-[0_0_24px_0_rgba(80,0,255,0.2)]"
                  >
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-zinc-800/80 border border-blue-700/30 mb-8">
                      <Search className="h-12 w-12 text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">No results found</h3>
                    <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                      We couldn't find anything matching "{debouncedQuery}". Try adjusting your search terms or explore our suggestions below.
                    </p>
                    
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-zinc-300 mb-3">Try these popular searches:</h4>
                        <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                          {["harvard computer science", "google software engineer", "stanford mba", "mit ai research", "mckinsey consultant"].map((suggestion) => (
                            <EnhancedButton
                              key={suggestion}
                              variant="outline"
                              size="sm"
                              rounded="full"
                              className="bg-zinc-800/60 border-blue-700/30 text-white hover:bg-zinc-700 hover:border-blue-500/50"
                              onClick={() => {
                                setSearchQuery(suggestion)
                                setIsSearching(true)
                              }}
                            >
                              {suggestion}
                            </EnhancedButton>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-center gap-4">
                        <EnhancedButton
                          variant="outline"
                          rounded="full"
                          className="bg-zinc-800/60 border-zinc-700/30 text-white hover:bg-zinc-700 hover:border-blue-500/50"
                          onClick={() => {
                            setSearchQuery("")
                            setIsSearching(false)
                          }}
                        >
                          Clear Search
                        </EnhancedButton>
                        <EnhancedButton
                          variant="gradient"
                          rounded="full"
                          animation="shimmer"
                          className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)]"
                          onClick={() => setShowSavedSearches(true)}
                        >
                          Try Saved Searches
                        </EnhancedButton>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Enhanced Profile Modal */}
        <Dialog open={selectedProfileId !== null} onOpenChange={() => setSelectedProfileId(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-900/95 border border-blue-700/40 shadow-[0_0_32px_0_rgba(80,0,255,0.3)]">
            {selectedProfileId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <DialogHeader>
                  <DialogTitle className="sr-only">Profile Details</DialogTitle>
                </DialogHeader>
                
                {/* Enhanced profile content would go here */}
                <div className="text-center py-8">
                  <h3 className="text-xl font-bold text-white">Enhanced Profile View</h3>
                  <p className="text-zinc-400">Detailed profile modal coming soon...</p>
                </div>
              </motion.div>
            )}
          </DialogContent>
        </Dialog>

        {/* Enhanced Chat Modal */}
        <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
          <DialogContent className="max-w-2xl bg-zinc-900/95 border border-purple-700/40 shadow-[0_0_32px_0_rgba(147,51,234,0.3)]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-400" />
                <span className="text-white">Start Conversation</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <Textarea
                placeholder="Send a message..."
                className="bg-zinc-800/80 border border-purple-700/30 text-white resize-none"
                rows={4}
              />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Switch id="private" />
                  <Label htmlFor="private" className="text-sm text-zinc-300">Private message</Label>
                </div>
                <EnhancedButton
                  variant="gradient"
                  rounded="full"
                  animation="shimmer"
                  className="bg-gradient-to-r from-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(147,51,234,0.4)]"
                  leftIcon={<Send className="h-4 w-4" />}
                >
                  Send Message
                </EnhancedButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </AppShell>
  )
}

