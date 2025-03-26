import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

// Mock trending topics
const trendingTopics = [
  "Tech Talk",
  "Music Production",
  "Storytelling",
  "Comedy",
  "News",
  "Business",
  "Self-Help",
  "Education",
]

// Mock trending creators
const trendingCreators = [
  {
    username: "techGuru",
    displayName: "Tech Guru",
    followers: "245K",
    avatar: "/placeholder.svg?height=50&width=50",
  },
  {
    username: "musicProducer",
    displayName: "Music Producer",
    followers: "189K",
    avatar: "/placeholder.svg?height=50&width=50",
  },
  {
    username: "storyTeller",
    displayName: "Story Teller",
    followers: "324K",
    avatar: "/placeholder.svg?height=50&width=50",
  },
  {
    username: "comedyKing",
    displayName: "Comedy King",
    followers: "512K",
    avatar: "/placeholder.svg?height=50&width=50",
  },
]

// Mock trending rooms
const trendingRooms = [
  {
    id: "1",
    title: "Tech Talk: Future of AI",
    participants: 245,
    speakers: [
      { username: "techGuru", avatar: "/placeholder.svg?height=40&width=40" },
      { username: "aiExpert", avatar: "/placeholder.svg?height=40&width=40" },
    ],
  },
  {
    id: "2",
    title: "Music Production Tips",
    participants: 128,
    speakers: [
      { username: "beatMaker", avatar: "/placeholder.svg?height=40&width=40" },
      { username: "vocalCoach", avatar: "/placeholder.svg?height=40&width=40" },
    ],
  },
]

export function DiscoverContent() {
  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search creators, topics, or rooms" className="pl-10" />
      </div>

      <Tabs defaultValue="topics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
        </TabsList>

        <TabsContent value="topics" className="mt-6">
          <h2 className="text-lg font-medium mb-4">Trending Topics</h2>
          <div className="flex flex-wrap gap-2">
            {trendingTopics.map((topic, index) => (
              <Button key={index} variant="outline" className="rounded-full">
                {topic}
              </Button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="creators" className="mt-6">
          <h2 className="text-lg font-medium mb-4">Popular Creators</h2>
          <div className="space-y-4">
            {trendingCreators.map((creator, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={creator.avatar} alt={creator.displayName} />
                    <AvatarFallback>{creator.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{creator.displayName}</p>
                    <p className="text-sm text-muted-foreground">@{creator.username}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Follow
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rooms" className="mt-6">
          <h2 className="text-lg font-medium mb-4">Trending Rooms</h2>
          <div className="space-y-4">
            {trendingRooms.map((room) => (
              <div key={room.id} className="border rounded-lg p-4">
                <h3 className="font-semibold">{room.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <span>{room.participants} listening</span>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1">Speakers</p>
                  <div className="flex -space-x-2">
                    {room.speakers.map((speaker, index) => (
                      <Avatar key={index} className="border-2 border-background h-8 w-8">
                        <AvatarImage src={speaker.avatar} alt={speaker.username} />
                        <AvatarFallback>{speaker.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
                <Button className="w-full mt-3" size="sm">
                  Join Room
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

