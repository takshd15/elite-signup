"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X, Users, User } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// Mock data for connection requests
const connectionRequests = [
  {
    id: 1,
    name: "David Kim",
    title: "Frontend Developer at Netflix",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
    mutualConnections: 12,
    time: "2 days ago",
  },
  {
    id: 2,
    name: "Jessica Lee",
    title: "Product Manager at Spotify",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces",
    mutualConnections: 8,
    time: "3 days ago",
  },
  {
    id: 3,
    name: "Ryan Martinez",
    title: "Data Engineer at Airbnb",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=faces",
    mutualConnections: 5,
    time: "1 week ago",
  },
]

interface ConnectionRequestsProps {
  maxPreview?: number
}

export function ConnectionRequests({ maxPreview = 2 }: ConnectionRequestsProps) {
  const [requests, setRequests] = useState(connectionRequests)
  const [showDialog, setShowDialog] = useState(false)

  const handleAccept = (id: number) => {
    setRequests(requests.filter((request) => request.id !== id))
  }

  const handleReject = (id: number) => {
    setRequests(requests.filter((request) => request.id !== id))
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium flex items-center">
            <Users className="h-4 w-4 mr-2 text-primary-500" />
            Connection Requests
          </h3>
          {requests.length > 0 && (
            <Badge className="bg-primary-900/50 text-primary-300 border-primary-800 text-[10px]">
              {requests.length} new
            </Badge>
          )}
        </div>

        {requests.length > 0 ? (
          <>
            <div className="space-y-2">
              {requests.slice(0, maxPreview).map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center p-2 bg-zinc-800/50 rounded-lg"
                >
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={request.image} />
                    <AvatarFallback className="bg-zinc-800">{request.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{request.name}</h4>
                    <p className="text-xs text-zinc-400 truncate">{request.title}</p>
                    <p className="text-xs text-zinc-500">{request.mutualConnections} mutual connections</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-full bg-green-900/20 text-green-500 hover:bg-green-900/40 hover:text-green-400"
                      onClick={() => handleAccept(request.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-full bg-red-900/20 text-red-500 hover:bg-red-900/40 hover:text-red-400"
                      onClick={() => handleReject(request.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {requests.length > maxPreview && (
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                  <EnhancedButton
                    variant="outline"
                    size="sm"
                    className="w-full text-xs bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                  >
                    View All Requests ({requests.length})
                  </EnhancedButton>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                  <DialogHeader>
                    <DialogTitle>Connection Requests</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-y-auto py-2 space-y-2">
                    <AnimatePresence>
                      {requests.map((request) => (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center p-3 bg-zinc-800/50 rounded-lg"
                        >
                          <Avatar className="h-12 w-12 mr-3">
                            <AvatarImage src={request.image} />
                            <AvatarFallback className="bg-zinc-800">{request.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium">{request.name}</h4>
                            <p className="text-sm text-zinc-400">{request.title}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-xs text-zinc-500">{request.mutualConnections} mutual connections</p>
                              <p className="text-xs text-zinc-500">{request.time}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-2">
                            <EnhancedButton
                              size="sm"
                              variant="outline"
                              className="bg-green-900/20 border-green-800/30 text-green-500 hover:bg-green-900/40 hover:text-green-400"
                              onClick={() => handleAccept(request.id)}
                              leftIcon={<Check className="h-4 w-4" />}
                            >
                              Accept
                            </EnhancedButton>
                            <EnhancedButton
                              size="sm"
                              variant="outline"
                              className="bg-red-900/20 border-red-800/30 text-red-500 hover:bg-red-900/40 hover:text-red-400"
                              onClick={() => handleReject(request.id)}
                              leftIcon={<X className="h-4 w-4" />}
                            >
                              Decline
                            </EnhancedButton>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </>
        ) : (
          <div className="text-center py-6 bg-zinc-800/30 rounded-lg">
            <User className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">No pending requests</p>
          </div>
        )}
      </div>
    </>
  )
}

