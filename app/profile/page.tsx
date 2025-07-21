"use client"

import { useState } from "react"
import {
  Briefcase,
  FileText,
  GraduationCap,
  MapPin,
  Settings,
  Share2,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Award,
} from "lucide-react"
import { motion } from "framer-motion"

import { AppShell } from "@/components/layout/app-shell"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { EnhancedCard, EnhancedCardContent } from "@/components/ui/enhanced-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// Removed import of Separator due to missing module
import { cn } from "@/lib/utils"
import { LevelIndicator } from "@/components/level-indicator"

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [score, setScore] = useState(785)
  const [level, setLevel] = useState(4)
  const [xp, setXp] = useState(3450)
  const [nextLevelXp, setNextLevelXp] = useState(5000)
  const progress = (xp / nextLevelXp) * 100

  // Mock user data
  const user = {
    name: "Alex Johnson",
    username: "alex_improvement",
    bio: "Computer Science student at Stanford University | Passionate about AI and machine learning | Looking to improve my leadership skills",
    location: "Stanford, CA",
    education: "Stanford University",
    major: "Computer Science",
    graduationYear: 2025,
    image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces",
    verified: true,
    connections: 248,
    following: 156,
    followers: 312,
  }

  // Mock achievements data
  const achievements = [
    {
      id: 1,
      title: "Coding Master",
      description: "Completed 50 coding challenges",
      icon: <FileText className="h-5 w-5 text-primary-400" />,
      date: "2 weeks ago",
      xp: 500,
    },
    {
      id: 2,
      title: "Public Speaker",
      description: "Delivered 5 presentations",
      icon: <Users className="h-5 w-5 text-primary-400" />,
      date: "1 month ago",
      xp: 350,
    },
    {
      id: 3,
      title: "Team Leader",
      description: "Led a group project to completion",
      icon: <Users className="h-5 w-5 text-primary-400" />,
      date: "2 months ago",
      xp: 450,
    },
  ]

  // Mock skills data
  const skills = [
    { name: "Python", level: 85 },
    { name: "Machine Learning", level: 70 },
    { name: "Web Development", level: 65 },
    { name: "Public Speaking", level: 60 },
    { name: "Leadership", level: 55 },
  ]

  // Mock badges data
  const badges = [
    {
      id: 1,
      name: "Coding Expert",
      icon: <FileText className="h-6 w-6" />,
      color: "bg-secondary-500",
    },
    {
      id: 2,
      name: "Team Player",
      icon: <Users className="h-6 w-6" />,
      color: "bg-accent-success",
    },
    {
      id: 3,
      name: "Fast Learner",
      icon: <TrendingUp className="h-6 w-6" />,
      color: "bg-primary-500",
    },
    {
      id: 4,
      name: "Problem Solver",
      icon: <Star className="h-6 w-6" />,
      color: "bg-accent-warning",
    },
  ]

  // Mock education data
  const education = [
    {
      id: 1,
      institution: "Stanford University",
      degree: "Bachelor of Science in Computer Science",
      years: "2021 - 2025",
      gpa: "3.8/4.0",
      logo: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=150&h=150&fit=crop",
    },
    {
      id: 2,
      institution: "Westlake High School",
      degree: "High School Diploma",
      years: "2017 - 2021",
      gpa: "4.0/4.0",
      logo: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150&h=150&fit=crop",
    },
  ]

  // Mock experience data
  const experience = [
    {
      id: 1,
      company: "Google",
      position: "Software Engineering Intern",
      years: "Summer 2023",
      description: "Worked on machine learning algorithms for Google Search",
      logo: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=150&h=150&fit=crop",
    },
    {
      id: 2,
      company: "Stanford AI Lab",
      position: "Research Assistant",
      years: "2022 - Present",
      description: "Conducting research on natural language processing",
      logo: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&h=150&fit=crop",
    },
  ]

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 24,
      },
    },
  }

  return (
    <AppShell
      title="Profile"
      rightElement={
        <EnhancedButton variant="ghost" size="icon" rounded="full" className="hover:bg-zinc-800">
          <Settings className="h-5 w-5" />
        </EnhancedButton>
      }
    >
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-radial from-blue-500/20 via-purple-700/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-gradient-radial from-purple-700/20 via-pink-600/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-gradient-radial from-fuchsia-500/15 via-blue-600/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
      {/* Profile Header */}
      <div className="relative max-w-3xl mx-auto pt-8 pb-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10">
          {/* Avatar */}
          <Avatar className="h-32 w-32 border-4 border-black ring-2 ring-blue-500 rounded-full object-cover shadow-[0_0_24px_0_rgba(80,0,255,0.5)]" style={{ minWidth: 128, minHeight: 128 }}>
            <AvatarImage src={user.image} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-bold">{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          {/* Profile Info */}
          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 text-2xl font-extrabold">
                <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">{user.name}</span>
                {user.verified && (
                  <svg className="h-6 w-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
                )}
              </div>
              <span className="text-zinc-300 text-lg font-medium">@{user.username}</span>
              <div className="flex gap-2 ml-auto">
                <EnhancedButton size="sm" rounded="full" variant="gradient" animation="shimmer" className="px-6 py-1 text-base font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)]">Edit Profile</EnhancedButton>
                <EnhancedButton variant="ghost" size="icon" rounded="full" className="hover:bg-zinc-800/80 hover:shadow-[0_0_8px_0_rgba(80,0,255,0.3)]"><Settings className="h-5 w-5" /></EnhancedButton>
              </div>
            </div>
            {/* Stats Row */}
            <div className="flex gap-8 mt-4 text-center">
              <div>
                <span className="font-extrabold text-lg text-white">12</span>
                <div className="text-xs text-zinc-400 font-medium">Posts</div>
              </div>
              <div>
                <span className="font-extrabold text-lg text-white">{user.followers}</span>
                <div className="text-xs text-zinc-400 font-medium">Followers</div>
              </div>
              <div>
                <span className="font-extrabold text-lg text-white">{user.following}</span>
                <div className="text-xs text-zinc-400 font-medium">Following</div>
              </div>
            </div>
            {/* Bio */}
            <div className="mt-4 text-base text-zinc-100 whitespace-pre-line font-medium">{user.bio}</div>
            <div className="flex items-center gap-3 mt-2 text-sm text-zinc-300 font-medium">
              <MapPin className="h-4 w-4" /> {user.location}
              <GraduationCap className="h-4 w-4 ml-3" /> {user.education}, {user.major}
            </div>
          </div>
        </div>
      </div>
      {/* Divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-700/50 to-transparent my-4" />
      {/* Tabs (styled like Instagram) */}
      <Tabs defaultValue="overview" className="w-full max-w-3xl mx-auto" onValueChange={setActiveTab}>
        <TabsList className="w-full flex justify-center bg-transparent h-12 p-0 border-b border-blue-700/30">
          <TabsTrigger
            value="overview"
            className={cn(
              "flex-1 rounded-none h-full text-lg font-bold data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-400 transition-all duration-300 px-0 hover:text-blue-400",
              activeTab === "overview" ? "text-white border-b-2 border-blue-400 shadow-[0_4px_8px_0_rgba(59,130,246,0.3)]" : "text-zinc-400 border-b-2 border-transparent",
            )}
          >
            Posts
          </TabsTrigger>
          <TabsTrigger
            value="achievements"
            className={cn(
              "flex-1 rounded-none h-full text-lg font-bold data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-purple-400 transition-all duration-300 px-0 hover:text-purple-400",
              activeTab === "achievements" ? "text-white border-b-2 border-purple-400 shadow-[0_4px_8px_0_rgba(147,51,234,0.3)]" : "text-zinc-400 border-b-2 border-transparent",
            )}
          >
            Achievements
          </TabsTrigger>
          <TabsTrigger
            value="resume"
            className={cn(
              "flex-1 rounded-none h-full text-lg font-bold data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-fuchsia-400 transition-all duration-300 px-0 hover:text-fuchsia-400",
              activeTab === "resume" ? "text-white border-b-2 border-fuchsia-400 shadow-[0_4px_8px_0_rgba(217,70,239,0.3)]" : "text-zinc-400 border-b-2 border-transparent",
            )}
          >
            Resume
          </TabsTrigger>
        </TabsList>
        {/* Posts Grid (Instagram style) */}
        <TabsContent value="overview" className="mt-0 px-0 py-8">
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            {[1,2,3,4,5,6,7,8,9].map((i) => (
              <div key={i} className="aspect-square bg-zinc-800/80 border border-blue-700/30 rounded-sm overflow-hidden flex items-center justify-center hover:bg-zinc-700/80 hover:border-blue-600/50 transition-all hover:shadow-[0_0_8px_0_rgba(80,0,255,0.3)]">
                <span className="text-zinc-500 text-3xl font-extrabold">+</span>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Level Progress */}
        <motion.div
          className="px-4 py-3 bg-zinc-900/80 border border-blue-700/40 rounded-lg max-w-4xl mx-auto shadow-[0_0_16px_0_rgba(80,0,255,0.3)] mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LevelIndicator level={level} currentXP={xp} nextLevelXP={nextLevelXp} size="md" />
              <div>
                <div className="text-sm font-bold text-white">Level {level}</div>
                <div className="text-xs text-zinc-400">
                  {Math.round(progress)}% to Level {level + 1}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-zinc-900/80 border border-yellow-700/40 rounded-lg px-3 py-1 flex items-center shadow-[0_0_8px_0_rgba(234,179,8,0.3)]">
                <Trophy className="h-4 w-4 mr-1 text-yellow-400" />
                <span className="font-extrabold text-lg text-white">{score}</span>
                <span className="text-xs text-zinc-400 ml-1">Score</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-0 px-4 py-4 space-y-6">
          {/* Skills */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.h2 className="text-lg font-semibold mb-3" variants={itemVariants}>
              <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">Skills</span>
            </motion.h2>
            <div className="space-y-3">
              {skills.map((skill, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-white">{skill.name}</span>
                    <span className="text-xs text-zinc-400">{skill.level}%</span>
                  </div>
                  <div className="relative h-2 bg-zinc-800/80 border border-zinc-700/50 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-[0_0_4px_0_rgba(80,0,255,0.5)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.level}%` }}
                      transition={{ delay: 0.1 * index, duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Badges */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.h2 className="text-lg font-semibold mb-3" variants={itemVariants}>
              <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">Badges</span>
            </motion.h2>
            <div className="grid grid-cols-4 gap-3">
              {badges.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  className="flex flex-col items-center"
                  variants={itemVariants}
                  whileHover={{ scale: 1.1 }}
                >
                  <motion.div
                    className={`${badge.color} h-14 w-14 rounded-full flex items-center justify-center mb-1 shadow-lg border-2 border-white/20`}
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.1 * index, type: "spring", stiffness: 200 }}
                  >
                    {badge.icon}
                  </motion.div>
                  <span className="text-xs text-center font-bold text-white">{badge.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Achievements */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="flex items-center justify-between mb-3">
              <motion.h2 className="text-lg font-semibold flex items-center" variants={itemVariants}>
                <Award className="h-5 w-5 mr-2 text-blue-400" />
                <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">Recent Achievements</span>
              </motion.h2>
              <EnhancedButton variant="link" className="text-blue-400 text-sm p-0 hover:text-blue-300 font-bold">
                See All
              </EnhancedButton>
            </div>
            <div className="space-y-3">
              {achievements.slice(0, 2).map((achievement, index) => (
                <motion.div key={achievement.id} variants={itemVariants}>
                  <EnhancedCard variant="gradient" hover="lift" className="border-blue-700/40 bg-zinc-900/80 shadow-[0_0_16px_0_rgba(80,0,255,0.3)]">
                    <EnhancedCardContent className="p-3">
                      <div className="flex items-start">
                        <div className="bg-blue-900/40 p-2 rounded-full mr-3 shadow-[0_0_8px_0_rgba(59,130,246,0.3)]">{achievement.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-white">{achievement.title}</h3>
                            <Badge className="bg-blue-900/50 text-blue-300 border-blue-800 text-[10px]">
                              +{achievement.xp} XP
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-400 mt-1">{achievement.description}</p>
                          <div className="text-xs text-zinc-500 mt-1">{achievement.date}</div>
                        </div>
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="mt-0 px-4 py-4 space-y-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
            {achievements.map((achievement, index) => (
              <motion.div key={achievement.id} variants={itemVariants} custom={index}>
                <EnhancedCard variant="gradient" hover="lift" className="border-blue-700/40 bg-zinc-900/80 shadow-[0_0_16px_0_rgba(80,0,255,0.3)]">
                  <EnhancedCardContent className="p-3">
                    <div className="flex items-start">
                      <div className="bg-blue-900/40 p-2 rounded-full mr-3 shadow-[0_0_8px_0_rgba(59,130,246,0.3)]">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-white">{achievement.title}</h3>
                          <Badge className="bg-blue-900/50 text-blue-300 border-blue-800 text-[10px]">
                            +{achievement.xp} XP
                          </Badge>
                        </div>
                        <p className="text-sm text-zinc-400 mt-1">{achievement.description}</p>
                        <div className="text-xs text-zinc-500 mt-1">{achievement.date}</div>
                      </div>
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        {/* Resume Tab */}
        <TabsContent value="resume" className="mt-0 px-4 py-4 space-y-6">
          {/* Education */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.h2 className="text-lg font-semibold mb-3 flex items-center" variants={itemVariants}>
              <GraduationCap className="h-5 w-5 mr-2 text-blue-400" />
              <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">Education</span>
            </motion.h2>
            <div className="space-y-4">
              {education.map((edu, index) => (
                <motion.div key={edu.id} variants={itemVariants} custom={index}>
                  <EnhancedCard variant="default" hover="lift" className="bg-zinc-900/80 border border-blue-700/40 shadow-[0_0_16px_0_rgba(80,0,255,0.3)]">
                    <EnhancedCardContent className="p-4">
                      <div className="flex items-start">
                        <Avatar className="h-12 w-12 rounded-lg mr-3 shadow-lg border border-blue-700/30">
                          <AvatarImage src={edu.logo} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">{edu.institution.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-bold text-white">{edu.institution}</h3>
                          <p className="text-sm text-zinc-200">{edu.degree}</p>
                          <div className="flex items-center text-xs text-zinc-400 mt-1">
                            <span>{edu.years}</span>
                            <span className="mx-2">•</span>
                            <span>GPA: {edu.gpa}</span>
                          </div>
                        </div>
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Experience */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.h2 className="text-lg font-semibold mb-3 flex items-center" variants={itemVariants}>
              <Briefcase className="h-5 w-5 mr-2 text-purple-400" />
              <span className="bg-gradient-to-r from-[#a259ff] to-[#d946ef] bg-clip-text text-transparent font-extrabold">Experience</span>
            </motion.h2>
            <div className="space-y-4">
              {experience.map((exp, index) => (
                <motion.div key={exp.id} variants={itemVariants} custom={index}>
                  <EnhancedCard variant="default" hover="lift" className="bg-zinc-900/80 border border-purple-700/40 shadow-[0_0_16px_0_rgba(147,51,234,0.3)]">
                    <EnhancedCardContent className="p-4">
                      <div className="flex items-start">
                        <Avatar className="h-12 w-12 rounded-lg mr-3 shadow-lg border border-purple-700/30">
                          <AvatarImage src={exp.logo} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white font-bold">{exp.company.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-bold text-white">{exp.position}</h3>
                          <p className="text-sm text-zinc-200">{exp.company}</p>
                          <div className="text-xs text-zinc-400 mt-1">{exp.years}</div>
                          <p className="text-sm text-zinc-200 mt-2">{exp.description}</p>
                        </div>
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Download Resume */}
          <div className="text-center mt-6">
            <EnhancedButton
              variant="gradient"
              rounded="full"
              animation="shimmer"
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)]"
              leftIcon={<FileText className="h-4 w-4" />}
            >
              Download Full Resume
            </EnhancedButton>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </AppShell>
  )
}

