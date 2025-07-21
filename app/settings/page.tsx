"use client"

import { Badge } from "@/components/ui/badge"

import { useState } from "react"
import {
  Settings,
  User,
  Bell,
  Lock,
  Globe,
  Moon,
  Sun,
  Smartphone,
  LogOut,
  ChevronRight,
  Check,
  Save,
} from "lucide-react"
import { motion } from "framer-motion"

import { DashboardLayout } from "@/components/dashboard-layout"
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from "@/components/ui/enhanced-card"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { AnimatedSection } from "@/components/ui/animated-section"

export default function SettingsPage() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark")
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(true)
  const [mentionNotifications, setMentionNotifications] = useState(true)
  const [connectionRequests, setConnectionRequests] = useState(true)
  const [twoFactorAuth, setTwoFactorAuth] = useState(false)
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    activityVisibility: "connections",
    searchVisibility: "everyone",
  })

  // Settings sections
  const settingsSections = [
    {
      id: "account",
      title: "Account Settings",
      icon: <User className="h-5 w-5" />,
      description: "Manage your account information and preferences",
    },
    {
      id: "notifications",
      title: "Notifications",
      icon: <Bell className="h-5 w-5" />,
      description: "Control how you receive notifications",
    },
    {
      id: "security",
      title: "Security & Privacy",
      icon: <Lock className="h-5 w-5" />,
      description: "Manage your security settings and privacy preferences",
    },
    {
      id: "appearance",
      title: "Appearance",
      icon: <Moon className="h-5 w-5" />,
      description: "Customize how Strivio looks for you",
    },
    {
      id: "devices",
      title: "Devices & Sessions",
      icon: <Smartphone className="h-5 w-5" />,
      description: "Manage your connected devices and active sessions",
    },
  ]

  const [activeSection, setActiveSection] = useState("account")

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Settings Navigation */}
          <div className="md:w-1/4">
            <AnimatedSection delay={0.1}>
              <EnhancedCard variant="default" className="bg-zinc-900/50 border-zinc-800 sticky top-20">
                <EnhancedCardHeader className="pb-2">
                  <EnhancedCardTitle className="text-lg flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-primary-500" />
                    Settings
                  </EnhancedCardTitle>
                </EnhancedCardHeader>
                <EnhancedCardContent className="p-0">
                  <nav className="space-y-1">
                    {settingsSections.map((section) => (
                      <button
                        key={section.id}
                        className={cn(
                          "w-full flex items-center p-3 text-left transition-colors",
                          activeSection === section.id
                            ? "bg-primary-900/20 text-primary-500"
                            : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white",
                        )}
                        onClick={() => setActiveSection(section.id)}
                      >
                        <div className="mr-3">{section.icon}</div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{section.title}</div>
                          <div className="text-xs text-zinc-500 hidden md:block">{section.description}</div>
                        </div>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            activeSection === section.id && "transform rotate-90",
                          )}
                        />
                      </button>
                    ))}

                    <Separator className="my-2 bg-zinc-800" />

                    <button
                      className="w-full flex items-center p-3 text-left text-red-500 hover:bg-red-900/10 transition-colors"
                      onClick={() => console.log("Logout")}
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      <div className="font-medium text-sm">Log Out</div>
                    </button>
                  </nav>
                </EnhancedCardContent>
              </EnhancedCard>
            </AnimatedSection>
          </div>

          {/* Settings Content */}
          <div className="md:w-3/4 space-y-6">
            {/* Account Settings */}
            {activeSection === "account" && (
              <AnimatedSection delay={0.2}>
                <EnhancedCard variant="default" className="bg-zinc-900/50 border-zinc-800">
                  <EnhancedCardHeader className="pb-2">
                    <EnhancedCardTitle className="text-lg flex items-center">
                      <User className="h-5 w-5 mr-2 text-primary-500" />
                      Account Settings
                    </EnhancedCardTitle>
                  </EnhancedCardHeader>
                  <EnhancedCardContent className="p-4">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Profile Information</h3>
                        <p className="text-xs text-zinc-400">
                          Manage your personal information and how it appears on your profile
                        </p>
                        <div className="bg-zinc-800/50 rounded-lg p-4 mt-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium">Personal Information</div>
                              <div className="text-xs text-zinc-500">Name, email, bio, and profile picture</div>
                            </div>
                            <EnhancedButton
                              variant="outline"
                              size="sm"
                              rounded="full"
                              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                            >
                              Edit
                            </EnhancedButton>
                          </div>
                        </div>
                        <div className="bg-zinc-800/50 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium">Professional Information</div>
                              <div className="text-xs text-zinc-500">Work experience, education, and skills</div>
                            </div>
                            <EnhancedButton
                              variant="outline"
                              size="sm"
                              rounded="full"
                              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                            >
                              Edit
                            </EnhancedButton>
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-zinc-800" />

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Account Preferences</h3>
                        <p className="text-xs text-zinc-400">Manage your account settings and preferences</p>
                        <div className="bg-zinc-800/50 rounded-lg p-4 mt-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium">Language</div>
                              <div className="text-xs text-zinc-500">English (United States)</div>
                            </div>
                            <EnhancedButton
                              variant="outline"
                              size="sm"
                              rounded="full"
                              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                            >
                              Change
                            </EnhancedButton>
                          </div>
                        </div>
                        <div className="bg-zinc-800/50 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium">Time Zone</div>
                              <div className="text-xs text-zinc-500">Pacific Time (US & Canada)</div>
                            </div>
                            <EnhancedButton
                              variant="outline"
                              size="sm"
                              rounded="full"
                              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                            >
                              Change
                            </EnhancedButton>
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-zinc-800" />

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-red-500">Danger Zone</h3>
                        <p className="text-xs text-zinc-400">Permanent actions that affect your account</p>
                        <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-4 mt-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium text-red-400">Delete Account</div>
                              <div className="text-xs text-zinc-500">Permanently delete your account and all data</div>
                            </div>
                            <EnhancedButton
                              variant="outline"
                              size="sm"
                              rounded="full"
                              className="bg-red-900/20 border-red-900/30 text-red-500 hover:bg-red-900/30"
                            >
                              Delete
                            </EnhancedButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
              </AnimatedSection>
            )}

            {/* Notifications Settings */}
            {activeSection === "notifications" && (
              <AnimatedSection delay={0.2}>
                <EnhancedCard variant="default" className="bg-zinc-900/50 border-zinc-800">
                  <EnhancedCardHeader className="pb-2">
                    <EnhancedCardTitle className="text-lg flex items-center">
                      <Bell className="h-5 w-5 mr-2 text-primary-500" />
                      Notification Settings
                    </EnhancedCardTitle>
                  </EnhancedCardHeader>
                  <EnhancedCardContent className="p-4">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Email Notifications</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="email-notifications" className="flex items-center gap-2">
                              <span>Email Notifications</span>
                              <Badge className="bg-primary-900/50 text-primary-300 border-primary-800 text-[10px]">
                                All
                              </Badge>
                            </Label>
                            <Switch
                              id="email-notifications"
                              checked={emailNotifications}
                              onCheckedChange={setEmailNotifications}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="weekly-digest" className="flex items-center gap-2">
                              <span>Weekly Digest</span>
                              <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px]">Summary</Badge>
                            </Label>
                            <Switch id="weekly-digest" checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-zinc-800" />

                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Push Notifications</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="push-notifications" className="flex items-center gap-2">
                              <span>Push Notifications</span>
                              <Badge className="bg-primary-900/50 text-primary-300 border-primary-800 text-[10px]">
                                All
                              </Badge>
                            </Label>
                            <Switch
                              id="push-notifications"
                              checked={pushNotifications}
                              onCheckedChange={setPushNotifications}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="mention-notifications">Mentions & Comments</Label>
                            <Switch
                              id="mention-notifications"
                              checked={mentionNotifications}
                              onCheckedChange={setMentionNotifications}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="connection-requests">Connection Requests</Label>
                            <Switch
                              id="connection-requests"
                              checked={connectionRequests}
                              onCheckedChange={setConnectionRequests}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <EnhancedButton
                          variant="gradient"
                          rounded="full"
                          animation="shimmer"
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          Save Changes
                        </EnhancedButton>
                      </div>
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
              </AnimatedSection>
            )}

            {/* Security & Privacy Settings */}
            {activeSection === "security" && (
              <AnimatedSection delay={0.2}>
                <EnhancedCard variant="default" className="bg-zinc-900/50 border-zinc-800">
                  <EnhancedCardHeader className="pb-2">
                    <EnhancedCardTitle className="text-lg flex items-center">
                      <Lock className="h-5 w-5 mr-2 text-primary-500" />
                      Security & Privacy
                    </EnhancedCardTitle>
                  </EnhancedCardHeader>
                  <EnhancedCardContent className="p-4">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Security Settings</h3>
                        <div className="bg-zinc-800/50 rounded-lg p-4 mt-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium">Password</div>
                              <div className="text-xs text-zinc-500">Last changed 3 months ago</div>
                            </div>
                            <EnhancedButton
                              variant="outline"
                              size="sm"
                              rounded="full"
                              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                            >
                              Change
                            </EnhancedButton>
                          </div>
                        </div>
                        <div className="bg-zinc-800/50 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium">Two-Factor Authentication</div>
                              <div className="text-xs text-zinc-500">{twoFactorAuth ? "Enabled" : "Disabled"}</div>
                            </div>
                            <Switch checked={twoFactorAuth} onCheckedChange={setTwoFactorAuth} />
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-zinc-800" />

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Privacy Settings</h3>
                        <div className="space-y-4 mt-2">
                          <div className="bg-zinc-800/50 rounded-lg p-4">
                            <div className="space-y-3">
                              <div className="text-sm font-medium">Profile Visibility</div>
                              <RadioGroup
                                value={privacySettings.profileVisibility}
                                onValueChange={(value) =>
                                  setPrivacySettings({ ...privacySettings, profileVisibility: value })
                                }
                                className="space-y-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="public" id="profile-public" />
                                  <Label htmlFor="profile-public">Public</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="connections" id="profile-connections" />
                                  <Label htmlFor="profile-connections">Connections Only</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="private" id="profile-private" />
                                  <Label htmlFor="profile-private">Private</Label>
                                </div>
                              </RadioGroup>
                            </div>
                          </div>

                          <div className="bg-zinc-800/50 rounded-lg p-4">
                            <div className="space-y-3">
                              <div className="text-sm font-medium">Activity Visibility</div>
                              <RadioGroup
                                value={privacySettings.activityVisibility}
                                onValueChange={(value) =>
                                  setPrivacySettings({ ...privacySettings, activityVisibility: value })
                                }
                                className="space-y-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="public" id="activity-public" />
                                  <Label htmlFor="activity-public">Public</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="connections" id="activity-connections" />
                                  <Label htmlFor="activity-connections">Connections Only</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="private" id="activity-private" />
                                  <Label htmlFor="activity-private">Private</Label>
                                </div>
                              </RadioGroup>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <EnhancedButton
                          variant="gradient"
                          rounded="full"
                          animation="shimmer"
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          Save Changes
                        </EnhancedButton>
                      </div>
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
              </AnimatedSection>
            )}

            {/* Appearance Settings */}
            {activeSection === "appearance" && (
              <AnimatedSection delay={0.2}>
                <EnhancedCard variant="default" className="bg-zinc-900/50 border-zinc-800">
                  <EnhancedCardHeader className="pb-2">
                    <EnhancedCardTitle className="text-lg flex items-center">
                      <Moon className="h-5 w-5 mr-2 text-primary-500" />
                      Appearance
                    </EnhancedCardTitle>
                  </EnhancedCardHeader>
                  <EnhancedCardContent className="p-4">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Theme</h3>
                        <p className="text-xs text-zinc-400">Choose how Strivio looks for you</p>
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <motion.div
                            className={cn(
                              "border rounded-lg p-4 cursor-pointer transition-all",
                              theme === "light"
                                ? "border-primary-500 bg-primary-900/10"
                                : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900",
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setTheme("light")}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <div className="bg-white text-black rounded-full p-2">
                                <Sun className="h-5 w-5" />
                              </div>
                              <span className="text-sm font-medium">Light</span>
                              {theme === "light" && (
                                <div className="absolute top-2 right-2 h-4 w-4 bg-primary-500 rounded-full flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                          </motion.div>

                          <motion.div
                            className={cn(
                              "border rounded-lg p-4 cursor-pointer transition-all",
                              theme === "dark"
                                ? "border-primary-500 bg-primary-900/10"
                                : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900",
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setTheme("dark")}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <div className="bg-zinc-900 text-white rounded-full p-2">
                                <Moon className="h-5 w-5" />
                              </div>
                              <span className="text-sm font-medium">Dark</span>
                              {theme === "dark" && (
                                <div className="absolute top-2 right-2 h-4 w-4 bg-primary-500 rounded-full flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                          </motion.div>

                          <motion.div
                            className={cn(
                              "border rounded-lg p-4 cursor-pointer transition-all",
                              theme === "system"
                                ? "border-primary-500 bg-primary-900/10"
                                : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900",
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setTheme("system")}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <div className="bg-gradient-to-r from-white to-zinc-900 rounded-full p-2">
                                <Globe className="h-5 w-5" />
                              </div>
                              <span className="text-sm font-medium">System</span>
                              {theme === "system" && (
                                <div className="absolute top-2 right-2 h-4 w-4 bg-primary-500 rounded-full flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </div>
                      </div>

                      <Separator className="bg-zinc-800" />

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Accent Color</h3>
                        <p className="text-xs text-zinc-400">Choose your preferred accent color</p>
                        <div className="grid grid-cols-5 gap-3 mt-3">
                          {["purple", "blue", "green", "red", "orange"].map((color) => (
                            <motion.div
                              key={color}
                              className={cn(
                                "h-10 rounded-lg cursor-pointer transition-all border-2",
                                color === "purple"
                                  ? "bg-purple-500 border-purple-300"
                                  : color === "blue"
                                    ? "bg-blue-500 border-blue-500"
                                    : color === "green"
                                      ? "bg-green-500 border-green-500"
                                      : color === "red"
                                        ? "bg-red-500 border-red-500"
                                        : "bg-orange-500 border-orange-500",
                              )}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <EnhancedButton
                          variant="gradient"
                          rounded="full"
                          animation="shimmer"
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          Save Changes
                        </EnhancedButton>
                      </div>
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
              </AnimatedSection>
            )}

            {/* Devices & Sessions Settings */}
            {activeSection === "devices" && (
              <AnimatedSection delay={0.2}>
                <EnhancedCard variant="default" className="bg-zinc-900/50 border-zinc-800">
                  <EnhancedCardHeader className="pb-2">
                    <EnhancedCardTitle className="text-lg flex items-center">
                      <Smartphone className="h-5 w-5 mr-2 text-primary-500" />
                      Devices & Sessions
                    </EnhancedCardTitle>
                  </EnhancedCardHeader>
                  <EnhancedCardContent className="p-4">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Current Session</h3>
                        <div className="bg-primary-900/10 border border-primary-800/30 rounded-lg p-4 mt-2">
                          <div className="flex items-start">
                            <div className="bg-primary-900/30 p-2 rounded-full mr-3">
                              <Smartphone className="h-5 w-5 text-primary-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center">
                                <div className="text-sm font-medium">Chrome on MacBook Pro</div>
                                <Badge className="ml-2 bg-primary-900/50 text-primary-300 border-primary-800 text-[10px]">
                                  Current
                                </Badge>
                              </div>
                              <div className="text-xs text-zinc-400 mt-1">San Francisco, CA, USA</div>
                              <div className="text-xs text-zinc-500 mt-1">Last active: Just now</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Active Sessions</h3>
                        <div className="space-y-3 mt-2">
                          <div className="bg-zinc-800/50 rounded-lg p-4">
                            <div className="flex items-start">
                              <div className="bg-zinc-800 p-2 rounded-full mr-3">
                                <Smartphone className="h-5 w-5 text-zinc-400" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium">Safari on iPhone 13</div>
                                <div className="text-xs text-zinc-400 mt-1">San Francisco, CA, USA</div>
                                <div className="text-xs text-zinc-500 mt-1">Last active: 2 hours ago</div>
                              </div>
                              <EnhancedButton
                                variant="outline"
                                size="sm"
                                rounded="full"
                                className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                              >
                                Log Out
                              </EnhancedButton>
                            </div>
                          </div>

                          <div className="bg-zinc-800/50 rounded-lg p-4">
                            <div className="flex items-start">
                              <div className="bg-zinc-800 p-2 rounded-full mr-3">
                                <Smartphone className="h-5 w-5 text-zinc-400" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium">Firefox on Windows PC</div>
                                <div className="text-xs text-zinc-400 mt-1">New York, NY, USA</div>
                                <div className="text-xs text-zinc-500 mt-1">Last active: 3 days ago</div>
                              </div>
                              <EnhancedButton
                                variant="outline"
                                size="sm"
                                rounded="full"
                                className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                              >
                                Log Out
                              </EnhancedButton>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <EnhancedButton
                          variant="outline"
                          rounded="full"
                          className="bg-red-900/20 border-red-900/30 text-red-500 hover:bg-red-900/30"
                        >
                          Log Out of All Devices
                        </EnhancedButton>
                      </div>
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
              </AnimatedSection>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

