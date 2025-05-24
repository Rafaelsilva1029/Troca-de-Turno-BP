"use client"
import { useToast } from "@/components/ui/use-toast"
import { useSubscription } from "@/liveblocks.config"
import { useAudio } from "@/lib/audio-service"

export const NotificationManager = () => {
  const { toast } = useToast()
  const { play } = useAudio()

  useSubscription(({ others }) => {
    others.forEach((other) => {
      if (other.presence?.notifications?.length) {
        other.presence.notifications.forEach((notification) => {
          toast({
            title: notification.title,
            description: notification.description,
          })
          play("notification")
        })
      }
    })
  }, [])

  return null
}
