import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
interface SignUpGateProps {
  onJoin: (name: string, email: string) => void;
}
const MAILCHIMP_ACTION = "https://group.us14.list-manage.com/subscribe/post?u=8cebbb69cb233fee8e96a59fe&amp;id=de54a87f37";
const SignUpGate: React.FC<SignUpGateProps> = ({
  onJoin
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      onJoin(name, email);
    }, 500);
  };
  return <div className="min-h-screen flex flex-col" style={{
    background: 'linear-gradient(135deg, hsl(180 25% 25%) 0%, hsl(170 30% 18%) 50%, hsl(200 20% 30%) 100%)'
  }}>
      {/* Header */}
      <header className="flex items-center justify-between p-6 md:p-8">
        <nav className="flex flex-col gap-1">
          <span className="text-white/90 text-sm font-medium tracking-wide uppercase">Home</span>
        </nav>
        
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 md:px-12 lg:px-24 py-12">
        <div className="w-full max-w-2xl rounded-lg p-8 md:p-12" style={{
        background: 'linear-gradient(180deg, hsla(180 20% 35% / 0.4) 0%, hsla(170 25% 25% / 0.3) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid hsla(180 30% 50% / 0.15)'
      }}>
          {/* Icon */}
          <div className="mb-8">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-white/90">
              <path d="M24 4L24 44M4 24L44 24M10.1 10.1L37.9 37.9M37.9 10.1L10.1 37.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-6 lg:text-4xl">
            Explore how media has transformed over 25 years
          </h1>

          {/* Description */}
          <p className="text-white/70 text-base leading-relaxed mb-8 max-w-lg md:text-sm">Sign up to our newsletter to unlock the interactive infographic.
We respect your privacy. No spam, only interesting ideas.</p>

          {error && <div className="bg-red-500/20 text-red-200 text-sm p-3 rounded-lg mb-6 border border-red-500/30">
              {error}
            </div>}

          <iframe name="hiddenFrame" className="hidden" title="hiddenFrame" />

          <form action={MAILCHIMP_ACTION} method="POST" target="hiddenFrame" onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <Input type="text" name="FNAME" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30 focus-visible:ring-offset-0" />
            <Input type="email" name="EMAIL" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30 focus-visible:ring-offset-0" />

            <div className="absolute -left-[5000px]" aria-hidden="true">
              <input type="text" name="b_8cebbb69cb233fee8e96a59fe_de54a87f37" tabIndex={-1} defaultValue="" />
            </div>

            <button type="submit" disabled={submitted} style={{
            background: 'white',
            color: 'hsl(170 30% 18%)',
            mixBlendMode: 'screen'
          }} className="h-12 px-8 tracking-widest uppercase transition-all duration-300 rounded-md text-xs bg-white font-sans opacity-100">
              {submitted ? 'Unlocking...' : 'Unlock Infographic'}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex items-end justify-between p-6 md:p-8">
        <div className="text-white/50 text-[10px] font-mono uppercase leading-relaxed max-w-xs">ZULU DIGITAL MICROSCOPE: US MEDIA 2000-2025 
        <br />
          ​Powered by Zulu Group<br />
          ​
        </div>
        
      </footer>
    </div>;
};
export default SignUpGate;