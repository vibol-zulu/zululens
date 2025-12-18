import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { registerTier1Visitor, useAnalytics } from "@/hooks/useAnalytics";
import pinkFavicon from "@/assets/Pink_Favicon.png";
import SignInModal from "@/components/SignInModal";

interface SignUpGateProps {
  onJoin: (name: string, email: string) => void;
}
const MAILCHIMP_ACTION =
  "https://group.us12.list-manage.com/subscribe/post?u=8cebbb69cb233fee8e96a59fe&id=de54a87f37&f_id=005e9fe0f0";
const SignUpGate: React.FC<SignUpGateProps> = ({ onJoin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [showSignIn, setShowSignIn] = useState(false);
  const { setVisitorId, initSession, trackEvent } = useAnalytics();
  const handleSubmit = (e: React.FormEvent) => {
    setError("");

    if (!name.trim()) {
      e.preventDefault();
      setError("Please enter your name.");
      return;
    }

    if (!email.includes("@")) {
      e.preventDefault();
      setError("Please enter a valid email.");
      return;
    }

    setSubmitted(true);

    // Register visitor in database (do not block form submit to Mailchimp)
    (async () => {
      const visitorId = await registerTier1Visitor(name, email);
      if (visitorId) {
        setVisitorId(visitorId);
        await initSession();
        trackEvent({
          event_type: "page_view",
          event_data: {
            page: "dashboard",
          },
        });
      }
    })();

    setTimeout(() => {
      onJoin(name, email);
    }, 500);
  };
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(135deg, hsl(180 25% 25%) 0%, hsl(170 30% 18%) 50%, hsl(200 20% 30%) 100%)",
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between p-6 md:p-8 px-[12px] py-[12px]">
        <nav className="flex items-center gap-2">
          <img src={pinkFavicon} alt="Zulu" className="h-4 w-4" />
          <a
            href="https://www.zulu.group"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/90 font-medium tracking-wide uppercase text-xs font-sans hover:text-white transition-colors"
          >
            Zulu Group{" "}
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 md:px-12 py-12 items-center justify-center flex flex-row lg:px-[56px]">
        <div
          style={{
            background: "linear-gradient(180deg, hsla(180 20% 35% / 0.4) 0%, hsla(170 25% 25% / 0.3) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid hsla(180 30% 50% / 0.15)",
          }}
          className="w-full max-w-md rounded-lg p-8"
        >
          {/* Icon */}
          <div className="mb-2"></div>

          {/* Headline */}
          <h1 className="text-3xl md:text-4xl text-white leading-tight mb-6 lg:text-4xl font-medium font-sans">
            Zulu Digital Microscope: US media 2000 - 2025
          </h1>

          {/* Description */}
          <p className="text-white/70 text-base leading-relaxed mb-4 max-w-lg md:text-sm">
            Sign up to our newsletter to unlock the interactive infographic.  We respect your privacy. No spam, only
            interesting ideas.
          </p>
          <p className="text-white/50 text-sm italic mb-8">
            Already subscribed? Enter details to access.
          </p>

          {error && (
            <div className="bg-red-500/20 text-red-200 text-sm p-3 rounded-lg mb-6 border border-red-500/30">
              {error}
            </div>
          )}

          <iframe
            name="hiddenFrame"
            title="hiddenFrame"
            className="absolute opacity-0 pointer-events-none w-px h-px -z-10"
          />

          <form
            action={MAILCHIMP_ACTION}
            method="POST"
            target="hiddenFrame"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <Input
              type="text"
              name="FNAME"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30 focus-visible:ring-offset-0"
            />
            <Input
              type="email"
              name="EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30 focus-visible:ring-offset-0"
            />

            <div className="absolute -left-[5000px]" aria-hidden="true">
              <input type="text" name="b_8cebbb69cb233fee8e96a59fe_de54a87f37" tabIndex={-1} defaultValue="" />
            </div>

            <button
              type="submit"
              disabled={submitted}
              className="w-full h-14 px-10 tracking-widest uppercase transition-all duration-300 rounded-md text-sm font-medium font-sans bg-white"
            >
              <span className="shimmer-text-dark">{submitted ? "Unlocking..." : "Unlock Infographic"}</span>
            </button>
          </form>

          <p className="text-white/60 text-sm mt-6 text-center">
            Have an account?{" "}
            <button
              type="button"
              onClick={() => setShowSignIn(true)}
              className="text-white/90 underline hover:text-white transition-colors"
            >
              Sign in here
            </button>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 md:p-8 flex-col flex items-start justify-between px-[12px] py-[12px]">
        <div className="text-white/50 text-[10px] font-sans  leading-relaxed max-w-xs">
          ​
          <br />
          ​<br />© 2026 Zulu Group Ltd. All rights reserved.
        </div>
      </footer>

      <SignInModal open={showSignIn} onClose={() => setShowSignIn(false)} />
    </div>
  );
};
export default SignUpGate;
