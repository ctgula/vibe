import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"
import Link from "next/link"

interface LiveRoomPreviewProps {
  room: {
    id: string
    title: string
    participants: number
    speakers: {
      username: string
      avatar: string
    }[]
  }
}

export function LiveRoomPreview({ room }: LiveRoomPreviewProps) {
  return (
    <div className="flex-shrink-0 w-64 border rounded-xl overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-1">{room.title}</h3>

        <div className="flex items-center gap-1 mt-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-xs text-muted-foreground">Live</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground flex items-center">
            <Users className="h-3 w-3 mr-0.5" />
            {room.participants}
          </span>
        </div>

        <div className="mt-2 flex -space-x-2">
          {room.speakers.map((speaker, index) => (
            <Avatar key={index} className="border-2 border-background h-6 w-6">
              <AvatarImage src={speaker.avatar} alt={speaker.username} />
              <AvatarFallback>{speaker.username.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          ))}
          <div className="ml-2 text-xs flex items-center">
            <span className="text-muted-foreground">{room.speakers.length} speakers</span>
          </div>
        </div>

        <Link href={`/rooms/${room.id}`}>
          <Button className="w-full mt-2" size="sm" variant="default">
            Join Room
          </Button>
        </Link>
      </div>
    </div>
  )
}

