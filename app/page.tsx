'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-md bg-blue-600" />
              <span className="text-xl font-semibold">UniSync</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/api/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/api/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-slate-900">
            Connect Students with
            <span className="block text-blue-600">Career Opportunities</span>
          </h1>
          <p className="mb-8 text-xl text-slate-600">
            The premier platform for students and employers to connect,
            collaborate, and build successful careers.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/api/auth/signup">
              <Button size="lg">Find Opportunities</Button>
            </Link>
            <Link href="/api/auth/signup">
              <Button size="lg" variant="outline">
                Post Jobs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">
          Everything You Need in One Platform
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          {/* For Students */}
          <Card>
            <CardHeader>
              <CardTitle>For Students</CardTitle>
              <CardDescription>Launch your career journey</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start">
                  <span className="mr-2 text-blue-600">✓</span>
                  Browse targeted job postings and internships
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-600">✓</span>
                  Create professional profiles and resumes
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-600">✓</span>
                  Generate LaTeX-formatted resumes automatically
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-600">✓</span>
                  Register for career events and workshops
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-600">✓</span>
                  Apply to multiple positions with one click
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* For Employers */}
          <Card>
            <CardHeader>
              <CardTitle>For Employers</CardTitle>
              <CardDescription>Find top talent</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start">
                  <span className="mr-2 text-blue-600">✓</span>
                  Post jobs and internship opportunities
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-600">✓</span>
                  Target students by university, major, and skills
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-600">✓</span>
                  Schedule on-campus recruitment events
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-600">✓</span>
                  Review applications and candidate profiles
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-600">✓</span>
                  Link to external career pages
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* For Administrators */}
          <Card>
            <CardHeader>
              <CardTitle>For Administrators</CardTitle>
              <CardDescription>Track and analyze engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start">
                  <span className="mr-2 text-blue-600">✓</span>
                  Monitor student-employer interactions
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-600">✓</span>
                  Extract recruiting behavior insights
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-600">✓</span>
                  View popular companies and positions
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-600">✓</span>
                  Track event attendance and engagement
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-600">✓</span>
                  Generate comprehensive analytics reports
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-6 text-4xl font-bold text-white">
            Ready to Get Started?
          </h2>
          <p className="mb-8 text-xl text-blue-100">
            Join thousands of students and employers
          </p>
          <Link href="/api/auth/signup">
            <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-blue-50">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-slate-600">
          <p>&copy; 2026 UniSync. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
