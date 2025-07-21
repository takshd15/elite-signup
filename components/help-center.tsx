"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, HelpCircle, ChevronRight, ChevronDown, Play, FileText, Book, MessageCircle } from "lucide-react"

import { Input } from "@/components/ui/input"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { EnhancedCard, EnhancedCardContent } from "@/components/ui/enhanced-card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Mock data for FAQ categories
const faqCategories = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: <Play className="h-5 w-5" />,
    color: "bg-primary-500/20 text-primary-500 border-primary-500/30",
    questions: [
      {
        id: 1,
        question: "How do I create an account?",
        answer:
          "To create an account, click on the 'Sign Up' button on the login page. Fill in your details including name, email, and password. You can also sign up using your Google or Apple account for faster registration.",
      },
      {
        id: 2,
        question: "What is the XP system?",
        answer:
          "XP (Experience Points) is our gamified system that rewards you for completing tasks, achieving goals, and engaging with the community. As you earn XP, you'll level up and unlock new features and achievements.",
      },
      {
        id: 3,
        question: "How do I set my first goal?",
        answer:
          "Navigate to the Goals tab and click on 'Create New Goal'. You can choose from our suggested goals or create a custom one. Define your timeline, milestones, and track your progress as you work towards achieving it.",
      },
    ],
  },
  {
    id: "account-settings",
    title: "Account Settings",
    icon: <FileText className="h-5 w-5" />,
    color: "bg-secondary-500/20 text-secondary-500 border-secondary-500/30",
    questions: [
      {
        id: 4,
        question: "How do I change my password?",
        answer:
          "Go to Settings > Security > Change Password. You'll need to enter your current password and then your new password twice to confirm the change.",
      },
      {
        id: 5,
        question: "Can I change my username?",
        answer:
          "Yes, you can change your username once every 30 days. Go to Settings > Profile > Edit Username. Note that if you change your username, your profile URL will also change.",
      },
    ],
  },
  {
    id: "features",
    title: "Features & Tools",
    icon: <Book className="h-5 w-5" />,
    color: "bg-accent-success/20 text-accent-success border-accent-success/30",
    questions: [
      {
        id: 6,
        question: "What are communities?",
        answer:
          "Communities are groups of like-minded individuals focused on specific topics or goals. You can join existing communities or create your own to connect with others, share resources, and collaborate on projects.",
      },
      {
        id: 7,
        question: "How does the mentorship feature work?",
        answer:
          "Our mentorship feature connects you with experienced professionals in your field. You can book one-on-one sessions, join group workshops, or participate in Q&A sessions to get personalized guidance and advice.",
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: <HelpCircle className="h-5 w-5" />,
    color: "bg-accent-error/20 text-accent-error border-accent-error/30",
    questions: [
      {
        id: 8,
        question: "I forgot my password. What should I do?",
        answer:
          "On the login page, click on 'Forgot Password'. Enter the email associated with your account, and we'll send you a password reset link. Follow the instructions in the email to create a new password.",
      },
      {
        id: 9,
        question: "The app is running slowly. How can I fix this?",
        answer:
          "Try clearing your browser cache and cookies, or try using a different browser. If you're using our mobile app, make sure you have the latest version installed. If problems persist, please contact our support team.",
      },
    ],
  },
]

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedCategory, setExpandedCategory] = useState<string | null>("getting-started")
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null)

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
  }

  const toggleQuestion = (questionId: number) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId)
  }

  // Filter questions based on search query
  const filteredCategories = faqCategories
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          searchQuery === "" ||
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((category) => category.questions.length > 0)

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">How can we help you?</h2>
        <p className="text-zinc-400 mb-4">Search our knowledge base or browse the categories below</p>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search for answers..."
            className="pl-10 py-6 h-12 bg-zinc-800 border-zinc-700 text-white rounded-xl shadow-sm focus:border-primary-500 transition-all duration-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCategories.map((category) => (
          <EnhancedCard key={category.id} variant="default" hover="lift" className="bg-zinc-900/50 border-zinc-800">
            <EnhancedCardContent className="p-4">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center">
                  <div className={cn("p-2 rounded-full mr-3", category.color)}>{category.icon}</div>
                  <div>
                    <h3 className="font-medium">{category.title}</h3>
                    <p className="text-xs text-zinc-400">{category.questions.length} articles</p>
                  </div>
                </div>
                <Badge className={cn("text-[10px]", category.color)}>
                  {expandedCategory === category.id ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Badge>
              </div>

              {expandedCategory === category.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 space-y-3"
                >
                  {category.questions.map((question) => (
                    <div key={question.id} className="border border-zinc-800 rounded-lg overflow-hidden">
                      <div
                        className="p-3 bg-zinc-800/50 flex items-center justify-between cursor-pointer"
                        onClick={() => toggleQuestion(question.id)}
                      >
                        <h4 className="text-sm font-medium">{question.question}</h4>
                        {expandedQuestion === question.id ? (
                          <ChevronDown className="h-4 w-4 text-zinc-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-zinc-400" />
                        )}
                      </div>

                      {expandedQuestion === question.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="p-3 text-sm text-zinc-300"
                        >
                          {question.answer}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </EnhancedCardContent>
          </EnhancedCard>
        ))}
      </div>

      <div className="bg-gradient-to-r from-primary-900/20 to-secondary-900/20 border border-primary-800/30 rounded-xl p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Still need help?</h3>
        <p className="text-zinc-400 mb-4">Our support team is ready to assist you with any questions</p>
        <EnhancedButton
          variant="gradient"
          rounded="full"
          animation="shimmer"
          leftIcon={<MessageCircle className="h-4 w-4" />}
        >
          Contact Support
        </EnhancedButton>
      </div>
    </div>
  )
}

