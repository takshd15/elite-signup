"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CalendarIcon, Clock, Plus, ChevronLeft, ChevronRight, MoreHorizontal, Check } from "lucide-react"
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from "date-fns"

import { Button } from "@/components/ui/button"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from "@/components/ui/enhanced-card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// Mock data for calendar events
const events = [
  {
    id: 1,
    title: "Complete System Design Assignment",
    date: new Date(2023, 5, 15),
    startTime: "14:00",
    endTime: "16:00",
    category: "Learning",
    color: "bg-primary-500/20 text-primary-500 border-primary-500/30",
    completed: false,
  },
  {
    id: 2,
    title: "Team Meeting",
    date: new Date(2023, 5, 15),
    startTime: "10:00",
    endTime: "11:00",
    category: "Work",
    color: "bg-secondary-500/20 text-secondary-500 border-secondary-500/30",
    completed: false,
  },
  {
    id: 3,
    title: "Mentorship Session",
    date: new Date(2023, 5, 16),
    startTime: "15:30",
    endTime: "16:30",
    category: "Career",
    color: "bg-accent-success/20 text-accent-success border-accent-success/30",
    completed: false,
  },
  {
    id: 4,
    title: "Workout Session",
    date: new Date(2023, 5, 17),
    startTime: "07:00",
    endTime: "08:00",
    category: "Health",
    color: "bg-accent-error/20 text-accent-error border-accent-error/30",
    completed: true,
  },
]

export function CalendarIntegration() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarEvents, setCalendarEvents] = useState(events)

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }) // Start from Monday

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i))

  // Get events for selected date
  const selectedDateEvents = calendarEvents
    .filter((event) => isSameDay(event.date, selectedDate))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  // Navigate to previous week
  const previousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1))
  }

  // Navigate to next week
  const nextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1))
  }

  // Toggle event completion
  const toggleEventCompletion = (eventId: number) => {
    setCalendarEvents(
      calendarEvents.map((event) => (event.id === eventId ? { ...event, completed: !event.completed } : event)),
    )
  }

  return (
    <div className="space-y-4">
      <EnhancedCard variant="default" className="bg-zinc-900/50 border-zinc-800">
        <EnhancedCardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <EnhancedCardTitle className="text-lg flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-primary-500" />
              Calendar
            </EnhancedCardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
                onClick={previousWeek}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="text-sm">
                {format(startDate, "MMM d")} - {format(addDays(startDate, 6), "MMM d, yyyy")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
                onClick={nextWeek}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </EnhancedCardHeader>
        <EnhancedCardContent className="p-4">
          {/* Week days */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {weekDays.map((day, index) => {
              const isToday = isSameDay(day, new Date())
              const isSelected = isSameDay(day, selectedDate)
              const hasEvents = calendarEvents.some((event) => isSameDay(event.date, day))

              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-lg cursor-pointer transition-colors",
                    isSelected
                      ? "bg-primary-900/30 border border-primary-800/30"
                      : isToday
                        ? "bg-zinc-800/70 border border-zinc-700"
                        : "hover:bg-zinc-800/50",
                  )}
                  onClick={() => setSelectedDate(day)}
                >
                  <span className="text-xs text-zinc-400">{format(day, "EEE")}</span>
                  <span className={cn("text-lg font-medium", isToday && "text-primary-500")}>{format(day, "d")}</span>
                  {hasEvents && <div className="h-1 w-1 rounded-full bg-primary-500 mt-1" />}
                </motion.div>
              )
            })}
          </div>

          {/* Events for selected date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{format(selectedDate, "EEEE, MMMM d, yyyy")}</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <EnhancedButton
                    variant="outline"
                    size="sm"
                    rounded="full"
                    className="text-xs bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                    leftIcon={<Plus className="h-3 w-3" />}
                  >
                    Add Event
                  </EnhancedButton>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                  <DialogHeader>
                    <DialogTitle>Add New Event</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-sm text-zinc-400">
                      This is where you would add a new event form. In a real application, this would include fields for
                      event title, date, time, category, etc.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {selectedDateEvents.length > 0 ? (
              <div className="space-y-2">
                {selectedDateEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-3 rounded-lg border flex items-start transition-colors",
                      event.completed ? "bg-zinc-800/30 border-zinc-700/50 text-zinc-500" : event.color,
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className={cn("text-sm font-medium", event.completed && "line-through")}>{event.title}</h4>
                        <Badge
                          className={cn(
                            "ml-2 text-[10px]",
                            event.completed ? "bg-zinc-800 text-zinc-500 border-zinc-700" : event.color,
                          )}
                        >
                          {event.category}
                        </Badge>
                      </div>
                      <div className="flex items-center mt-1 text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {event.startTime} - {event.endTime}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                          "h-7 w-7 rounded-full",
                          event.completed
                            ? "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-400"
                            : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900 hover:text-white",
                        )}
                        onClick={() => toggleEventCompletion(event.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-full bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900 hover:text-white"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-zinc-800/30 rounded-lg">
                <CalendarIcon className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No events scheduled for this day</p>
                <EnhancedButton
                  variant="outline"
                  size="sm"
                  rounded="full"
                  className="mt-3 text-xs bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                  leftIcon={<Plus className="h-3 w-3" />}
                >
                  Add Event
                </EnhancedButton>
              </div>
            )}
          </div>
        </EnhancedCardContent>
      </EnhancedCard>
    </div>
  )
}

