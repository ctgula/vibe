import { Button } from "@/components/ui/button"

interface TrendingTopicsProps {
  topics: {
    name: string
    count: number
  }[]
}

export function TrendingTopics({ topics }: TrendingTopicsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {topics.map((topic, index) => (
        <Button key={index} variant="outline" size="sm" className="rounded-full text-xs h-8">
          {topic.name}
          <span className="ml-1 text-xs text-muted-foreground">{topic.count}</span>
        </Button>
      ))}
    </div>
  )
}

