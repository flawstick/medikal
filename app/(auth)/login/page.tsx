'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    {children}
  </div>
);

interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
  <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-card/40 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-5 w-64`}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-2xl" alt="avatar" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
      <p className="text-muted-foreground">{testimonial.handle}</p>
      <p className="mt-1 text-foreground/80">{testimonial.text}</p>
    </div>
  </div>
);

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMagicLinkSent, setShowMagicLinkSent] = useState(false);
  const [email, setEmail] = useState('');
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleMagicLinkSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;

    try {
      // First, check if user exists in our user_profiles table
      const { data: existingProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('email', email)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        throw profileError;
      }

      if (!existingProfile) {
        // User doesn't exist in our system
        setError('המשתמש לא נמצא במערכת. אנא הירשמו תחילה.');
        return;
      }

      // User exists, send magic link
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      
      setShowMagicLinkSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setIsLoading(false);
    }
  };

  const testimonials: Testimonial[] = [
    {
      avatarSrc: "/placeholder-user.jpg",
      name: "דני כהן",
      handle: "@dani_logistics",
      text: "המערכת הכי טובה לניהול משלוחים רפואיים. חסכנו 40% מזמן הניהול!",
    },
    {
      avatarSrc: "/placeholder-user.jpg",
      name: "מיכל לוי",
      handle: "@michal_med",
      text: "ממשק פשוט ואינטואיטיבי. הנהגים שלנו אוהבים את האפליקציה.",
    },
    {
      avatarSrc: "/placeholder-user.jpg",
      name: "יוסי ברק",
      handle: "@yossi_delivery",
      text: "שירות מעולה ותמיכה מהירה. ממליץ בחום!",
    },
  ];

  if (showMagicLinkSent) {
    return (
      <div className="h-[100dvh] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2">בדקו את המייל שלכם!</h2>
          <p className="text-muted-foreground mb-6">
            שלחנו לכם קישור קסם לכתובת<br />
            <span className="font-medium text-foreground">{email}</span>
          </p>
          <button
            onClick={() => {
              setShowMagicLinkSent(false);
              setEmail('');
            }}
            className="text-violet-400 hover:underline"
          >
            חזרה להתחברות
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw]">
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
              <span className="font-light text-foreground tracking-tighter">ברוכים הבאים למדי-קל</span>
            </h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">
              התחברו למערכת ניהול המשלוחים הרפואיים המתקדמת בישראל
            </p>

            {error && (
              <div className="animate-element p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleMagicLinkSignIn}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-muted-foreground">כתובת אימייל</label>
                <GlassInputWrapper>
                  <input 
                    name="email" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="הכניסו את כתובת האימייל" 
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" 
                    required
                    disabled={isLoading}
                  />
                </GlassInputWrapper>
              </div>

              <button 
                type="submit" 
                className="animate-element animate-delay-400 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'שולח קישור קסם...' : 'שלח לי קישור קסם'}
              </button>
            </form>

            <p className="animate-element animate-delay-500 text-center text-sm text-muted-foreground">
              נשלח לך קישור קסם למייל שלך להתחברות מאובטחת
            </p>

            <p className="animate-element animate-delay-600 text-center text-sm text-muted-foreground">
              חדש במערכת? <a href="/signup" className="text-violet-400 hover:underline transition-colors">הירשמו</a>
            </p>
          </div>
        </div>
      </section>

      <section className="hidden md:block flex-1 relative p-4">
        <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center" 
             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2535&q=80')" }}>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
          <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
          <div className="hidden xl:flex">
            <TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" />
          </div>
          <div className="hidden 2xl:flex">
            <TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" />
          </div>
        </div>
      </section>
    </div>
  );
}