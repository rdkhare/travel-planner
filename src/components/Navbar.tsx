"use client";

import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link
              href="/"
              className="flex items-center px-2 text-2xl font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              TravelPlanner
            </Link>
          </div>

          <div className="flex items-center">
            {session ? (
              <div className="flex items-center gap-4">
                <Link href="/trips">
                  <Button className="bg-blue-600 text-white hover:bg-blue-700">
                    My Trips
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="hover:bg-gray-100"
                >
                  Sign Out
                </Button>
                <div className="flex items-center">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                      {session.user?.name?.[0] || "U"}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link href="/auth/signin">
                <Button variant="outline" className="hover:bg-gray-100">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 