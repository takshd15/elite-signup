"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle, Trophy, Users, BarChart2, Zap, Star, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { AnimatedSection } from "@/components/ui/animated-section"
import { AnimatedCounter } from "@/components/ui/animated-counter"
// Testimonial data
const testimonials = [
  {
    name: "Alex Johnson",
    role: "Software Engineer",
    image: "/images/user-alex.png",
    content:
      "This app has transformed how I approach my career growth. The daily challenges keep me motivated, and seeing my progress on the leaderboard pushes me to improve consistently.",
    rating: 5,
  },
  {
    name: "Sarah Williams",
    role: "Product Manager",
    image: "/images/user-sarah.png",
    content:
      "I've tried many self-improvement apps, but this one stands out with its social features. Comparing my progress with peers has added a fun competitive element to my personal development.",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Data Scientist",
    image: "/images/user-michael.png",
    content:
      "The gamification elements make learning new skills actually enjoyable. I've completed more courses in the last month than I did all of last year!",
    rating: 4,
  },
]

// Feature data
const features = [
  {
    title: "Personalized Growth Tracking",
    description:
      "Set goals, track progress, and visualize your improvement journey with interactive dashboards and metrics.",
    icon: BarChart2,
    color: "from-purple-500 to-purple-700",
  },
  {
    title: "Peer Benchmarking",
    description:
      "Compare your progress with peers in your field to identify areas for improvement and celebrate your strengths.",
    icon: Users,
    color: "from-fuchsia-500 to-fuchsia-700",
  },
  {
    title: "Daily Challenges",
    description:
      "Stay motivated with personalized daily challenges that push your boundaries and build consistent habits.",
    icon: Zap,
    color: "from-pink-500 to-pink-600",
  },
  {
    title: "Achievement System",
    description: "Earn XP, unlock badges, and level up as you accomplish goals and master new skills in your journey.",
    icon: Trophy,
    color: "from-violet-500 to-violet-700",
  },
]

// Stats data
const stats = [
  { label: "Active Users", value: 25000 },
  { label: "Goals Completed", value: 1250000 },
  { label: "Skills Improved", value: 75000 },
  { label: "Average Growth", value: 32 },
]

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black pb-24 pt-24 md:pt-32 md:pb-32">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-black" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-radial from-blue-500/40 via-purple-700/30 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-72 h-72 bg-gradient-radial from-purple-700/40 via-pink-600/30 to-transparent rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <AnimatedSection delay={0.2} className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="inline-block"
              >
                <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent text-base font-extrabold tracking-widest px-4 py-1 rounded-full border border-blue-700/40 shadow-[0_0_16px_0_rgba(80,0,255,0.4)] uppercase">
                  ELITESCORE
                </span>
              </motion.div>
              <motion.h1
                className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-widest leading-tight bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent drop-shadow-[0_0_32px_rgba(80,0,255,0.5)] uppercase"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                UNLOCK YOUR POTENTIAL<br />
                <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent animate-gradient-x">
                  SEE HOW YOU STACK UP
                </span>
              </motion.h1>
              <motion.p
                className="text-xl md:text-2xl text-white max-w-xl leading-relaxed drop-shadow-[0_0_8px_rgba(80,0,255,0.3)]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                Daily challenges, real progress tracking, and a community that motivates you to be your best. Compare your journey with peers and gain actionable insights to accelerate growth.
              </motion.p>

              {/* Key Benefits Section */}
              <motion.div
                className="mt-8 grid grid-cols-1 gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                {[
                  { icon: Trophy, text: "Upload your resume and track daily challenges" },
                  { icon: Users, text: "Compare scores with peers in your field" },
                  { icon: BarChart2, text: "Gain actionable insights to improve faster" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_12px_0_rgba(80,0,255,0.4)]">
                      <item.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-base text-white font-medium tracking-wide">{item.text}</span>
                  </div>
                ))}
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row gap-6 pt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <EnhancedButton
                  size="lg"
                  variant="gradient"
                  rounded="full"
                  animation="shimmer"
                  className="text-lg font-bold group relative overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 border-2 border-blue-700/40 shadow-[0_0_32px_0_rgba(80,0,255,0.5)] focus-visible:ring-4 focus-visible:ring-fuchsia-500/60 transition-transform duration-200 hover:scale-105"
                >
                  <Link href="/signup" className="flex items-center">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </EnhancedButton>

                <Button
                  size="lg"
                  variant="outline"
                  className="border-blue-700/40 hover:bg-blue-900 text-lg text-white shadow-[0_0_12px_0_rgba(80,0,255,0.2)] focus-visible:ring-4 focus-visible:ring-blue-500/60 transition-transform duration-200 hover:scale-105"
                  asChild
                >
                  <Link href="#how-it-works" className="flex items-center">
                    <span>See Peer Progress</span>
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </Button>
              </motion.div>

              <motion.div
                className="flex items-center gap-3 pt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <div className="flex -space-x-2">
                  {["alex", "sarah", "michael", "emily"].map((name) => (
                    <div key={name} className="w-9 h-9 rounded-full border-2 border-blue-700/40 overflow-hidden shadow-[0_0_8px_0_rgba(80,0,255,0.3)]">
                      <Image
                        src={`/images/user-${name}.png`}
                        alt={`EliteScore user ${name}`}
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="text-base text-white font-medium">
                  <span className="text-white font-bold">25,000+</span> people growing together
                </div>
              </motion.div>
            </AnimatedSection>

            {/* Logo on the right side */}
            <AnimatedSection delay={0.4} className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center justify-center w-full h-full">
                <Image
                  src="/Annotation 2025-07-18 034118.png"
                  alt="EliteScore logo with neon gradient ring"
                  width={560}
                  height={560}
                  className="object-contain max-w-[420px] md:max-w-[500px] lg:max-w-[560px] w-full h-auto mx-auto my-8 md:my-0 drop-shadow-[0_0_120px_rgba(80,0,255,0.5)]"
                  priority
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-1 bg-gradient-to-r from-blue-700 via-purple-700 to-fuchsia-500 opacity-30 my-8 rounded-full" />

      {/* Social Proof */}
      <section className="py-16 bg-black">
        <div className="container mx-auto px-4">
          <AnimatedSection delay={0.2}>
            <div className="flex flex-wrap justify-between items-center gap-12">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent animate-gradient-x drop-shadow-[0_0_32px_rgba(80,0,255,0.5)]">
                    <AnimatedCounter
                      from={0}
                      to={stat.value}
                      duration={2}
                      delay={0.5 + index * 0.1}
                    />
                  </div>
                  <div className="text-base text-white mt-1 font-medium tracking-wide">{stat.label}</div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-1 bg-gradient-to-r from-blue-700 via-purple-700 to-fuchsia-500 opacity-20 my-8 rounded-full" />

      {/* Features */}
      <section id="features" className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <AnimatedSection delay={0.2} className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(80,0,255,0.4)] tracking-tight">
              How It Works
            </h2>
            <p className="text-white text-xl font-medium">
              Our platform combines powerful tracking tools, social elements, and gamification to create a uniquely effective self-improvement experience.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <AnimatedSection key={index} delay={0.3 + index * 0.1}>
                <EnhancedCard variant="default" hover="lift" className="h-full bg-zinc-900/90 bg-opacity-80 backdrop-blur-lg border border-blue-700/40 shadow-lg shadow-blue-500/30 transition-transform duration-200 hover:scale-105 hover:shadow-[0_0_32px_0_rgba(80,0,255,0.5)]">
                  <div className="p-8 space-y-5">
                    <div
                      className={`w-14 h-14 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_16px_0_rgba(80,0,255,0.4)]`}
                    >
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                      {feature.title}
                    </h3>
                    <p className="text-white text-base font-medium leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </EnhancedCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-1 bg-gradient-to-r from-blue-700 via-purple-700 to-fuchsia-500 opacity-20 my-8 rounded-full" />

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <AnimatedSection delay={0.2} className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(80,0,255,0.4)] tracking-tight">
              Your Path to Improvement
            </h2>
            <p className="text-white text-xl font-medium">
              Follow these simple steps to start tracking your progress, competing with peers, and achieving your goals.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: "1",
                title: "Create Your Profile",
                description: "Sign up and upload your resume to establish your baseline skills and interests.",
                icon: User,
                color: "from-blue-500 to-purple-500",
              },
              {
                step: "2",
                title: "Accept Challenges",
                description: "Take on daily and weekly challenges designed to push your boundaries.",
                icon: Zap,
                color: "from-purple-500 to-fuchsia-500",
              },
              {
                step: "3",
                title: "Track Progress",
                description: "Monitor your improvements and see how you compare with peers in your field.",
                icon: BarChart2,
                color: "from-blue-500 to-fuchsia-500",
              },
              {
                step: "4",
                title: "Earn & Grow",
                description: "Collect XP, unlock achievements, and gain actionable insights for real growth.",
                icon: Trophy,
                color: "from-purple-500 to-blue-500",
              },
            ].map((item, index) => (
              <AnimatedSection key={index} delay={0.3 + index * 0.1}>
                <div className="relative">
                  <div
                    className={`absolute -top-2 -left-2 w-11 h-11 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-bold shadow-[0_0_12px_0_rgba(80,0,255,0.4)]`}
                  >
                    {item.step}
                  </div>
                  <EnhancedCard variant="default" hover="lift" className="pt-8 h-full bg-zinc-900/90 bg-opacity-80 backdrop-blur-lg border border-blue-700/40 shadow-lg shadow-blue-500/30 transition-transform duration-200 hover:scale-105 hover:shadow-[0_0_32px_0_rgba(80,0,255,0.5)]">
                    <div className="p-8 space-y-5">
                      <div
                        className={`w-14 h-14 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shadow-[0_0_16px_0_rgba(80,0,255,0.4)]`}
                      >
                        <item.icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="text-2xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                        {item.title}
                      </h3>
                      <p className="text-white text-base font-medium leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </EnhancedCard>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-1 bg-gradient-to-r from-blue-700 via-purple-700 to-fuchsia-500 opacity-20 my-8 rounded-full" />

      {/* App Screenshots Section */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <AnimatedSection delay={0.2} className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(80,0,255,0.4)] tracking-tight">
              Experience The App
            </h2>
            <p className="text-white text-xl font-medium">
              Take a look at how our platform helps users track progress, compete with peers, and achieve their goals faster.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            <AnimatedSection delay={0.3}>
              <EnhancedCard variant="default" hover="lift" className="overflow-hidden bg-zinc-900/90 bg-opacity-80 backdrop-blur-lg border border-blue-700/40 shadow-lg shadow-blue-500/30 transition-transform duration-200 hover:scale-105 hover:shadow-[0_0_32px_0_rgba(80,0,255,0.5)]">
                <div className="p-6">
                  <h3 className="text-xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                    Personal Dashboard
                  </h3>
                  <p className="text-white text-base font-medium">
                    Track your progress and see your growth metrics at a glance
                  </p>
                  <div className="rounded-lg overflow-hidden border border-blue-700/40">
                    <Image
                      src="/images/app-dashboard.png"
                      alt="EliteScore dashboard screenshot"
                      width={400}
                      height={800}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </EnhancedCard>
            </AnimatedSection>

            <AnimatedSection delay={0.4}>
              <EnhancedCard variant="default" hover="lift" className="overflow-hidden bg-zinc-900/90 bg-opacity-80 backdrop-blur-lg border border-blue-700/40 shadow-lg shadow-blue-500/30 transition-transform duration-200 hover:scale-105 hover:shadow-[0_0_32px_0_rgba(80,0,255,0.5)]">
                <div className="p-6">
                  <h3 className="text-xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                    Challenge Center
                  </h3>
                  <p className="text-white text-base font-medium">Browse and join challenges to accelerate your growth</p>
                  <div className="rounded-lg overflow-hidden border border-blue-700/40">
                    <Image
                      src="/images/app-challenges.png"
                      alt="EliteScore challenges screenshot"
                      width={400}
                      height={800}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </EnhancedCard>
            </AnimatedSection>

            <AnimatedSection delay={0.5}>
              <EnhancedCard variant="default" hover="lift" className="overflow-hidden bg-zinc-900/90 bg-opacity-80 backdrop-blur-lg border border-blue-700/40 shadow-lg shadow-blue-500/30 transition-transform duration-200 hover:scale-105 hover:shadow-[0_0_32px_0_rgba(80,0,255,0.5)]">
                <div className="p-6">
                  <h3 className="text-xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                    Profile & Achievements
                  </h3>
                  <p className="text-white text-base font-medium">Showcase your progress and earned achievements</p>
                  <div className="rounded-lg overflow-hidden border border-blue-700/40">
                    <Image
                      src="/images/app-profile.png"
                      alt="EliteScore profile screenshot"
                      width={400}
                      height={800}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </EnhancedCard>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-1 bg-gradient-to-r from-blue-700 via-purple-700 to-fuchsia-500 opacity-20 my-8 rounded-full" />

      {/* Interface Showcase */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <AnimatedSection delay={0.2} className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(80,0,255,0.4)] tracking-tight">
              Intuitive Interface
            </h2>
            <p className="text-white text-xl font-medium">
              Our carefully designed interface makes tracking your progress and connecting with others seamless and enjoyable.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <AnimatedSection delay={0.3}>
              <div className="space-y-8">
                <h3 className="text-2xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                  Real-time Progress Tracking
                </h3>
                <p className="text-white text-base font-medium">
                  Watch your progress unfold in real-time with interactive charts and visualizations that make data meaningful and motivating.
                </p>

                <ul className="space-y-3">
                  {[
                    "Customizable dashboard widgets",
                    "Daily, weekly, and monthly progress views",
                    "Comparative analytics with peers",
                    "Milestone celebration notifications",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                      <span className="text-white text-base">{item}</span>
                    </li>
                  ))}
                </ul>

                <Button variant="outline" className="mt-2 border-blue-700/40 hover:bg-blue-900 text-white shadow-[0_0_8px_0_rgba(80,0,255,0.2)] focus-visible:ring-4 focus-visible:ring-blue-500/60 transition-transform duration-200 hover:scale-105">
                  Learn More
                </Button>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.4}>
              <EnhancedCard variant="default" className="overflow-hidden bg-zinc-900/90 bg-opacity-80 backdrop-blur-lg border border-blue-700/40 shadow-lg shadow-blue-500/30">
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src="/images/app-analytics.png"
                    alt="EliteScore analytics dashboard screenshot"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-sm text-white bg-black/50 backdrop-blur-sm p-2 rounded">
                      Interactive analytics dashboard showing progress across multiple skill areas
                    </p>
                  </div>
                </div>
              </EnhancedCard>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-1 bg-gradient-to-r from-blue-700 via-purple-700 to-fuchsia-500 opacity-20 my-8 rounded-full" />

      {/* Community & Ethical Growth */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <AnimatedSection delay={0.3}>
              <div className="space-y-8">
                <h2 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(80,0,255,0.4)] tracking-tight">
                  Growth, Not Just Competition
                </h2>
                <p className="text-white text-base font-medium">
                  While we encourage healthy competition, our platform focuses on sustainable improvement and balanced personal development.
                </p>

                <div className="space-y-5 mt-10">
                  <div className="bg-zinc-900/95 bg-opacity-80 backdrop-blur-lg border border-blue-700/40 rounded-lg p-6">
                    <h3 className="text-lg font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent mb-2 tracking-tight">
                      Measure Your Growth, Not Just Your Score
                    </h3>
                    <p className="text-white text-base font-medium">
                      Our metrics focus on your personal improvement journey rather than pure numerical comparisons.
                    </p>
                  </div>

                  <div className="bg-zinc-900/95 bg-opacity-80 backdrop-blur-lg border border-blue-700/40 rounded-lg p-6">
                    <h3 className="text-lg font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent mb-2 tracking-tight">Supportive Community</h3>
                    <p className="text-white text-base font-medium">
                      Connect with mentors, join group challenges, and build a network that supports your goals.
                    </p>
                  </div>

                  <div className="bg-zinc-900/95 bg-opacity-80 backdrop-blur-lg border border-blue-700/40 rounded-lg p-6">
                    <h3 className="text-lg font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent mb-2 tracking-tight">Digital Well-being</h3>
                    <p className="text-white text-base font-medium">
                      We encourage balanced engagement with reminder systems and healthy achievement patterns.
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.4}>
              <div className="relative">
                <EnhancedCard variant="default" className="overflow-hidden bg-zinc-900/90 bg-opacity-80 backdrop-blur-lg border border-blue-700/40 shadow-lg shadow-blue-500/30">
                  <div className="p-8">
                    <h3 className="text-2xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">Community Leaderboard</h3>
                    <div className="space-y-5">
                      {[
                        { name: "Alex J.", field: "Software Engineering", xp: 1250, growth: 27 },
                        { name: "Maya T.", field: "Product Management", xp: 1180, growth: 32 },
                        { name: "Carlos R.", field: "Data Science", xp: 1120, growth: 25 },
                        { name: "Priya K.", field: "UX Design", xp: 1050, growth: 30 },
                      ].map((user, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-zinc-800/80 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-fuchsia-500 text-white font-bold text-lg shadow-[0_0_8px_0_rgba(80,0,255,0.3)]">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-bold text-white text-lg">{user.name}</div>
                              <div className="text-sm text-blue-300 font-medium">{user.field}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-white text-lg">{user.xp} XP</div>
                            <div className="text-xs text-pink-400 font-medium">+{user.growth}% growth</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 text-center p-4 border border-dashed border-blue-700/40 rounded-lg">
                      <p className="text-white text-base font-medium">See where you stand and get inspired by others' progress</p>
                    </div>
                  </div>
                </EnhancedCard>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-1 bg-gradient-to-r from-blue-700 via-purple-700 to-fuchsia-500 opacity-20 my-8 rounded-full" />

      {/* Testimonials */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <AnimatedSection delay={0.2} className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(80,0,255,0.4)] tracking-tight">
              What Our Users Say
            </h2>
            <p className="text-white text-xl font-medium">
              Join thousands of professionals who are accelerating their growth with our platform.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <AnimatedSection key={index} delay={0.3 + index * 0.1}>
                <EnhancedCard variant="default" hover="lift" className="h-full bg-zinc-900/90 bg-opacity-80 backdrop-blur-lg border border-blue-700/40 shadow-lg shadow-blue-500/30 transition-transform duration-200 hover:scale-105 hover:shadow-[0_0_32px_0_rgba(80,0,255,0.5)]">
                  <div className="p-8 space-y-5">
                    <div className="flex items-center gap-2 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${i < testimonial.rating ? "text-yellow-500 fill-yellow-500" : "text-white"}`}
                        />
                      ))}
                    </div>
                    <p className="text-white italic text-base font-medium">"{testimonial.content}"</p>
                    <div className="flex items-center gap-4 pt-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-700/40">
                        <Image
                          src={`/images/user-${testimonial.name.split(" ")[0].toLowerCase()}.png`}
                          alt={`EliteScore testimonial user ${testimonial.name}`}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg">{testimonial.name}</div>
                        <div className="text-sm text-blue-300 font-medium">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                </EnhancedCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-1 bg-gradient-to-r from-blue-700 via-purple-700 to-fuchsia-500 opacity-20 my-8 rounded-full" />

      {/* CTA */}
      <section className="py-24 bg-black relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-black" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection delay={0.2} className="max-w-3xl mx-auto text-center">
            <h2 className="text-5xl md:text-6xl font-extrabold mb-8 bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(80,0,255,0.4)] tracking-tight">
              Ready to See How You Stack Up?
            </h2>
            <p className="text-white text-xl font-medium mb-12">
              Join our community of achievers and discover where you stand. Compare your skills, track real improvements, and grow faster with data-driven insights.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <EnhancedButton
                size="lg"
                variant="gradient"
                rounded="full"
                animation="shimmer"
                className="text-lg font-bold relative overflow-hidden group bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 border-2 border-blue-700/40 shadow-[0_0_32px_0_rgba(80,0,255,0.5)] focus-visible:ring-4 focus-visible:ring-fuchsia-500/60 transition-transform duration-200 hover:scale-105"
              >
                <Link href="/signup" className="flex items-center">
                  Unlock Your Potential
                  <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Link>
              </EnhancedButton>

              <Button size="lg" variant="outline" className="border-blue-700/40 hover:bg-blue-900 text-lg text-white shadow-[0_0_12px_0_rgba(80,0,255,0.2)] focus-visible:ring-4 focus-visible:ring-blue-500/60 transition-transform duration-200 hover:scale-105" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="h-6 w-6 text-blue-400" />
                <span className="text-white text-base font-medium">No credit card required</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="h-6 w-6 text-blue-400" />
                <span className="text-white text-base font-medium">Focused on balanced growth</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="h-6 w-6 text-blue-400" />
                <span className="text-white text-base font-medium">Actionable peer comparisons</span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  )
}

