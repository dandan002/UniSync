'use client'

import Link from 'next/link'
import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs'
import { CircleUserRound } from 'lucide-react'

interface UniSyncNavProps {
  activePage?: 'dashboard' | 'templates' | 'support'
}

export function UniSyncNav({ activePage }: UniSyncNavProps) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#f9f9f9]/80 backdrop-blur-md shadow-sm flex justify-between items-center px-12 h-20">
      <div className="flex items-center gap-12">
        <Link
          href="/"
          className="text-2xl italic text-[#2d3435]"
          style={{ fontFamily: 'var(--font-newsreader), serif' }}
        >
          UniSync
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/dashboard/resumes"
            className={`text-sm font-medium transition-colors duration-200 ${
              activePage === 'dashboard'
                ? 'text-[#2d3435] border-b-2 border-[#2d3435] pb-1'
                : 'text-[#2d3435]/60 hover:text-[#2d3435]'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/templates"
            className={`text-sm font-medium transition-colors duration-200 ${
              activePage === 'templates'
                ? 'text-[#2d3435] border-b-2 border-[#2d3435] pb-1'
                : 'text-[#2d3435]/60 hover:text-[#2d3435]'
            }`}
          >
            Templates
          </Link>
          <Link
            href="#"
            className={`text-sm font-medium transition-colors duration-200 ${
              activePage === 'support'
                ? 'text-[#2d3435] border-b-2 border-[#2d3435] pb-1'
                : 'text-[#2d3435]/60 hover:text-[#2d3435]'
            }`}
          >
            Support
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <Show when="signed-out">
          <SignUpButton>
            <button className="text-sm font-medium text-[#2d3435] hover:opacity-70 transition-opacity">
              Start Free
            </button>
          </SignUpButton>
          <SignInButton>
            <CircleUserRound className="h-6 w-6 cursor-pointer text-[#2d3435]/60 transition-colors hover:text-[#2d3435]" />
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <UserButton appearance={{ elements: { avatarBox: 'size-8' } }} />
        </Show>
      </div>
    </nav>
  )
}
