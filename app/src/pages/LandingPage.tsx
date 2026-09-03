import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Copy,
  Check,
  Loader2,
  Terminal,
  ChevronDown,
  Github,
  ArrowUpRight,
  GitPullRequest,
  GitFork,
  Code2,
  ExternalLink,
  LayoutGrid,
  Table,
  Palette,
  ShieldCheck,
  Clock,
  Server,
  Star,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/ui/Logo";
import { useAuth } from "@/context/auth";
import gsap from "gsap";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";


const contributionSteps = [
  {
    step: "01",
    title: "Fork & Clone Repository",
    cmd: "git clone https://github.com/ISTEBITS/EasyForms.git",
    icon: GitFork,
    badge: "Step 1",
  },
  {
    step: "02",
    title: "Install & Start Development",
    cmd: "npm install && npm run dev",
    icon: Terminal,
    badge: "Step 2",
  },
  {
    step: "03",
    title: "Pick a Good First Issue",
    cmd: "https://github.com/ISTEBITS/EasyForms/issues",
    icon: Code2,
    badge: "Step 3",
  },
  {
    step: "04",
    title: "Submit Pull Request",
    cmd: "git push origin feature-branch",
    icon: GitPullRequest,
    badge: "Step 4",
  },
];


const coreFeatures = [
  {
    title: "Visual Drag & Drop Builder",
    desc: "Construct dynamic forms with 12+ question types, Multiple Choice Grids, Markdown headers, and instant preview.",
    icon: LayoutGrid,
    badge: "Form Editor",
  },
  {
    title: "Real-Time Response Spreadsheet",
    desc: "Google Sheets-style live collaboration with remote cursors, in-cell editing, silent auto-save, and CSV exports.",
    icon: Table,
    badge: "Collaboration",
  },
  {
    title: "Brand Themes & Custom Slugs",
    desc: "Customize logos, brand names, header banners, custom URL slugs, and clean Geist-inspired dark aesthetics.",
    icon: Palette,
    badge: "Branding",
  },
  {
    title: "Granular Role-Based Access",
    desc: "Collaborate securely with Viewer, Editor, and Admin permissions on form building and response management.",
    icon: ShieldCheck,
    badge: "Security",
  },
  {
    title: "Submission Limits & Deadlines",
    desc: "Enforce Google OAuth authentication, response caps, timed submission deadlines, and custom closing messages.",
    icon: Clock,
    badge: "Controls",
  },
  {
    title: "100% Open-Source & Self-Hostable",
    desc: "Full MIT License built on React, Vite, Node.js, Express, and MongoDB. Deploy anywhere on your own terms.",
    icon: Server,
    badge: "Open Source",
  },
];

const faqData = [
  {
    q: "What is EasyForms?",
    a: "EasyForms is a modern, full-featured open-source form builder platform. It enables teams and creators to build dynamic forms, collect verified submissions, collaborate in real-time on response spreadsheets, and export clean data without vendor lock-in.",
  },
  {
    q: "How can I contribute to EasyForms?",
    a: "We actively welcome community contributions! You can fork the repository on GitHub, pick any issue labeled 'good first issue', and submit a Pull Request following our CONTRIBUTING.md guidelines. Everything from UI enhancements to backend optimizations is appreciated.",
  },
  {
    q: "Can I self-host EasyForms on my own servers?",
    a: "Yes. EasyForms is 100% open source under the permissive MIT License. You can deploy it using Docker or run the Node.js/Express server and Vite frontend on AWS, Vercel, Render, Railway, or your own self-hosted VPS.",
  },
  {
    q: "Who develops and maintains EasyForms?",
    a: "EasyForms is engineered, open-sourced, and actively maintained by the student developers and tech leads at ISTE Students' Chapter, BIT Sindri (ISTE BIT Sindri).",
  },
];


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
      className="gap-2.5 h-12 px-7 font-medium text-sm border-transparent cursor-pointer rounded-full bg-white text-black hover:bg-zinc-200 transition-all shadow-xl"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-black" />
      ) : (
        <GoogleIcon className="h-4 w-4" />
      )}
      <span>Sign in with Google</span>
    </Button>
  );
}

interface GithubContributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

interface GithubRepoStats {
  stars: number;
  forks: number;
  openIssues: number;
  contributorsCount: number;
}

const DEFAULT_CONTRIBUTORS: GithubContributor[] = [
  {
    login: "CoderAk0021",
    avatar_url: "https://avatars.githubusercontent.com/u/125991648?v=4",
    html_url: "https://github.com/CoderAk0021",
    contributions: 57,
  },
  {
    login: "anupmandal-dev",
    avatar_url: "https://avatars.githubusercontent.com/u/89408660?v=4",
    html_url: "https://github.com/ISTEBITS/EasyForms",
    contributions: 8,
  },
];


export function LandingPage() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [copiedClone, setCopiedClone] = useState(false);
  const [copiedStep, setCopiedStep] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [repoStats, setRepoStats] = useState<GithubRepoStats>({
    stars: 4,
    forks: 0,
    openIssues: 0,
    contributorsCount: 2,
  });
  const [contributors, setContributors] = useState<GithubContributor[]>(DEFAULT_CONTRIBUTORS);

  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const googleClientId = import.meta.env.VITE_CLIENT_ID as string | undefined;

  const repoCloneUrl = "git clone https://github.com/ISTEBITS/EasyForms.git";

  // Fetch real GitHub stats and contributor profiles dynamically
  useEffect(() => {
    let isMounted = true;
    async function fetchGithubData() {
      try {
        const [repoRes, contribRes] = await Promise.allSettled([
          fetch("https://api.github.com/repos/ISTEBITS/EasyForms"),
          fetch("https://api.github.com/repos/ISTEBITS/EasyForms/contributors"),
        ]);

        if (repoRes.status === "fulfilled" && repoRes.value.ok) {
          const repoData = await repoRes.value.json();
          if (isMounted && repoData) {
            setRepoStats((prev) => ({
              ...prev,
              stars: typeof repoData.stargazers_count === "number" ? repoData.stargazers_count : prev.stars,
              forks: typeof repoData.forks_count === "number" ? repoData.forks_count : prev.forks,
              openIssues: typeof repoData.open_issues_count === "number" ? repoData.open_issues_count : prev.openIssues,
            }));
          }
        }

        if (contribRes.status === "fulfilled" && contribRes.value.ok) {
          const contribData = await contribRes.value.json();
          if (isMounted && Array.isArray(contribData) && contribData.length > 0) {
            const parsedContribs: GithubContributor[] = contribData.map((c: Record<string, unknown>) => ({
              login: String(c.login || "contributor"),
              avatar_url: String(c.avatar_url || "https://github.com/ghost.png"),
              html_url: String(c.html_url || "https://github.com/ISTEBITS/EasyForms"),
              contributions: Number(c.contributions) || 1,
            }));
            setContributors(parsedContribs);
            setRepoStats((prev) => ({
              ...prev,
              contributorsCount: parsedContribs.length,
            }));
          }
        }
      } catch {
        // Fallback default verified contributors already set
      }
    }

    void fetchGithubData();
    return () => {
      isMounted = false;
    };
  }, []);

  // GSAP Entrance & Scroll Animations (Respects prefers-reduced-motion)
  useLayoutEffect(() => {
    if (!rootRef.current) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-gsap='hero']",
        { y: 24, autoAlpha: 0 },
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
        threshold: 0.12,
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

  const copyCloneCmd = () => {
    void navigator.clipboard.writeText(repoCloneUrl);
    setCopiedClone(true);
    toast.success("Copied git clone command to clipboard");
    setTimeout(() => setCopiedClone(false), 2000);
  };

  const copyStepCmd = (stepId: string, cmd: string) => {
    void navigator.clipboard.writeText(cmd);
    setCopiedStep(stepId);
    setTimeout(() => setCopiedStep(null), 2000);
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
      {/* Background Texture: Subtle Radial Light + Hairline Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px] opacity-60" />
      </div>

      {/* ==========================================
          1. FIXED GLASSMORPHISM NAVBAR
      ========================================== */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-white/10 bg-black/70 backdrop-blur-xl transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo & Maintainer Label with Avatar Stack */}
          <div className="flex items-center gap-3">
            <div className="flex items-center -space-x-2 overflow-hidden">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white bg-zinc-950 p-1 shadow-sm">
                <img src="/logo.svg" alt="EasyForms" className="h-full w-full object-contain" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white font-sans">
                EasyForms
              </span>
              <span className="text-sm text-zinc-400 font-medium">
                by ISTE BIT Sindri
              </span>
            </div>
          </div>

          {/* Centered Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("contribute")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              How to Contribute
            </button>
            <button
              onClick={() => scrollToSection("community")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Community
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
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-zinc-900 px-4 py-1.5 text-sm font-medium text-zinc-200 hover:border-white/35 hover:text-white transition-all cursor-pointer"
            >
              <Github className="h-4 w-4" />
              <span>Star on GitHub</span>
            </a>

            <button
              type="button"
              onClick={() => void handleSignIn()}
              disabled={isCheckingSession}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-white/20 hover:border-white/40 disabled:opacity-50 cursor-pointer shadow-sm backdrop-blur-md"
            >
              {isCheckingSession ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Checking...</span>
                </>
              ) : (
                <span>Admin Login</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pt-28 pb-16 sm:px-6 lg:px-8 space-y-28">
        
        {/* HERO SECTION*/}
        <main className="flex-1 space-y-28">
          <section data-gsap="hero" className="mx-auto max-w-3xl text-center space-y-8 pt-4">
            
            {/* Top Maintainer Pill with Overlapping Avatar Stack */}
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-zinc-900/90 pl-1.5 pr-4 py-1 text-sm text-zinc-300 backdrop-blur-md shadow-sm hover:border-white/30 transition-all">
              <div className="flex items-center -space-x-2 overflow-hidden">
                <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-black bg-zinc-950 p-1 shadow-xs">
                  <img src="/logo.svg" alt="EasyForms Logo" className="h-full w-full object-contain" />
                </div>
                <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white p-0.5 shadow-xs">
                  <img src="/iste-logo.png" alt="ISTE BIT Sindri Logo" className="h-full w-full object-contain rounded-full" />
                </div>
              </div>

              <span className="font-medium text-zinc-200 flex items-center gap-1.5">
                <span>Maintained by</span>
                <strong className="font-semibold text-white">ISTE BIT Sindri</strong>
              </span>
            </div>

            {/* Display Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl leading-[1.08] font-sans">
              The Modern Open-Source Form Builder
            </h1>

            {/* Subtitle */}
            <p className="mx-auto max-w-2xl text-base sm:text-lg text-zinc-400 leading-relaxed font-sans">
              Create dynamic forms, customize brand identities, collaborate in real time on responses, and self-host seamlessly with complete data ownership.
            </p>

            {/* High-Converting CTA Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              {googleClientId ? (
                <GoogleOAuthProvider clientId={googleClientId}>
                  <CustomGoogleSignInButton />
                </GoogleOAuthProvider>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate("/login")}
                  className="gap-2.5 h-12 px-7 text-sm font-medium cursor-pointer rounded-full bg-white text-black hover:bg-zinc-200 transition-all shadow-xl"
                >
                  <span>Start Creating Forms</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              )}

              <a
                href="https://github.com/ISTEBITS/EasyForms"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-7 text-sm font-medium text-white transition-all hover:bg-white/10 hover:border-white/35 cursor-pointer backdrop-blur-md"
              >
                <Github className="h-4 w-4" />
                <span>Contribute on GitHub</span>
              </a>
            </div>

            {/* One-Click Git Clone Quickstart Bar */}
            <div className="mx-auto max-w-lg rounded-2xl border border-white/15 bg-zinc-950 p-2 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between rounded-xl bg-black px-4 py-3 border border-white/10">
                <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
                  <Terminal className="h-4 w-4 text-zinc-400 shrink-0" />
                  <code className="font-mono text-sm text-zinc-200 truncate select-all">
                    {repoCloneUrl}
                  </code>
                </div>
                <button
                  onClick={copyCloneCmd}
                  className="ml-3 shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer bg-zinc-900 border border-white/10 px-3 py-1 rounded-lg"
                >
                  {copiedClone ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span>{copiedClone ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
          </section>

          {/* CORE FEATURES GRID*/}
          <section id="features" data-scroll className="space-y-8 scroll-mt-28">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
                Core Capabilities
              </span>
              <h2 className="text-3xl font-extrabold text-white font-sans sm:text-4xl">
                Engineered for Modern Teams
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 font-sans">
                Everything you need to publish forms, record submissions, and analyze results seamlessly.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {coreFeatures.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-zinc-950/60 p-6 sm:p-7 space-y-4 hover:border-white/30 transition-all duration-200 group backdrop-blur-md shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-zinc-900 text-white group-hover:scale-110 transition-transform">
                        <Icon className="h-5 w-5 text-zinc-200" />
                      </div>
                      <span className="text-sm font-medium border border-white/10 px-3 py-0.5 rounded-full bg-zinc-900 text-zinc-300">
                        {item.badge}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-sans text-base font-bold text-white group-hover:text-zinc-200 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* CONTRIBUTION PATHWAY (4 STEPS) */}
          <section id="contribute" data-scroll className="space-y-12 scroll-mt-28">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="text-3xl font-extrabold text-white font-sans sm:text-4xl">
                How to Contribute
              </h2>
            </div>

            {/* 4 Staggered Steps */}
            <div className="relative max-w-4xl mx-auto">
              <div className="space-y-6 relative">
                {contributionSteps.map((step) => {
                  const Icon = step.icon;
                  const isCopied = copiedStep === step.step;

                  return (
                    <div
                      key={step.step}
                      className="rounded-2xl border border-white/10 bg-zinc-950/70 p-6 sm:p-7 space-y-4 hover:border-white/30 transition-all duration-200 group backdrop-blur-md shadow-xl"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-zinc-900 text-white">
                            <Icon className="h-4.5 w-4.5 text-zinc-200" />
                          </div>
                          <h3 className="font-sans text-base sm:text-lg font-bold text-white">
                            {step.title}
                          </h3>
                        </div>
                        <span className="text-sm font-semibold text-zinc-300 border border-white/15 bg-zinc-900 px-3 py-0.5 rounded-full">
                          {step.badge}
                        </span>
                      </div>

                      {/* Code Block with One-Click Copy */}
                      <div className="rounded-xl border border-white/10 bg-black p-3.5 flex items-center justify-between gap-3 shadow-inner">
                        <code className="font-mono text-sm text-zinc-200 select-all overflow-x-auto">
                          {step.cmd}
                        </code>
                        <button
                          onClick={() => copyStepCmd(step.step, step.cmd)}
                          className="shrink-0 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer bg-zinc-900 border border-white/10 px-3 py-1 rounded-lg"
                        >
                          {isCopied ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          <span>{isCopied ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <a
                href="https://github.com/ISTEBITS/EasyForms/issues"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-transparent bg-white px-7 text-sm font-semibold text-black hover:bg-zinc-200 transition-all cursor-pointer shadow-lg"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Browse Good First Issues</span>
              </a>
              <a
                href="https://github.com/ISTEBITS/EasyForms/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 text-sm font-medium text-white hover:bg-white/10 hover:border-white/35 transition-all cursor-pointer backdrop-blur-md"
              >
                <GitPullRequest className="h-4 w-4" />
                <span>Read CONTRIBUTING.md</span>
              </a>
            </div>
          </section>

          {/* ISTE BIT SINDRI COMMUNITY & STATS */}
          <section id="community" data-scroll className="space-y-8 scroll-mt-28">
            <div className="rounded-3xl border border-white/15 bg-zinc-950 p-8 sm:p-12 text-center space-y-6 max-w-4xl mx-auto backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-zinc-900 pl-1.5 pr-4 py-1 text-sm text-zinc-300">
                <div className="flex items-center -space-x-2 overflow-hidden">
                  <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black bg-zinc-950 p-0.5">
                    <img src="/logo.svg" alt="EasyForms" className="h-full w-full object-contain" />
                  </div>
                  <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white p-0.5">
                    <img src="/iste-logo.png" alt="ISTE BIT Sindri" className="h-full w-full object-contain rounded-full" />
                  </div>
                </div>
                <span><strong className="text-white font-semibold">ISTE BIT Sindri</strong></span>
              </div>
              

              {/* Real GitHub Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/10">
                <a
                  href="https://github.com/ISTEBITS/EasyForms"
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 bg-black border border-white/10 rounded-2xl hover:border-white/30 transition-all group cursor-pointer"
                >
                  <div className="text-2xl font-bold text-white flex items-center justify-center gap-1.5 group-hover:text-amber-300 transition-colors">
                    <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                    <span>{repoStats.stars}</span>
                  </div>
                  <div className="text-sm text-zinc-400 mt-1">GitHub Stars</div>
                </a>

                <a
                  href="https://github.com/ISTEBITS/EasyForms/network/members"
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 bg-black border border-white/10 rounded-2xl hover:border-white/30 transition-all group cursor-pointer"
                >
                  <div className="text-2xl font-bold text-white flex items-center justify-center gap-1.5 group-hover:text-zinc-200 transition-colors">
                    <GitFork className="h-5 w-5 text-zinc-300" />
                    <span>{repoStats.forks}</span>
                  </div>
                  <div className="text-sm text-zinc-400 mt-1">Forks</div>
                </a>

                <a
                  href="https://github.com/ISTEBITS/EasyForms/graphs/contributors"
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 bg-black border border-white/10 rounded-2xl hover:border-white/30 transition-all group cursor-pointer"
                >
                  <div className="text-2xl font-bold text-white flex items-center justify-center gap-1.5 group-hover:text-emerald-300 transition-colors">
                    <Users className="h-5 w-5 text-emerald-400" />
                    <span>{repoStats.contributorsCount}</span>
                  </div>
                  <div className="text-sm text-zinc-400 mt-1">Contributors</div>
                </a>

                <a
                  href="https://github.com/ISTEBITS/EasyForms/blob/main/LICENSE"
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 bg-black border border-white/10 rounded-2xl hover:border-white/30 transition-all group cursor-pointer"
                >
                  <div className="text-2xl font-bold text-white flex items-center justify-center gap-1.5 group-hover:text-sky-300 transition-colors">
                    <ShieldCheck className="h-5 w-5 text-sky-400" />
                    <span>MIT</span>
                  </div>
                  <div className="text-sm text-zinc-400 mt-1">Open License</div>
                </a>
              </div>

              {/* Real Contributors Showcase Wall */}
              <div className="pt-6 border-t border-white/10 space-y-5 text-left">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white font-sans">
                      Top Contributors
                    </h3>
                  </div>

                  <a
                    href="https://github.com/ISTEBITS/EasyForms/graphs/contributors"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>View all</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {contributors.map((contrib) => (
                    <a
                      key={contrib.login}
                      href={contrib.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-black hover:border-white/30 hover:bg-zinc-900/60 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={contrib.avatar_url}
                          alt={contrib.login}
                          className="h-9 w-9 rounded-full border border-white/20 object-cover shrink-0 group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://github.com/ghost.png";
                          }}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white truncate group-hover:text-zinc-200 transition-colors">
                            @{contrib.login}
                          </div>
                          <div className="text-sm text-zinc-400">
                            {contrib.contributions} {contrib.contributions === 1 ? "contribution" : "contributions"}
                          </div>
                        </div>
                      </div>

                      <ExternalLink className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors shrink-0" />
                    </a>
                  ))}

                  {/* Join Contributors Card */}
                  <a
                    href="https://github.com/ISTEBITS/EasyForms/blob/main/CONTRIBUTING.md"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-dashed border-white/20 bg-zinc-900/30 hover:border-white/40 hover:bg-zinc-900/60 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-white/30 bg-zinc-900 text-white font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
                        +
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">
                          You?
                        </div>
                        <div className="text-sm text-emerald-400">
                          Join our contributors
                        </div>
                      </div>
                    </div>

                    <ArrowUpRight className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* DEVELOPER FAQ ACCORDION */}
          <section id="faq" data-scroll className="space-y-6 scroll-mt-28 max-w-4xl mx-auto">
            <div className="text-center space-y-1 border-b border-white/10 pb-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-sans">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3">
              {faqData.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={faq.q}
                    className="rounded-2xl border border-white/10 bg-zinc-950/70 backdrop-blur-md overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-5 text-left font-sans text-sm sm:text-base font-semibold text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`h-5 w-5 text-zinc-400 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-white" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-sm sm:text-base leading-relaxed text-zinc-400 font-sans border-t border-white/10 pt-4">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

        </main>

        {/* FOOTER */}
        <footer className="mt-20 border-t border-white/10 pt-8 flex flex-wrap items-center justify-between gap-4 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <Logo size={18} />
            <span>Open-source project maintained by <strong className="text-white">ISTE BIT Sindri</strong> &copy; {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/ISTEBITS/EasyForms"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://github.com/ISTEBITS/EasyForms/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              Contributing
            </a>
            <a
              href="https://github.com/ISTEBITS/EasyForms/issues"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              Issues
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
