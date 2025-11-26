"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BookOpen, Users, MessageSquare, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav"

const navItems = [
  {
    title: "Knowledge Base",
    href: "/dashboard/knowledgebase",
    icon: BookOpen,
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Conversations",
    href: "/dashboard/conversations",
    icon: MessageSquare,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex flex-col h-20 justify-center border-b px-6">
        <h1 className="text-xl font-bold">Dental Mentor AI</h1>
        <span className="text-xs text-muted-foreground">Admin Panel</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-muted-foreground hover:bg-gray-800/50 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          )
        })}
      </nav>
      <div className="border-t">
        <div className="p-4">
          <UserNav />
        </div>
        <div className="px-4 pb-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 hover:bg-red-600/10 hover:text-red-500 transition-colors group"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 group-hover:rotate-12 transition-transform" />
            <span className="font-medium">Logout</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
