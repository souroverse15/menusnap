import { SignUp } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Coffee, CheckCircle } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-rose-600 to-pink-600 text-white flex-col justify-center px-12">
        <div className="max-w-md">
          <div className="flex items-center space-x-3 mb-8">
            <Coffee className="h-10 w-10" />
            <span className="text-3xl font-bold">MenuSnap</span>
          </div>

          <h1 className="text-4xl font-bold mb-6">
            Start your café's digital transformation today
          </h1>

          <p className="text-xl text-rose-100 mb-8">
            Join thousands of café owners who are already using MenuSnap to grow
            their business.
          </p>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-white" />
              <span>Free to start, scale as you grow</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-white" />
              <span>Set up in under 10 minutes</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-white" />
              <span>24/7 customer support</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-white" />
              <span>No long-term contracts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Sign Up Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Coffee className="h-8 w-8 text-rose-600" />
              <span className="text-2xl font-bold gradient-text">MenuSnap</span>
            </div>
            <p className="text-muted-foreground">Create your account</p>
          </div>

          {/* Clerk SignUp component */}
          <SignUp
            routing="path"
            path="/sign-up"
            redirectUrl="/apply"
            afterSignUpUrl="/apply"
            signInUrl="/sign-in"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 p-0",
                headerTitle:
                  "hidden lg:block text-2xl font-bold text-center mb-6",
                headerSubtitle:
                  "hidden lg:block text-muted-foreground text-center mb-8",
                socialButtonsBlockButton:
                  "border border-gray-200 hover:bg-gray-50",
                socialButtonsBlockButtonText: "font-medium",
                formButtonPrimary:
                  "bg-rose-600 hover:bg-rose-700 text-white font-medium",
                footerActionLink: "text-rose-600 hover:text-rose-700",
                identityPreviewText: "text-sm",
                identityPreviewEditButton: "text-rose-600 hover:text-rose-700",
              },
              layout: {
                socialButtonsPlacement: "top",
                showOptionalFields: false,
              },
            }}
          />

          {/* Back to home link */}
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
