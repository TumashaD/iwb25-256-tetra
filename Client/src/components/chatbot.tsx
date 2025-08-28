"use client"

import { useState, type FormEvent } from "react"
import { Paperclip, Mic, CornerDownLeft, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from "@/components/ui/chat-bubble"
import { ChatInput } from "@/components/ui/chat-input"
import { ChatMessageList } from "@/components/ui/chat-message-list"
import { DialogTrigger } from "@radix-ui/react-dialog"
import { aiService } from "@/services/aiService"
import ReactMarkdown from "react-markdown"

interface ChatDialogProps {
  open: boolean
  competitionId: number
  avatarUrl: string
  onOpenChange: (open: boolean) => void
}

export function ChatDialog({ open, onOpenChange, competitionId, avatarUrl }: ChatDialogProps) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: "Hello! Ask me anything about this competition.",
      sender: "ai",
    },
  ])

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()
  if (!input.trim()) return

  // Add user message
  setMessages((prev) => [
    ...prev,
    {
      id: prev.length + 1,
      content: input,
      sender: "user",
    },
  ])

  const userInput = input
  setInput("")
  setIsLoading(true)

  try {
    // Call your backend AI API
    const aiResponse = await aiService.generateResponse({
      question: userInput,
      competitionId: competitionId, // optional: pass competition context if you want
    })

    // Add AI reply
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        content: aiResponse.answer,
        sender: "ai",
      },
    ])
  } catch (error) {
    console.error("AI request failed:", error)
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        content: "Sorry, something went wrong. Please try again.",
        sender: "ai",
      },
    ])
  } finally {
    setIsLoading(false)
  }
}

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
         <div className='flex flex-col items-center py-2 rounded-xl justify-center w-20 hover:bg-sidebar-accent cursor-pointer'>
                        <Bot className='mb-0' />
                        <Button className='bg-transparent text-black border-0 shadow-none pointer-events-none w-18'>
                            Chat
                        </Button>
                    </div>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[800px] flex flex-col p-0">
        <DialogHeader className="flex-row items-center justify-between p-4 border-b">
          <div className="text-center flex-1">
            <DialogTitle className="text-xl font-semibold">Chat with Our AI</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Ask me anything about this competition</p>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <ChatMessageList>
            {messages.map((message) => (
              <ChatBubble key={message.id} variant={message.sender === "user" ? "sent" : "received"}>
                <ChatBubbleAvatar
                  className="h-8 w-8 shrink-0"
                  src={
                    message.sender === "user"
                      ? avatarUrl
                      : "/ai.png"
                  }
                  fallback={message.sender === "user" ? "US" : "AI"}
                />
                <ChatBubbleMessage variant={message.sender === "user" ? "sent" : "received"}>
<ReactMarkdown>{message.content}</ReactMarkdown>
                </ChatBubbleMessage>
              </ChatBubble>
            ))}

            {isLoading && (
              <ChatBubble variant="received">
                <ChatBubbleAvatar
                  className="h-8 w-8 shrink-0"
                  src="/ai.png"
                  fallback="AI"
                />
                <ChatBubbleMessage isLoading />
              </ChatBubble>
            )}
          </ChatMessageList>
        </div>

        <div className="border-t p-4">
          <form
            onSubmit={handleSubmit}
            className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
          >
            <ChatInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
            />
            <div className="flex items-center p-3 pt-0 justify-between">
              <Button type="submit" size="sm" className="ml-auto gap-1.5">
                Send Message
                <CornerDownLeft className="size-3.5" />
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
