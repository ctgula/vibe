'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MailCheck, Home, ArrowLeft } from "lucide-react";

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-zinc-800 bg-zinc-900/80 text-zinc-200 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-indigo-900/30 p-4">
                <MailCheck size={32} className="text-indigo-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <CardDescription className="text-zinc-400">
              We&apos;ve sent you a confirmation link
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">
              Please check your email inbox and click the confirmation link to complete your registration.
            </p>
            <p className="text-zinc-400 text-sm">
              If you don&apos;t see the email, check your spam folder or try signing in - we might have already confirmed your account.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button asChild variant="default" className="w-full">
              <Link href="/auth/signin">
                <ArrowLeft size={16} className="mr-2" />
                Back to sign in
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-zinc-700 hover:bg-zinc-800">
              <Link href="/">
                <Home size={16} className="mr-2" />
                Return to home
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
