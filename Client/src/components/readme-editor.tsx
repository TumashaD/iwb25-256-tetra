"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Edit3, Save, X } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"

interface ReadmeEditorProps {
    initialContent?: string
    onSave: (content: string) => Promise<void>
    isSubmitting?: boolean
    profile?: { name?: string; email?: string; role?: string; about?: string }
}

export function ReadmeEditor({ initialContent = "", onSave, isSubmitting = false, profile }: ReadmeEditorProps) {
    const [content, setContent] = useState(initialContent)
    const [isEditing, setIsEditing] = useState(false)
    const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")

    const handleSave = async () => {
        try {
            await onSave(content)
            setIsEditing(false)
        } catch (error) {
            console.error("Failed to save README:", error)
        }
    }

    const handleCancel = () => {
        setContent(initialContent)
        setIsEditing(false)
    }

    const generateDefaultReadme = (profileData?: { name?: string; email?: string; role?: string; about?: string }) => {
        const profileToUse = profileData || profile
        const name = profileToUse?.name || "Your Name"
        const role = profileToUse?.role || "your role"
        const about = profileToUse?.about || "Tell us about yourself..."

        return `<h1 align="center">Hi, I'm ${name} 👋</h1>
<h3 align="center">${about}</h3>

## About Me
I'm a passionate ${role} who loves to learn and grow in the tech community.

<ul>
  <li>🌱 Currently exploring: <strong>Your interests here</strong></li>
  <li>� Open to collaboration on: <strong>Types of projects you're interested in</strong></li>
  <li>💬 Ask me about: <strong>Your expertise areas</strong></li>
  <li>⚡ Fun fact: <strong>Something interesting about you</strong></li>
</ul>

<hr>

<h3 align="center">Technologies & Tools</h3>
<p align="center">
  <!-- Add your tech stack icons here -->
  <!-- Example: -->
  <!-- <img src="https://cdn.simpleicons.org/javascript/F7DF1E" width="40" alt="JavaScript" />&nbsp;&nbsp; -->
  <!-- <img src="https://cdn.simpleicons.org/react/61DAFB" width="40" alt="React" />&nbsp;&nbsp; -->
  <!-- <img src="https://cdn.simpleicons.org/python/3776AB" width="40" alt="Python" /> -->
</p>

<hr>

<h3 align="center">Let's Connect!</h3>
<p align="center">
  <!-- Add your social links here -->
  <!-- Example: -->
  <!-- <a href="https://linkedin.com/in/yourprofile" target="_blank">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linkedin/linkedin-original.svg" width="40" alt="LinkedIn" />
  </a>&nbsp;&nbsp; -->
</p>

---
*Feel free to customize this README with your own content, technologies, and links!*`
    }

    if (!isEditing && !content.trim()) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            📝 README.md
                        </span>
                        <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                            <Edit3 className="w-4 h-4 mr-2" />
                            Create README
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-4">📝</div>
                        <h3 className="text-lg font-medium mb-2">No README yet</h3>
                        <p className="text-sm mb-4">Create a README to showcase yourself to others!</p>
                        <Button onClick={() => {
                            setContent(generateDefaultReadme())
                            setIsEditing(true)
                        }}>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Create README
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (isEditing) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            📝 Edit README.md
                        </span>
                        <div className="flex gap-2">
                            <Button onClick={handleSave} disabled={isSubmitting} size="sm">
                                <Save className="w-4 h-4 mr-2" />
                                {isSubmitting ? "Saving..." : "Save"}
                            </Button>
                            <Button onClick={handleCancel} variant="outline" size="sm" disabled={isSubmitting}>
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "edit" | "preview")} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="edit" className="flex items-center gap-2">
                                <Edit3 className="w-4 h-4" />
                                Edit
                            </TabsTrigger>
                            <TabsTrigger value="preview" className="flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                Preview
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="edit" className="mt-4">
                            <Textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Write your README in Markdown...

You can use:
- Headers: # ## ###
- Lists: - or 1. 
- Links: [text](url)
- Images: <img src='url' width='40' alt='alt-text' />
- HTML elements like <h1 align='center'>, <p align='center'>, etc.
- Code blocks: ```language
- And much more!"
                                className="min-h-[400px] font-mono text-sm"
                                disabled={isSubmitting}
                            />
                            <div className="mt-2 text-xs text-gray-500">
                                💡 <strong>Tip:</strong> You can use both Markdown syntax and HTML elements. Try copying the example README from GitHub profiles!
                            </div>
                        </TabsContent>
                        <TabsContent value="preview" className="mt-4">
                            <div className="border rounded-lg p-4 min-h-[400px] bg-white readme-content overflow-auto">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeRaw]}
                                    components={{
                                        h1: ({ children, ...props }) => {
                                            // Handle align attribute from HTML
                                            const align = props.node?.properties?.align as string
                                            const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : ''
                                            return <h1 className={`text-3xl font-bold mb-6 text-gray-900 border-b border-gray-200 pb-3 ${alignClass}`}>{children}</h1>
                                        },
                                        h2: ({ children, ...props }) => {
                                            const align = props.node?.properties?.align as string
                                            const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : ''
                                            return <h2 className={`text-2xl font-semibold mb-4 text-gray-800 mt-8 ${alignClass}`}>{children}</h2>
                                        },
                                        h3: ({ children, ...props }) => {
                                            const align = props.node?.properties?.align as string
                                            const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : ''
                                            return <h3 className={`text-xl font-medium mb-3 text-gray-700 mt-6 ${alignClass}`}>{children}</h3>
                                        },
                                        p: ({ children, ...props }) => {
                                            const align = props.node?.properties?.align as string
                                            const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : ''
                                            return <p className={`mb-4 text-gray-600 leading-relaxed ${alignClass}`}>{children}</p>
                                        },
                                        ul: ({ children }) => <ul className="list-disc list-inside mb-4 text-gray-600 space-y-2">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal list-inside mb-4 text-gray-600 space-y-2">{children}</ol>,
                                        li: ({ children }) => <li className="text-gray-600 leading-relaxed">{children}</li>,
                                        code: ({ children }) => <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">{children}</code>,
                                        pre: ({ children }) => <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4 text-sm">{children}</pre>,
                                        blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 mb-4 bg-blue-50 py-3">{children}</blockquote>,
                                        a: ({ href, children }) => <a href={href} className="text-blue-600 hover:text-blue-800 underline transition-colors" target="_blank" rel="noopener noreferrer">{children}</a>,
                                        hr: () => <hr className="my-8 border-gray-300" />,
                                        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                        em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                                        img: ({ src, alt, width, height }) => (
                                            <img
                                                src={src}
                                                alt={alt || ''}
                                                width={width}
                                                height={height}
                                                className="inline-block mx-1 my-1 max-w-full h-auto"
                                                style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}
                                            />
                                        ),
                                    }}
                                >
                                    {content || "*Preview will appear here as you type...*"}
                                </ReactMarkdown>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        📝 README.md
                    </span>
                    <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit README
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="readme-content overflow-auto">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                            h1: ({ children, ...props }) => {
                                // Handle align attribute from HTML
                                const align = props.node?.properties?.align as string
                                const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : ''
                                return <h1 className={`text-3xl font-bold mb-6 text-gray-900 border-b border-gray-200 pb-3 ${alignClass}`}>{children}</h1>
                            },
                            h2: ({ children, ...props }) => {
                                const align = props.node?.properties?.align as string
                                const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : ''
                                return <h2 className={`text-2xl font-semibold mb-4 text-gray-800 mt-8 ${alignClass}`}>{children}</h2>
                            },
                            h3: ({ children, ...props }) => {
                                const align = props.node?.properties?.align as string
                                const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : ''
                                return <h3 className={`text-xl font-medium mb-3 text-gray-700 mt-6 ${alignClass}`}>{children}</h3>
                            },
                            p: ({ children, ...props }) => {
                                const align = props.node?.properties?.align as string
                                const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : ''
                                return <p className={`mb-4 text-gray-600 leading-relaxed ${alignClass}`}>{children}</p>
                            },
                            ul: ({ children }) => <ul className="list-disc list-inside mb-4 text-gray-600 space-y-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-4 text-gray-600 space-y-2">{children}</ol>,
                            li: ({ children }) => <li className="text-gray-600 leading-relaxed">{children}</li>,
                            code: ({ children }) => <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">{children}</code>,
                            pre: ({ children }) => <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4 text-sm">{children}</pre>,
                            blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 mb-4 bg-blue-50 py-3">{children}</blockquote>,
                            a: ({ href, children }) => <a href={href} className="text-blue-600 hover:text-blue-800 underline transition-colors" target="_blank" rel="noopener noreferrer">{children}</a>,
                            hr: () => <hr className="my-8 border-gray-300" />,
                            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                            em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                            img: ({ src, alt, width, height }) => (
                                <img
                                    src={src}
                                    alt={alt || ''}
                                    width={width}
                                    height={height}
                                    className="inline-block mx-1 my-1 max-w-full h-auto"
                                    style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}
                                />
                            ),
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
            </CardContent>
        </Card>
    )
}