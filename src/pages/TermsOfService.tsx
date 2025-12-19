import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import pinkFavicon from "@/assets/Pink_Favicon.png";

const TermsOfService = () => {
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
          <h1 className="text-3xl md:text-4xl text-white font-medium mb-8">Terms of Service</h1>
          
          <div className="text-white/80 space-y-6 text-sm md:text-base leading-relaxed">
            <p className="text-white/60 italic">Last updated: December 2024</p>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using the Zulu Digital Microscope application ("the Service"), 
                you accept and agree to be bound by these Terms of Service. If you do not agree 
                to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">2. Description of Service</h2>
              <p>
                The Zulu Digital Microscope is an interactive data visualization tool that provides 
                information about US media landscape from 2000 to 2025. The Service is provided by 
                Zulu Group Ltd for informational and educational purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">3. User Accounts</h2>
              <p className="mb-3">When you create an account, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">4. User Conduct</h2>
              <p className="mb-3">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use the Service for any unlawful purpose</li>
                <li>Submit false or misleading information</li>
                <li>Interfere with the proper functioning of the Service</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Post spam, malicious content, or inappropriate material</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">5. Intellectual Property</h2>
              <p>
                All content, features, and functionality of the Service, including but not limited to 
                text, graphics, logos, and software, are the exclusive property of Zulu Group Ltd and 
                are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">6. User Content</h2>
              <p>
                By submitting content (such as comments or channel suggestions), you grant us a 
                non-exclusive, royalty-free license to use, modify, and display that content in 
                connection with the Service. You retain ownership of your content but are responsible 
                for ensuring it does not violate any laws or third-party rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">7. Disclaimer of Warranties</h2>
              <p>
                The Service is provided "as is" and "as available" without warranties of any kind, 
                either express or implied. We do not warrant that the Service will be uninterrupted, 
                error-free, or free of harmful components. The data and visualizations are provided 
                for informational purposes only and should not be relied upon as the sole basis for 
                any decisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">8. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, Zulu Group Ltd shall not be liable for any 
                indirect, incidental, special, consequential, or punitive damages arising from your 
                use of the Service, even if we have been advised of the possibility of such damages.
              </p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">9. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your access to the Service at any time, 
                without prior notice, for conduct that we believe violates these Terms or is harmful 
                to other users, us, or third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">10. Changes to Terms</h2>
              <p>
                We may modify these Terms at any time. We will notify users of significant changes 
                by posting a notice on the Service. Your continued use of the Service after changes 
                are posted constitutes your acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">11. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of England 
                and Wales, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">12. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at{" "}
                <a href="mailto:hello@zulu.group" className="text-white underline hover:text-white/80">
                  hello@zulu.group
                </a>
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <Link
              to="/privacy"
              className="text-white/70 hover:text-white transition-colors underline text-sm"
            >
              View Privacy Policy →
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

export default TermsOfService;
