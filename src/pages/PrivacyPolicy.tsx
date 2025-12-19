import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import pinkFavicon from "@/assets/Pink_Favicon.png";

const PrivacyPolicy = () => {
  return (
    <div
      className="min-h-screen"
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
            Zulu Group
          </a>
        </nav>
        <Link
          to="/"
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </header>

      {/* Content */}
      <main className="px-6 md:px-12 lg:px-24 py-12 max-w-4xl mx-auto">
        <div
          style={{
            background: "linear-gradient(180deg, hsla(180 20% 35% / 0.4) 0%, hsla(170 25% 25% / 0.3) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid hsla(180 30% 50% / 0.15)",
          }}
          className="rounded-lg p-8 md:p-12"
        >
          <h1 className="text-3xl md:text-4xl text-white font-medium mb-8">Privacy Policy</h1>
          
          <div className="text-white/80 space-y-6 text-sm md:text-base leading-relaxed">
            <p className="text-white/60 italic">Last updated: December 2024</p>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">1. Introduction</h2>
              <p>
                Zulu Group Ltd ("we," "our," or "us") operates the Zulu Digital Microscope application. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you use our application.
              </p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">2. Information We Collect</h2>
              <p className="mb-3">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Name and email address when you sign up for our newsletter</li>
                <li>Account information if you create an account</li>
                <li>Any content or comments you submit through the application</li>
                <li>Communications you send to us</li>
              </ul>
              <p className="mt-3">We also automatically collect certain information, including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Usage data and analytics</li>
                <li>Session information</li>
                <li>Device and browser information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">3. How We Use Your Information</h2>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide, maintain, and improve our application</li>
                <li>Send you newsletters and updates (if you've subscribed)</li>
                <li>Respond to your comments and questions</li>
                <li>Analyze usage patterns to improve user experience</li>
                <li>Protect against fraudulent or unauthorized activity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">4. Information Sharing</h2>
              <p>
                We do not sell, trade, or rent your personal information to third parties. 
                We may share your information with service providers who assist us in operating 
                our application, conducting our business, or servicing you, provided those parties 
                agree to keep this information confidential.
              </p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">5. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your 
                personal information against unauthorized access, alteration, disclosure, or destruction. 
                However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">6. Your Rights</h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Unsubscribe from our newsletter at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">7. Cookies</h2>
              <p>
                We use cookies and similar tracking technologies to track activity on our application 
                and hold certain information. You can instruct your browser to refuse all cookies or 
                to indicate when a cookie is being sent.
              </p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">8. Third-Party Services</h2>
              <p>
                Our application may contain links to third-party websites or services. We are not 
                responsible for the privacy practices of these external sites. We encourage you to 
                read the privacy policies of any third-party sites you visit.
              </p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">9. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes 
                by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">10. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at{" "}
                <a href="mailto:privacy@zulu.group" className="text-white underline hover:text-white/80">
                  privacy@zulu.group
                </a>
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <Link
              to="/terms"
              className="text-white/70 hover:text-white transition-colors underline text-sm"
            >
              View Terms of Service →
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 md:p-8 px-[12px] py-[12px]">
        <div className="text-white/50 text-[10px] font-sans leading-relaxed">
          © 2026 Zulu Group Ltd. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
