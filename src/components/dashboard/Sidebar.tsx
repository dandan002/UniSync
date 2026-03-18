'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { User, FileText } from 'lucide-react'

const navItems = [
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/resumes', label: 'Resumes', icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-background">
      <div className="flex items-center px-4 py-5 border-b border-border">
        <span className="font-display font-bold text-lg">UniSync</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-4 py-4 border-t border-border">
        <UserButton />
      </div>
    </aside>
  )
}
