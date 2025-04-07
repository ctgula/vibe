import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Mic, Clock } from "lucide-react"
import Link from "next/link"

// Mock data for audio rooms
const mockRooms = [
  {
    id: "1",
    title: "Tech Talk: Future of AI",
    description: "Discussing the latest advancements in artificial intelligence and machine learning",
    participants: 245,
    speakers: [
      { username: "techGuru", avatar: "/placeholder.svg?height=40&width=40" },
      { username: "aiExpert", avatar: "/placeholder.svg?height=40&width=40" },
      { username: "devLeader", avatar: "/placeholder.svg?height=40&width=40" },
    ],
    isLive: true,
  },
  {
    id: "2",
    title: "Music Production Tips",
    description: "Professional producers share their workflow secrets and favorite plugins",
    participants: 128,
    speakers: [
      { username: "beatMaker", avatar: "/placeholder.svg?height=40&width=40" },
      { username: "vocalCoach", avatar: "/placeholder.svg?height=40&width=40" },
    ],
    isLive: true,
  },
  {
    id: "3",
    title: "Startup Funding Strategies",
    description: "Learn how to secure funding for your startup from experienced investors",
    participants: 89,
    speakers: [
      { username: "vcInvestor", avatar: "/placeholder.svg?height=40&width=40" },
      { username: "founderCEO", avatar: "/placeholder.svg?height=40&width=40" },
      { username: "angelInvestor", avatar: "/placeholder.svg?height=40&width=40" },
    ],
    isLive: true,
  },
  {
    id: "4",
    title: "Mindfulness & Meditation",
    description: "Guided meditation session for stress relief and mental clarity",
    scheduledFor: "Today, 8:00 PM",
    speakers: [{ username: "zenMaster", avatar: "/placeholder.svg?height=40&width=40" }],
    isLive: false,
  },
]

export function RoomsList() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-white">Live Now</h2>
      </div>

      <div className="space-y-5">
        {mockRooms.map((room) => (
          <div key={room.id} className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden transition-all hover:bg-white/15 border border-white/10">
            <div className="p-5">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-white">{room.title}</h3>
                  <p className="text-white/80 text-sm mt-1 line-clamp-2">{room.description}</p>
                  
                  {room.isLive ? (
                    <div className="flex items-center gap-3 mt-3">
                      <span className="flex items-center gap-1.5">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
                        </span>
                        <span className="text-sm text-white/80">Live</span>
                      </span>
                      <span className="text-white/40">•</span>
                      <span className="text-sm text-white/80 flex items-center">
                        <Users className="h-3.5 w-3.5 mr-1 text-white/80" />
                        {room.participants}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-3 text-white/80">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-sm">{room.scheduledFor}</span>
                    </div>
                  )}
                </div>

                {room.isLive ? (
                  <Link href={`/room/${room.id}`}>
                    <button className="bg-white hover:bg-white/90 text-primary text-sm font-medium py-1.5 px-4 rounded-md transition-all">
                      Join
                    </button>
                  </Link>
                ) : (
                  <button className="border border-white/20 hover:bg-white/10 text-white text-sm font-medium py-1.5 px-4 rounded-md transition-all">
                    Remind me
                  </button>
                )}
              </div>

              <div className="mt-4 flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium text-white/70 mb-2">Speakers</p>
                  <div className="flex -space-x-2">
                    {room.speakers.map((speaker, index) => (
                      <Avatar key={index} className="border-2 border-black/30 h-8 w-8">
                        <AvatarImage src={speaker.avatar} alt={speaker.username} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                          {speaker.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
                
                <div className="text-xs text-white/50 italic">
                  {room.isLive ? 'Happening now' : 'Coming soon'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 flex justify-center">
        <Link href="/discover" className="text-white hover:text-white/80 text-sm font-medium flex items-center gap-1 transition-all underline decoration-pink-500 underline-offset-4">
          Discover more rooms
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </Link>
      </div>
    </div>
  )
}
