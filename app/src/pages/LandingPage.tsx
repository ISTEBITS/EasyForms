import { useLayoutEffect, useRef, useState } from "react";
import {
  Copy,
  Check,
  Loader2,
  Terminal,
  HeartHandshake,
  Layers,
  ChevronDown,
  Cpu,
  Lock,
  Github,
  ArrowUpRight,
  GitPullRequest,
  GitFork,
  Code2,
  Mail,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/ui/Logo";
import { useAuth } from "@/context/auth";
import gsap from "gsap";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// ==========================================
// Quickstart Commands
// ==========================================
const installCommands = {
  npm: "npm i @easyforms/react @easyforms/core",
  pnpm: "pnpm add @easyforms/react @easyforms/core",
  docker: "docker run -d -p 3000:3000 easyforms/server:latest",
};

// ==========================================
// Contribution Timeline Data
// ==========================================
const timelineSteps = [
  {
    step: "01",
    title: "Fork & Clone Repository",
    cmd: "git clone https://github.com/ISTEBITS/EasyForms.git",
    desc: "Fork the official repository on GitHub and clone it to your local environment.",
    icon: GitFork,
    badge: "Step 1",
  },
  {
    step: "02",
    title: "Install Dependencies & Start Dev",
    cmd: "cd EasyForms && pnpm install && pnpm dev",
    desc: "Run pnpm to set up monorepo packages (@easyforms/core, react, node) and launch the Vite dev server.",
    icon: Terminal,
    badge: "Step 2",
  },
  {
    step: "03",
    title: "Pick a Good First Issue",
    cmd: "Filter GitHub issues labeled 'good first issue'",
    desc: "Choose an issue from core logic, React player themes, server webhooks, or documentation.",
    icon: Code2,
    badge: "Step 3",
  },
  {
    step: "04",
    title: "Submit Pull Request",
    cmd: "git push origin feature-branch -> Open PR",
    desc: "Submit your code changes for automated CI checks and code review by ISTE BIT Sindri maintainers.",
    icon: GitPullRequest,
    badge: "Step 4",
  },
];

// ==========================================
// Developer FAQ Data
// ==========================================
const faqData = [
  {
    q: "Who maintains EasyForms?",
    a: "EasyForms is engineered, open-sourced, and actively maintained by ISTE Students' Chapter, BIT Sindri (ISTE BIT Sindri).",
  },
  {
    q: "How do I embed EasyForms in my React or Next.js app?",
    a: "Install `@easyforms/react` and `@easyforms/core`, import `<FormPlayer />`, pass your `formId` and `apiKey`, and apply Geist CSS tokens effortlessly.",
  },
  {
    q: "Can I self-host EasyForms on custom infrastructure?",
    a: "Yes. EasyForms is 100% MIT open source. You can run the server via Docker (`docker run -p 3000:3000 easyforms/server`) on AWS, Vercel, Railway, or self-hosted VMs.",
  },
  {
    q: "How does server-side webhook signature verification work?",
    a: "All webhooks include an HMAC SHA-256 signature in `x-easyforms-signature`. Use `@easyforms/node`'s `constructEvent` to verify payload integrity.",
  },
];

// ==========================================
// Google OAuth Sign In Button
// ==========================================
function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.28v3.15C3.25 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.28C.46 8.21 0 10.05 0 12s.46 3.79 1.28 5.42l4-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.28 6.58l4 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

function CustomGoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginAsTestUserWithGoogle } = useAuth();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const resObj = tokenResponse as unknown as Record<string, string | undefined>;
        const token = resObj.access_token || resObj.id_token;
        if (!token) {
          toast.error("Failed to receive Google token");
          setLoading(false);
          return;
        }
        await loginAsTestUserWithGoogle(token);
        toast.success("Signed in with Google");
        navigate("/dashboard");
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Google login failed";
        toast.error(msg);
        setLoading(false);
      }
    },
    onError: () => {
      toast.error("Google authentication failed or cancelled");
      setLoading(false);
    },
    onNonOAuthError: (nonOAuthError) => {
      setLoading(false);
      if (nonOAuthError.type === "popup_closed") {
        toast.info("Google sign-in cancelled");
      }
    },
  });

  return (
    <Button
      variant="primary"
      size="lg"
      onClick={() => {
        setLoading(true);
        handleGoogleLogin();
        setTimeout(() => setLoading(false), 12000);
      }}
      disabled={loading}
      className="gap-2 h-11 px-6 font-medium text-sm border-transparent cursor-pointer rounded-full bg-foreground hover:bg-gray-300 text-background"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-white" />
      ) : (
        <GoogleIcon className="h-4 w-4" />
      )}
      <span>Sign in with Google</span>
    </Button>
  );
}

// ==========================================
// Main Landing Page Component
// ==========================================
export function LandingPage() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [activePkgTab, setActivePkgTab] = useState<keyof typeof installCommands>("npm");
  const [copiedPkg, setCopiedPkg] = useState(false);
  const [copiedTimelineStep, setCopiedTimelineStep] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const googleClientId = import.meta.env.VITE_CLIENT_ID as string | undefined;

  // GSAP Entrance & Scroll Animations (Respects prefers-reduced-motion)
  useLayoutEffect(() => {
    if (!rootRef.current) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const ctx = gsap.context(() => {
      // Hero entrance animation
      gsap.fromTo(
        "[data-gsap='hero']",
        { y: 30, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out" }
      );

      // Scroll Observer for scroll-driven reveals
      const observerCallback: IntersectionObserverCallback = (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-8");
          }
        });
      };

      const observer = new IntersectionObserver(observerCallback, {
        threshold: 0.15,
      });

      document.querySelectorAll("[data-scroll]").forEach((el) => {
        el.classList.add(
          "transition-all",
          "duration-700",
          "ease-out",
          "opacity-0",
          "translate-y-8"
        );
        observer.observe(el);
      });

      return () => observer.disconnect();
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const handleSignIn = async () => {
    if (isCheckingSession) return;
    setIsCheckingSession(true);
    try {
      const hasValidSession = await refreshSession();
      navigate(hasValidSession ? "/dashboard" : "/login");
    } finally {
      setIsCheckingSession(false);
    }
  };

  const copyInstallCmd = () => {
    void navigator.clipboard.writeText(installCommands[activePkgTab]);
    setCopiedPkg(true);
    toast.success(`Copied: ${installCommands[activePkgTab]}`);
    setTimeout(() => setCopiedPkg(false), 2000);
  };

  const copyTimelineCmd = (stepId: string, cmd: string) => {
    void navigator.clipboard.writeText(cmd);
    setCopiedTimelineStep(stepId);
    toast.success(`Copied: ${cmd}`);
    setTimeout(() => setCopiedTimelineStep(null), 2000);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      ref={rootRef}
      className="relative min-h-screen bg-black text-foreground font-sans selection:bg-white selection:text-black overflow-x-hidden"
    >
      {/* Texture Background: Fine Grid + Top Radial Spotlight Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.07),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px] opacity-70" />
      </div>

      {/* ==========================================
          1. FIXED GLASSMORPHISM NAVBAR AT TOP
      ========================================== */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo + Maintainer Tag */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center">
              <Logo size={25} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white font-sans flex items-center gap-1.5">
                EasyForms
              </span>
              <span className="text-[10px] font-mono text-zinc-400 font-medium">
                by ISTE BIT Sindri
              </span>
            </div>
          </div>

          {/* Centered Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-400">
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("timeline")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              How to Contribute
            </button>
            <button
              onClick={() => scrollToSection("iste-maintainers")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              ISTE BIT Sindri
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/ISTEBITS/EasyForms"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/80 px-3.5 py-1.5 font-mono text-xs text-zinc-300 hover:border-white/30 transition-all cursor-pointer"
            >
              <Github className="h-3.5 w-3.5" />
              <span>1.4k ⭐</span>
            </a>

            <button
              type="button"
              onClick={() => {
                void handleSignIn();
              }}
              disabled={isCheckingSession}
              className="inline-flex py-1.5 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-4 text-xs font-medium text-white transition-all hover:bg-white/20 hover:border-white/40 disabled:opacity-50 cursor-pointer shadow-lg backdrop-blur-md"
            >
              {isCheckingSession ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <span>Admin Login</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Full Width Page Container */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pt-24 pb-12 sm:px-6 lg:px-8 space-y-24">
        
        {/* ==========================================
            2. HERO SECTION (MONOCHROMATIC & MINIMAL)
        ========================================== */}
        <main className="flex-1 space-y-24">
          <section data-gsap="hero" className="mx-auto max-w-3xl text-center space-y-7 pt-6">
            
            {/* Top Double-Pill Badge (Monochromatic) */}
            <div className="inline-flex items-center rounded-full border border-white/10 bg-zinc-900/80 p-1 pr-3.5 text-xs font-mono text-zinc-300 backdrop-blur-md shadow-sm">
              <span className="mr-2.5 rounded-full bg-zinc-800 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-white/10">
                MAINTAINED BY
              </span>
              <span>ISTE BIT Sindri </span>
            </div>

            {/* Reduced Hero Title */}
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl leading-[1.08] font-sans">
              Open-Source Custom Form Builder 
            </h1>

            {/* Reduced Subtitle */}
            <p className="mx-auto max-w-xl text-base text-zinc-400 leading-relaxed font-sans">
              Embed custom forms with <code className="font-mono text-xs text-white bg-zinc-900 px-1.5 py-0.5 rounded border border-white/10">@easyforms/react</code> or self-host in minutes.
            </p>

            {/* Dual Pill Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
              {googleClientId ? (
                <GoogleOAuthProvider clientId={googleClientId}>
                  <CustomGoogleSignInButton />
                </GoogleOAuthProvider>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate("/login")}
                  className="gap-2 h-11 px-7 text-sm font-medium cursor-pointer rounded-full bg-white text-black hover:bg-zinc-200 shadow-xl"
                >
                  <span>Start Free Account</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              )}

              <a
                href="https://github.com/ISTEBITS/EasyForms"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 text-sm font-medium text-white transition-all hover:bg-white/10 hover:border-white/30 cursor-pointer backdrop-blur-md"
              >
                <span>Contribute on GitHub</span>
              </a>
            </div>

            {/* Vercel-Style Geist Quickstart Command Bar */}
            <div className="mx-auto max-w-md rounded-xl border border-white/15 bg-zinc-950 p-2 space-y-1.5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between px-2 text-[11px] font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Quickstart Install</span>
                </span>
                <div className="flex gap-1">
                  {(["npm", "pnpm"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActivePkgTab(tab)}
                      className={`px-2.5 py-0.5 text-[10px] uppercase font-mono rounded cursor-pointer transition-colors ${
                        activePkgTab === tab ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vercel Codeblock Box */}
              <div className="flex items-center justify-between bg-black rounded-lg px-3.5 py-2.5 border border-white/15 shadow-inner">
                <code className="font-mono text-xs text-white select-all overflow-x-auto">
                  {installCommands[activePkgTab]}
                </code>
                <button
                  onClick={copyInstallCmd}
                  className="ml-2 inline-flex items-center gap-1 font-mono text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedPkg ? (
                    <Check className="h-3.5 w-3.5 text-white" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copiedPkg ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
          </section>

          {/* ==========================================
              3. CORE FEATURES GRID (ON SCROLL ANIMATED)
          ========================================== */}
          <section id="features" data-scroll className="space-y-6 scroll-mt-28">
            <div className="text-center space-y-1">
              <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest font-semibold">
                Engine Capabilities
              </span>
              <h2 className="text-2xl font-bold text-white font-sans">Everything Needed for Custom Forms</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "@easyforms/react SDK",
                  desc: "Embed ready-to-use form players and native drag-and-drop builder components.",
                  icon: Layers,
                  badge: "UI Package",
                },
                {
                  title: "Headless Zod Engine",
                  desc: "Query raw form schemas and validate payloads server-side with zero lock-in.",
                  icon: Cpu,
                  badge: "Core SDK",
                },
                {
                  title: "HMAC Webhook Guard",
                  desc: "Verify authentic submission events via x-easyforms-signature using @easyforms/node.",
                  icon: Lock,
                  badge: "Security",
                },
                {
                  title: "Automated Email Receipts",
                  desc: "Trigger custom markdown emails & notification webhooks upon submission.",
                  icon: Mail,
                  badge: "Integrations",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-xl border border-white/10 bg-zinc-900/40 p-6 space-y-3 hover:border-white/30 transition-all duration-200 group backdrop-blur-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-white group-hover:scale-110 transition-transform">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <span className="font-mono text-[10px] uppercase font-bold border border-white/10 px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300">
                        {item.badge}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-sans text-sm font-bold text-white group-hover:text-zinc-200 transition-colors">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-400 leading-relaxed font-sans">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ==========================================
              4. ANIMATED TIMELINE WITH MONOCHROMATIC CODEBLOCKS & COPY BUTTONS
          ========================================== */}
          <section id="timeline" data-scroll className="space-y-12 scroll-mt-28">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-zinc-300 uppercase tracking-widest font-semibold bg-zinc-900 border border-white/15 px-3 py-1 rounded-full">
                <GitPullRequest className="h-3.5 w-3.5" />
                <span>Open Source Contribution Pathway</span>
              </span>
              <h2 className="text-3xl font-extrabold text-white font-sans sm:text-4xl">
                How to Contribute to EasyForms
              </h2>
              <p className="text-xs text-zinc-400 font-sans">
                Follow these 4 simple steps to make your first open-source contribution to ISTE BIT Sindri.
              </p>
            </div>

            {/* Timeline Wrapper (Vertical Stem + Staggered Cards) */}
            <div className="relative max-w-4xl mx-auto">
              {/* Connecting Vertical Stem Line */}
              <div className="absolute left-6 md:left-1/2 top-4 bottom-4 w-0.5 -translate-x-1/2 bg-gradient-to-b from-white/20 via-zinc-500/20 to-white/20 hidden sm:block" />

              <div className="space-y-8 relative">
                {timelineSteps.map((step, idx) => {
                  const Icon = step.icon;
                  const isEven = idx % 2 === 0;
                  const isCopied = copiedTimelineStep === step.step;

                  return (
                    <div
                      key={step.step}
                      className={`flex flex-col sm:flex-row items-center gap-6 ${
                        isEven ? "sm:flex-row-reverse" : ""
                      }`}
                    >
                      {/* Left/Right Card Body */}
                      <div className="w-full sm:w-1/2">
                        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-6 space-y-3.5 hover:border-white/30 transition-all duration-300 group backdrop-blur-md shadow-xl">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-white border border-white/20 bg-zinc-900 px-2.5 py-0.5 rounded-full">
                              {step.badge}
                            </span>
                            <span className="font-mono text-xs text-zinc-500">
                              Step {step.step} / 04
                            </span>
                          </div>

                          <h3 className="font-sans text-base font-bold text-white group-hover:text-zinc-200 transition-colors flex items-center gap-2">
                            <Icon className="h-4.5 w-4.5 text-zinc-300" />
                            <span>{step.title}</span>
                          </h3>

                          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                            {step.desc}
                          </p>

                          {/* Vercel-Style Monochromatic Codeblock with Copy Button */}
                          <div className="rounded-lg border border-white/15 bg-black p-3 font-mono text-xs text-zinc-300 flex items-center justify-between gap-2 shadow-inner">
                            <code className="select-all overflow-x-auto text-white">
                              {step.cmd}
                            </code>
                            <button
                              onClick={() => copyTimelineCmd(step.step, step.cmd)}
                              className="shrink-0 inline-flex items-center gap-1 font-mono text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer bg-zinc-900 border border-white/10 px-2 py-1 rounded"
                            >
                              {isCopied ? (
                                <Check className="h-3.5 w-3.5 text-white" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                              <span>{isCopied ? "Copied" : "Copy"}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Timeline Center Node Dot */}
                      <div className="relative flex items-center justify-center z-10 shrink-0">
                        <div className="h-10 w-10 rounded-full border border-white/20 bg-zinc-950 flex items-center justify-center text-white font-mono text-xs font-bold shadow-xl ring-4 ring-black group-hover:scale-110 transition-transform">
                          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                        </div>
                      </div>

                      {/* Spacer for 50% grid alignment */}
                      <div className="hidden sm:block sm:w-1/2" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <a
                href="https://github.com/ISTEBITS/EasyForms/issues"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-transparent bg-white px-6 text-xs font-bold text-black hover:bg-zinc-200 transition-all cursor-pointer shadow-lg"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Browse Good First Issues</span>
              </a>
              <a
                href="https://github.com/ISTEBITS/EasyForms/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 text-xs font-medium text-white hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer backdrop-blur-md"
              >
                <GitPullRequest className="h-3.5 w-3.5" />
                <span>View CONTRIBUTING.md</span>
              </a>
            </div>
          </section>

          {/* ==========================================
              5. ISTE BIT SINDRI MAINTAINER CARD
          ========================================== */}
          <section id="iste-maintainers" data-scroll className="space-y-8 scroll-mt-28">
            <div className="rounded-2xl border border-white/15 bg-zinc-950 p-8 sm:p-12 text-center space-y-6 max-w-4xl mx-auto backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900 px-4 py-1 text-xs font-mono text-zinc-300">
                <HeartHandshake className="h-4 w-4 text-rose-400" />
                <span>Managed & Maintained by ISTE BIT Sindri</span>
              </div>

              <h2 className="text-3xl font-extrabold tracking-tight text-white font-sans sm:text-4xl">
                Engineered by ISTE Students' Chapter, BIT Sindri
              </h2>

              <p className="text-sm text-zinc-300 max-w-xl mx-auto font-sans leading-relaxed">
                EasyForms is an open-source initiative led by <strong className="text-white">ISTE BIT Sindri</strong>. We invite student developers, open-source contributors, and engineers to collaborate under the MIT License.
              </p>

              {/* GitHub Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                <div className="p-3 bg-black border border-white/10 rounded-xl">
                  <div className="text-xl font-bold font-mono text-white">1,420+</div>
                  <div className="text-[11px] font-mono text-zinc-400">GitHub Stars</div>
                </div>
                <div className="p-3 bg-black border border-white/10 rounded-xl">
                  <div className="text-xl font-bold font-mono text-white">180+</div>
                  <div className="text-[11px] font-mono text-zinc-400">Forks</div>
                </div>
                <div className="p-3 bg-black border border-white/10 rounded-xl">
                  <div className="text-xl font-bold font-mono text-white">45+</div>
                  <div className="text-[11px] font-mono text-zinc-400">Contributors</div>
                </div>
                <div className="p-3 bg-black border border-white/10 rounded-xl">
                  <div className="text-xl font-bold font-mono text-white">MIT</div>
                  <div className="text-[11px] font-mono text-zinc-400">Open License</div>
                </div>
              </div>
            </div>
          </section>

          {/* ==========================================
              6. DEVELOPER FAQ ACCORDION (ON SCROLL)
          ========================================== */}
          <section id="faq" data-scroll className="space-y-6 scroll-mt-28 max-w-4xl mx-auto">
            <div className="text-center space-y-1 border-b border-white/10 pb-4">
              <h2 className="text-2xl font-bold text-white font-sans">
                Developer FAQ
              </h2>
            </div>

            <div className="space-y-3">
              {faqData.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={faq.q}
                    className="rounded-xl border border-white/10 bg-zinc-900/60 backdrop-blur-md"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 text-left font-sans text-sm font-semibold text-white hover:bg-white/5 cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-zinc-400 transition-transform ${
                          isOpen ? "rotate-180 text-white" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-xs leading-relaxed text-zinc-400 font-sans border-t border-white/10 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

        </main>

        {/* ==========================================
            FOOTER (ISTE BIT SINDRI CREDIT)
        ========================================== */}
        <footer className="mt-16 border-t border-white/10 pt-6 flex flex-wrap items-center justify-center gap-4 font-mono text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Logo size={14} />
            <span>Managed & Maintained with ❤️ by <strong className="text-white">ISTE BIT Sindri</strong> &copy; {new Date().getFullYear()}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}





