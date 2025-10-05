"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Mail, Calendar, User, MapPin } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"

interface ProfileViewProps {
    user: {
        id: string
        email: string
        avatarUrl?: string
        profile?: {
            name?: string
            role?: string
            about?: string
            readme?: string
            createdAt?: string
        }
    }
    showContact?: boolean
}

export function ProfileView({ user, showContact = true }: ProfileViewProps) {
    const getUserInitials = (name: string) => {
        return name
            .split(" ")
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return "2024"
        try {
            return new Date(dateString).getFullYear().toString()
        } catch {
            return "2024"
        }
    }

    return (
        <div className="min-h-screen">
            {/* Header Section */}
            <div className="relative bg-sidebar border-gray-200">
                <div className="max-w-6xl mx-auto px-8 py-20">
                    <div className="flex flex-col lg:flex-row items-start gap-8">
                        {/* Left side - Avatar and basic details */}
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                                <AvatarImage
                                    src={user.avatarUrl || "/placeholder.svg"}
                                    alt={user.profile?.name || user.email}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-white text-white text-2xl font-bold">
                                    {user.profile?.name ? getUserInitials(user.profile.name) : user.email.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                                    {user.profile?.name || "Anonymous User"}
                                </h1>
                                {showContact && (
                                    <p className="text-gray-600 mb-4 flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        {user.email}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-3">
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Member since {formatDate(user.profile?.createdAt)}
                                    </Badge>
                                    {user.profile?.role && (
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 px-3 py-1 capitalize">
                                            {user.profile.role}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 gap-8">
                    {/* README Section */}
                    {user.profile?.readme ? (
                        <Card className="bg-white border-gray-200 shadow-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    📝 README.md
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
                                        {user.profile.readme}
                                    </ReactMarkdown>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="bg-white border-gray-200 shadow-md">
                            <CardContent className="pt-6">
                                <div className="text-center py-8 text-gray-500">
                                    <div className="text-4xl mb-4">📝</div>
                                    <h3 className="text-lg font-medium mb-2">No README yet</h3>
                                    <p className="text-sm">This user hasn't created a README profile yet.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}