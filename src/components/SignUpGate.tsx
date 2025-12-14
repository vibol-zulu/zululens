import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface SignUpGateProps {
  onJoin: (name: string, email: string) => void;
}

const MAILCHIMP_ACTION = "https://group.us14.list-manage.com/subscribe/post?u=8cebbb69cb233fee8e96a59fe&amp;id=de54a87f37";

const SignUpGate: React.FC<SignUpGateProps> = ({ onJoin }) => {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-primary">
            Zulu Digital Microscope
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            US Media Landscape: 2000 vs 2025
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground mb-6">
            Sign up to our newsletter to gain access.<br />
            We respect your privacy — no spam, only interesting ideas.
          </p>
          
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <iframe name="hiddenFrame" className="hidden" title="hiddenFrame" />

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
              className="h-12"
            />
            <Input 
              type="email" 
              name="EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="h-12"
            />

            <div className="absolute -left-[5000px]" aria-hidden="true">
              <input type="text" name="b_8cebbb69cb233fee8e96a59fe_de54a87f37" tabIndex={-1} defaultValue="" />
            </div>

            <Button 
              type="submit"
              disabled={submitted}
              className="w-full h-12 text-base font-semibold"
            >
              {submitted ? 'Unlocking...' : 'Unlock Infographic'}
            </Button>
          </form>
          
          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Powered by Zulu Group
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpGate;
