'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600">
      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-md fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Hackmate</h1>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="text-white hover:text-gray-100 font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Connect. Collaborate. Compete.
          </h2>
          <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl">
            Hackmate is the ultimate platform for organizing and participating in
            hackathons. Build amazing projects, meet incredible people, and win prizes.
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="bg-white/20 text-white px-8 py-3 rounded-lg font-bold hover:bg-white/30 transition border border-white/50"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-4xl font-bold text-gray-900 text-center mb-12">
            Powerful Features
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🏆</div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Hackathon Management</h4>
              <p className="text-gray-600">
                Create, manage, and run hackathons with full control over timelines,
                teams, and submissions.
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">👥</div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Team Building</h4>
              <p className="text-gray-600">
                Form teams, discover teammates, and collaborate seamlessly with
                built-in communication tools.
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">⭐</div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Fair Judging</h4>
              <p className="text-gray-600">
                Transparent judging with customizable rubrics and weighted scoring
                to ensure fair evaluation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to start hacking?
          </h3>
          <p className="text-xl text-white/80 mb-8">
            Join thousands of developers and builders on Hackmate.
          </p>
          <Link
            href="/signup"
            className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition inline-block"
          >
            Create Account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 Hackmate. Built for hackers, by hackers.
          </p>
        </div>
      </footer>
    </div>
  );
}
