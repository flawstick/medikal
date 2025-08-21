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

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    age: '',
    company: 'medikal'
  });
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // First, check if user already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('email', formData.email)
        .single();

      if (existingProfile) {
        setError('המייל כבר רשום במערכת. נסו להתחבר במקום.');
        return;
      }

      // Create temporary profile first (without user ID since we don't have it yet)
      const tempId = crypto.randomUUID();
      const { error: tempProfileError } = await supabase
        .from('user_profiles')
        .insert({
          id: tempId,
          email: formData.email,
          name: formData.name,
          age: parseInt(formData.age),
          company: formData.company,
          approved: false,
          created_at: new Date().toISOString()
        });

      if (tempProfileError) throw tempProfileError;

      // Now send magic link for signup
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?signup=true&temp_id=${tempId}`,
          data: {
            name: formData.name,
            age: formData.age,
            company: formData.company,
            approved: false,
            temp_profile_id: tempId
          }
        },
      });

      if (magicError) {
        // Clean up temp profile if magic link failed
        await supabase
          .from('user_profiles')
          .delete()
          .eq('id', tempId);
        throw magicError;
      }
      
      setShowSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  const testimonials: Testimonial[] = [
    {
      avatarSrc: "/placeholder-user.jpg",
      name: "שרה כהן",
      handle: "@sarah_medical",
      text: "הצטרפתי לצוות והמערכת שינתה את האופן שבו אנחנו עובדים!",
    },
    {
      avatarSrc: "/placeholder-user.jpg",
      name: "דוד לוי",
      handle: "@david_logistics",
      text: "תהליך ההצטרפות פשוט ומהיר. ממליץ בחום!",
    },
    {
      avatarSrc: "/placeholder-user.jpg",
      name: "רחל ברק",
      handle: "@rachel_ops",
      text: "הכלים שהמערכת מספקת חסכו לנו המון זמן!",
    },
  ];

  if (showSuccess) {
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
            שלחנו לכם קישור קסם להשלמת הרישום.<br />
            לחצו על הקישור במייל כדי להפעיל את החשבון שלכם.
          </p>
          <button
            onClick={() => router.push('/login')}
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
              <span className="font-light text-foreground tracking-tighter">הצטרפו למדי-קל</span>
            </h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">
              הירשמו והצטרפו לצוות ניהול המשלוחים הרפואיים
            </p>

            {error && (
              <div className="animate-element p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSignUp}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-muted-foreground">שם מלא</label>
                <GlassInputWrapper>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="הכניסו את שמכם המלא" 
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" 
                    required
                    disabled={isLoading}
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-muted-foreground">כתובת אימייל</label>
                <GlassInputWrapper>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="הכניסו את כתובת האימייל" 
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" 
                    required
                    disabled={isLoading}
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500">
                <label className="text-sm font-medium text-muted-foreground">גיל</label>
                <GlassInputWrapper>
                  <input 
                    type="number" 
                    min="18"
                    max="120"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    placeholder="הכניסו את גילכם" 
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" 
                    required
                    disabled={isLoading}
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-600">
                <label className="text-sm font-medium text-muted-foreground">חברה</label>
                <GlassInputWrapper>
                  <select 
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none cursor-pointer" 
                    required
                    disabled={isLoading}
                  >
                    <option value="medikal" className="bg-background">מדי-קל</option>
                  </select>
                </GlassInputWrapper>
              </div>

              <button 
                type="submit" 
                className="animate-element animate-delay-700 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'נרשם...' : 'הירשמו'}
              </button>
            </form>

            <p className="animate-element animate-delay-800 text-center text-sm text-muted-foreground">
              כבר יש לכם חשבון? <a href="/login" className="text-violet-400 hover:underline transition-colors">התחברו</a>
            </p>
          </div>
        </div>
      </section>

      <section className="hidden md:block flex-1 relative p-4">
        <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center" 
             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2370&q=80')" }}>
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