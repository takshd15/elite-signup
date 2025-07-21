"use client"

import { useState } from "react"
import { SearchIcon, Users, User, TrendingUp, X, Plus, Trophy, Filter } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// Mock data for communities
const communities = [
  {
    id: 1,
    name: "Fitness Enthusiasts",
    members: 12453,
    category: "Fitness",
    description: "A community dedicated to fitness goals, workout routines, and healthy living.",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=150&h=150&fit=crop",
    joined: false,
    trending: true,
  },
  {
    id: 2,
    name: "Productivity Masters",
    members: 8762,
    category: "Productivity",
    description: "Share tips, tools, and techniques to maximize your productivity and achieve more.",
    image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=150&h=150&fit=crop",
    joined: true,
    trending: true,
  },
  {
    id: 3,
    name: "Mindfulness Practice",
    members: 6291,
    category: "Wellness",
    description: "Learn and practice mindfulness techniques for better mental health and focus.",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=150&h=150&fit=crop",
    joined: false,
    trending: false,
  },
  {
    id: 4,
    name: "Career Growth",
    members: 9845,
    category: "Career",
    description: "Strategies and support for advancing your career and professional development.",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=150&h=150&fit=crop",
    joined: false,
    trending: true,
  },
  {
    id: 5,
    name: "Financial Freedom",
    members: 7321,
    category: "Finance",
    description: "Building wealth, investing wisely, and achieving financial independence.",
    image: "https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?w=150&h=150&fit=crop",
    joined: false,
    trending: false,
  },
  {
    id: 6,
    name: "Creative Writers",
    members: 4532,
    category: "Creativity",
    description: "A space for writers to share their work, get feedback, and improve their craft.",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=150&h=150&fit=crop",
    joined: false,
    trending: false,
  },
]

// Mock data for users
const users = [
  {
    id: 1,
    name: "Alex Johnson",
    username: "alex_improvement",
    bio: "Fitness coach | Helping you reach your potential",
    image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces",
    following: false,
    verified: true,
  },
  {
    id: 2,
    name: "Sarah Williams",
    username: "mindful_sarah",
    bio: "Mindfulness practitioner | Daily growth",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
    following: true,
    verified: true,
  },
  {
    id: 3,
    name: "Michael Chen",
    username: "productivity_mike",
    bio: "Productivity expert | Author | Speaker",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
    following: false,
    verified: false,
  },
  {
    id: 4,
    name: "Emily Rodriguez",
    username: "finance_emily",
    bio: "Financial advisor | Helping you build wealth",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces",
    following: false,
    verified: true,
  },
]

// Mock data for leaderboard
const leaderboardData = [
  {
    id: 1,
    name: "Sarah Williams",
    username: "mindful_sarah",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
    points: 12450,
    rank: 1,
  },
  {
    id: 2,
    name: "Alex Johnson",
    username: "alex_improvement",
    image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces",
    points: 10890,
    rank: 2,
  },
  {
    id: 3,
    name: "Michael Chen",
    username: "productivity_mike",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
    points: 9675,
    rank: 3,
  },
  {
    id: 4,
    name: "Emily Rodriguez",
    username: "finance_emily",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces",
    points: 8320,
    rank: 4,
  },
  {
    id: 5,
    name: "David Kim",
    username: "fitness_david",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
    points: 7890,
    rank: 5,
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

export default function SearchClientPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [joinedCommunities, setJoinedCommunities] = useState<number[]>(
    communities.filter((c) => c.joined).map((c) => c.id),
  )
  const [followedUsers, setFollowedUsers] = useState<number[]>(users.filter((u) => u.following).map((u) => u.id))
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  // Filter communities based on search query and category
  const filteredCommunities = communities.filter((community) => {
    const matchesSearch =
      searchQuery === "" ||
      community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === "All" || community.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Filter users based on search query
  const filteredUsers = users.filter(
    (user) =>
      searchQuery === "" ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.bio.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Handle joining/leaving a community
  const toggleJoinCommunity = (communityId: number) => {
    if (joinedCommunities.includes(communityId)) {
      setJoinedCommunities(joinedCommunities.filter((id) => id !== communityId))
    } else {
      setJoinedCommunities([...joinedCommunities, communityId])
    }
  }

  // Handle following/unfollowing a user
  const toggleFollowUser = (userId: number) => {
    if (followedUsers.includes(userId)) {
      setFollowedUsers(followedUsers.filter((id) => id !== userId))
    } else {
      setFollowedUsers([...followedUsers, userId])
    }
  }

  // Clear search query
  const clearSearch = () => {
    setSearchQuery("")
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        {/* Search Bar */}
        <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-lg border-b border-zinc-800 px-4 py-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search communities and users..."
              className="pl-10 pr-10 py-2 bg-zinc-900 border-zinc-800 rounded-full text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 text-zinc-400 hover:text-white"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Categories Scroll */}
        <ScrollArea className="w-full whitespace-nowrap py-3 border-b border-zinc-800">
          <div className="flex gap-2 px-4">
            {categories.map((category) => (
              <Button
                key={category}
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-full text-xs",
                  selectedCategory === category
                    ? "bg-purple-900/30 border-purple-500 text-white"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400",
                )}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <div className="sticky top-[69px] z-10 bg-black/95 backdrop-blur-lg border-b border-zinc-800">
            <TabsList className="w-full flex justify-between bg-transparent h-12 p-0">
              <TabsTrigger
                value="all"
                className={cn(
                  "flex-1 rounded-none h-full data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  activeTab === "all" ? "text-purple-500 border-b-2 border-purple-500" : "text-zinc-400",
                )}
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="communities"
                className={cn(
                  "flex-1 rounded-none h-full data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  activeTab === "communities" ? "text-purple-500 border-b-2 border-purple-500" : "text-zinc-400",
                )}
              >
                <Users className="h-4 w-4 mr-2" />
                Communities
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className={cn(
                  "flex-1 rounded-none h-full data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  activeTab === "users" ? "text-purple-500 border-b-2 border-purple-500" : "text-zinc-400",
                )}
              >
                <User className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger
                value="leaderboard"
                className={cn(
                  "flex-1 rounded-none h-full data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  activeTab === "leaderboard" ? "text-purple-500 border-b-2 border-purple-500" : "text-zinc-400",
                )}
                onClick={() => setShowLeaderboard(true)}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Leaderboard
              </TabsTrigger>
            </TabsList>
          </div>

          {/* All Tab Content */}
          <TabsContent value="all" className="mt-0 px-4 py-4 space-y-6">
            {/* Trending Communities Section */}
            {!searchQuery && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-purple-500" />
                    Trending Communities
                  </h2>
                  <Button variant="link" className="text-purple-500 text-sm p-0">
                    See All
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {communities
                    .filter((c) => c.trending)
                    .map((community) => (
                      <CommunityCard
                        key={community.id}
                        community={community}
                        isJoined={joinedCommunities.includes(community.id)}
                        onJoinToggle={() => toggleJoinCommunity(community.id)}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchQuery && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Search Results</h2>

                {filteredCommunities.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-zinc-400">Communities</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {filteredCommunities.slice(0, 3).map((community) => (
                        <CommunityCard
                          key={community.id}
                          community={community}
                          isJoined={joinedCommunities.includes(community.id)}
                          onJoinToggle={() => toggleJoinCommunity(community.id)}
                        />
                      ))}
                    </div>
                    {filteredCommunities.length > 3 && (
                      <Button variant="link" className="text-purple-500 text-sm p-0">
                        See more communities
                      </Button>
                    )}
                  </div>
                )}

                {filteredUsers.length > 0 && (
                  <div className="space-y-4 mt-6">
                    <h3 className="text-sm font-medium text-zinc-400">Users</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {filteredUsers.slice(0, 3).map((user) => (
                        <UserCard
                          key={user.id}
                          user={user}
                          isFollowing={followedUsers.includes(user.id)}
                          onFollowToggle={() => toggleFollowUser(user.id)}
                        />
                      ))}
                    </div>
                    {filteredUsers.length > 3 && (
                      <Button variant="link" className="text-purple-500 text-sm p-0">
                        See more users
                      </Button>
                    )}
                  </div>
                )}

                {filteredCommunities.length === 0 && filteredUsers.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-zinc-400 mb-2">No results found for "{searchQuery}"</div>
                    <div className="text-sm text-zinc-500">Try different keywords or browse trending communities</div>
                  </div>
                )}
              </div>
            )}

            {/* Suggested For You */}
            {!searchQuery && (
              <div className="space-y-4 mt-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Suggested For You</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1 rounded-full bg-zinc-900 border-zinc-800"
                  >
                    <Filter className="h-3 w-3" />
                    Filter
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {communities
                    .filter((c) => !c.trending && !joinedCommunities.includes(c.id))
                    .slice(0, 3)
                    .map((community) => (
                      <CommunityCard
                        key={community.id}
                        community={community}
                        isJoined={joinedCommunities.includes(community.id)}
                        onJoinToggle={() => toggleJoinCommunity(community.id)}
                      />
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-4 mt-6">
                  {users
                    .filter((u) => !followedUsers.includes(u.id))
                    .slice(0, 2)
                    .map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        isFollowing={followedUsers.includes(user.id)}
                        onFollowToggle={() => toggleFollowUser(user.id)}
                      />
                    ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Communities Tab Content */}
          <TabsContent value="communities" className="mt-0 px-4 py-4 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Communities</h2>
              <Button variant="outline" size="sm" className="text-xs gap-1 rounded-full bg-zinc-900 border-zinc-800">
                <Filter className="h-3 w-3" />
                Filter
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredCommunities.map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  isJoined={joinedCommunities.includes(community.id)}
                  onJoinToggle={() => toggleJoinCommunity(community.id)}
                />
              ))}
            </div>

            {filteredCommunities.length === 0 && (
              <div className="text-center py-8">
                <div className="text-zinc-400 mb-2">No communities found</div>
                <div className="text-sm text-zinc-500">Try different keywords or categories</div>
              </div>
            )}
          </TabsContent>

          {/* Users Tab Content */}
          <TabsContent value="users" className="mt-0 px-4 py-4 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Users</h2>
              <Button variant="outline" size="sm" className="text-xs gap-1 rounded-full bg-zinc-900 border-zinc-800">
                <Filter className="h-3 w-3" />
                Filter
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isFollowing={followedUsers.includes(user.id)}
                  onFollowToggle={() => toggleFollowUser(user.id)}
                />
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <div className="text-zinc-400 mb-2">No users found</div>
                <div className="text-sm text-zinc-500">Try different keywords</div>
              </div>
            )}
          </TabsContent>

          {/* Leaderboard Tab Content */}
          <TabsContent value="leaderboard" className="mt-0 px-4 py-4 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center">
                <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                Global Leaderboard
              </h2>
              <Button variant="outline" size="sm" className="text-xs gap-1 rounded-full bg-zinc-900 border-zinc-800">
                This Week
              </Button>
            </div>

            <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
              <CardContent className="p-0">
                {leaderboardData.map((user, index) => (
                  <div key={user.id}>
                    <div
                      className={cn(
                        "flex items-center p-4",
                        index === 0
                          ? "bg-yellow-500/10"
                          : index === 1
                            ? "bg-zinc-300/10"
                            : index === 2
                              ? "bg-amber-700/10"
                              : "",
                      )}
                    >
                      <div className="flex items-center flex-1">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center mr-3 font-bold text-sm",
                            index === 0
                              ? "bg-yellow-500 text-black"
                              : index === 1
                                ? "bg-zinc-300 text-black"
                                : index === 2
                                  ? "bg-amber-700 text-white"
                                  : "bg-zinc-800 text-white",
                          )}
                        >
                          {user.rank}
                        </div>
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={user.image} />
                          <AvatarFallback className="bg-zinc-800">{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-zinc-400">@{user.username}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{user.points.toLocaleString()}</div>
                        <div className="text-xs text-zinc-400">XP</div>
                      </div>
                    </div>
                    {index < leaderboardData.length - 1 && <Separator className="bg-zinc-800" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="text-center mt-4">
              <div className="text-sm text-zinc-400 mb-2">Your Rank: #42</div>
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                View Your Progress
              </Button>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Community Leaderboards</h3>
              <div className="grid grid-cols-1 gap-4">
                {communities
                  .filter((c) => joinedCommunities.includes(c.id))
                  .slice(0, 2)
                  .map((community) => (
                    <Card key={community.id} className="bg-zinc-900/50 border-zinc-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={community.image} />
                              <AvatarFallback className="bg-zinc-800">{community.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{community.name}</div>
                              <div className="text-xs text-zinc-400">{community.members.toLocaleString()} members</div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="text-xs bg-zinc-800 border-zinc-700">
                            View
                          </Button>
                        </div>
                        <div className="text-xs text-zinc-400">Your rank: #12 of 345</div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Community Card Component
interface CommunityCardProps {
  community: (typeof communities)[0]
  isJoined: boolean
  onJoinToggle: () => void
}

function CommunityCard({ community, isJoined, onJoinToggle }: CommunityCardProps) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 rounded-lg">
            <AvatarImage src={community.image} />
            <AvatarFallback className="bg-zinc-800 rounded-lg">{community.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-medium truncate">{community.name}</div>
              {community.trending && (
                <Badge className="bg-purple-900/50 text-purple-300 border-purple-800 text-[10px]">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Trending
                </Badge>
              )}
            </div>
            <div className="text-xs text-zinc-400 mt-1">{community.members.toLocaleString()} members</div>
            <div className="text-sm text-zinc-300 mt-2 line-clamp-2">{community.description}</div>
          </div>
          <Button
            variant={isJoined ? "outline" : "default"}
            size="sm"
            className={cn(
              "rounded-full h-8 px-3 flex-shrink-0",
              isJoined
                ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700",
            )}
            onClick={onJoinToggle}
          >
            {isJoined ? (
              "Joined"
            ) : (
              <>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Join
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// User Card Component
interface UserCardProps {
  user: (typeof users)[0]
  isFollowing: boolean
  onFollowToggle: () => void
}

function UserCard({ user, isFollowing, onFollowToggle }: UserCardProps) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.image} />
            <AvatarFallback className="bg-zinc-800">{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-medium truncate">{user.name}</div>
              {user.verified && (
                <svg className="h-4 w-4 text-purple-500 fill-current" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              )}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">@{user.username}</div>
            <div className="text-sm text-zinc-300 mt-2 line-clamp-1">{user.bio}</div>
          </div>
          <Button
            variant={isFollowing ? "outline" : "default"}
            size="sm"
            className={cn(
              "rounded-full h-8 px-3 flex-shrink-0",
              isFollowing
                ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700",
            )}
            onClick={onFollowToggle}
          >
            {isFollowing ? "Following" : "Follow"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

