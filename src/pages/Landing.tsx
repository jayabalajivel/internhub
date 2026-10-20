import { useState, useEffect } from 'react'
import {
  SparklesIcon, ArrowRightIcon, StarIcon, ZapIcon, ShieldIcon,
  BrainIcon, TrendUpIcon, RocketIcon, AwardIcon, SearchIcon, MapPinIcon, BriefcaseIcon, CheckIcon
} from '../components/Icons'
import logo from '../assets/logo.png'

type Page = 'landing' | 'auth' | 'dashboard' | string

interface LandingProps {
  onNavigate: (p: Page) => void
}

const features = [
  {
    icon: ShieldIcon,
    color: '#10B981',
    bg: '#ECFDF5',
    title: 'Verified Opportunities',
    desc: 'Every internship is vetted against spam and fake listings using AI detection.',
  },
  {
    icon: BrainIcon,
    color: '#6366F1',
    bg: '#EEF2FF',
    title: 'AI Resume Matching',
    desc: 'Our semantic engine maps your skills to job requirements instantly.',
  },
  {
    icon: ZapIcon,
    color: '#F59E0B',
    bg: '#FFFBEB',
    title: 'Real-time Alerts',
    desc: 'Get notified immediately when highly-matched roles open up.',
  },
]

export default function Landing({ onNavigate }: LandingProps) {
  const [scrolled, setScrolled] = useState(false)
  const [searchRole, setSearchRole] = useState('')
  const [searchLocation, setSearchLocation] = useState('')

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      {/* Navigation */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md border-b border-slate-200 py-4 shadow-sm' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('landing')}>
            <img src={logo} alt="InternHub" className="w-9 h-9 object-contain" />
            <span className="font-bold text-xl tracking-tight text-slate-900">InternHub</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Find Jobs & Internships</button>
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">AI Resume Builder</button>
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Career Advice</button>
          </div>

          <div className="flex items-center gap-4">
            <button 
              className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors px-2"
              onClick={() => onNavigate('auth')}
            >
              Log in
            </button>
            <button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 px-5 rounded-full transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
              onClick={() => onNavigate('auth')}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-50/80 to-transparent -z-10" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-3xl -z-10" />
        <div className="absolute top-20 -left-20 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-3xl -z-10" />

        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-wide uppercase mb-8 shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            AI-Powered Career Platform
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
            Launch Your Career with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
              Verified Jobs & Internships
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop guessing. Our AI matches your skills with legitimate opportunities, helping you land your dream role faster and with zero spam.
          </p>

          {/* Quote Section instead of Search Box */}
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-center relative z-10">
            <blockquote className="text-xl md:text-2xl font-medium text-slate-700 italic text-center leading-relaxed">
              "Your career journey begins with the right opportunity. We bring you verified, high-quality jobs and internships tailored to your unique skills."
            </blockquote>
            <button 
              className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-8 rounded-xl transition-colors md:w-auto w-full shadow-md hover:shadow-lg"
              onClick={() => onNavigate('auth')}
            >
              Explore Now
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500 font-medium flex-wrap">
            <span>Popular:</span>
            <span className="px-3 py-1 rounded-full bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 cursor-pointer transition-colors shadow-sm">Frontend Developer</span>
            <span className="px-3 py-1 rounded-full bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 cursor-pointer transition-colors shadow-sm">Data Science</span>
            <span className="px-3 py-1 rounded-full bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 cursor-pointer transition-colors shadow-sm">UX Design</span>
            <span className="px-3 py-1 rounded-full bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 cursor-pointer transition-colors shadow-sm">Marketing</span>
          </div>
        </div>
      </section>

      {/* Stats/Social Proof Section */}
      <section className="py-10 border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center md:justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                </div>
              ))}
            </div>
            <div className="text-sm">
              <div className="flex items-center text-amber-400">
                <StarIcon size={14} className="fill-current" /><StarIcon size={14} className="fill-current" /><StarIcon size={14} className="fill-current" /><StarIcon size={14} className="fill-current" /><StarIcon size={14} className="fill-current" />
              </div>
              <span className="font-semibold text-slate-800">4.9/5</span> <span className="text-slate-500">from 10k+ students</span>
            </div>
          </div>
          
          <div className="h-10 w-[1px] bg-slate-200 hidden md:block"></div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">50K+</div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Active Jobs & Internships</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">99.8%</div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Spam Free</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">Top 1%</div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Company Matches</div>
          </div>
        </div>
      </section>

      {/* Value Prop Section */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">Everything you need to land your next role</h2>
            <p className="text-slate-600 text-lg">InternHub replaces multiple tools with one intelligent platform designed specifically for students and new grads.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-shadow duration-300 relative overflow-hidden group">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110" style={{ backgroundColor: f.bg, color: f.color }}>
                    <Icon size={26} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{f.desc}</p>
                  <div className="mt-6 flex items-center gap-1 text-sm font-semibold" style={{ color: f.color }}>
                    Learn more <ArrowRightIcon size={14} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Feature Showcase (App Preview) */}
      <section className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 mb-6">
              <TrendUpIcon size={24} />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-6">
              Stop blindly applying. <br />
              <span className="text-indigo-600">Start tracking.</span>
            </h2>
            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
              Our beautiful kanban dashboard gives you complete visibility over your application pipeline. Know exactly where you stand with every company, from applied to offer.
            </p>
            
            <ul className="space-y-4 mb-10">
              {[
                'Visual drag-and-drop pipeline',
                'Interview deadline reminders',
                'Automated status updates',
                'Salary & stipend tracking'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <CheckIcon size={14} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            
            <button 
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center gap-2"
              onClick={() => onNavigate('auth')}
            >
              See Dashboard <ArrowRightIcon size={16} />
            </button>
          </div>
          
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-blue-400 rounded-3xl blur-2xl opacity-20 transform rotate-3"></div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden relative z-10 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
              {/* Fake App Header */}
              <div className="h-12 border-b border-slate-100 flex items-center px-4 gap-2 bg-slate-50/80 backdrop-blur">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="mx-auto bg-white border border-slate-200 rounded-md py-1 px-24 text-[10px] text-slate-400 font-medium">internhub.com/tracker</div>
              </div>
              {/* Fake App Body */}
              <div className="p-6 bg-slate-50">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-slate-800">Applications</h4>
                  <button className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">+ Add New</button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {/* Column 1 */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">Applied <span className="bg-slate-200 text-slate-700 px-1.5 rounded-sm">2</span></div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">G</div>
                        <span className="text-xs font-bold text-slate-700">Google</span>
                      </div>
                      <div className="text-xs font-medium text-slate-800 mb-1">Frontend Engineer Intern</div>
                      <div className="text-[10px] text-slate-500">Applied 2d ago</div>
                    </div>
                  </div>
                  {/* Column 2 */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-indigo-500 uppercase flex items-center gap-2">Interview <span className="bg-indigo-100 text-indigo-700 px-1.5 rounded-sm">1</span></div>
                    <div className="bg-white p-3 rounded-xl border border-indigo-200 shadow-sm shadow-indigo-100 relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-xl"></div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-[10px] font-bold text-white">S</div>
                        <span className="text-xs font-bold text-slate-700">Stripe</span>
                      </div>
                      <div className="text-xs font-medium text-slate-800 mb-1">Software Intern</div>
                      <div className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded inline-block">Tech Screen • Tomorrow</div>
                    </div>
                  </div>
                  {/* Column 3 */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-emerald-500 uppercase flex items-center gap-2">Offer <span className="bg-emerald-100 text-emerald-700 px-1.5 rounded-sm">1</span></div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700">M</div>
                        <span className="text-xs font-bold text-slate-700">Microsoft</span>
                      </div>
                      <div className="text-xs font-medium text-slate-800 mb-1">Data Science Intern</div>
                      <div className="text-[10px] text-emerald-600 font-bold">₹80k/mo</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[100px] -z-10" />
        
        <div className="max-w-4xl mx-auto text-center z-10 relative">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Ready to find your perfect internship?</h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">Join thousands of students who are landing top-tier internships with the help of InternHub's AI engine.</p>
          
          <button 
            className="bg-white text-slate-900 hover:bg-indigo-50 font-bold py-4 px-10 rounded-xl transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] hover:-translate-y-1 text-lg"
            onClick={() => onNavigate('auth')}
          >
            Create Free Account
          </button>
          
          <div className="mt-6 text-sm text-slate-400 flex justify-center items-center gap-2">
            <ShieldIcon size={14} /> No credit card required. Cancel anytime.
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="InternHub" className="w-8 h-8 object-contain" />
              <span className="font-bold text-lg text-slate-900">InternHub</span>
            </div>
            <p className="text-slate-500 text-sm max-w-xs mb-6 leading-relaxed">
              The smartest way for students and grads to discover, track, and land jobs and internships.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Platform</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Search Jobs & Internships</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">AI Resume Matcher</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Application Tracker</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Pricing</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
          <div>© 2026 InternHub Career Platform. All rights reserved.</div>
          <div className="flex items-center gap-1">
            Made with <StarIcon size={12} className="text-rose-500 fill-current" /> for students
          </div>
        </div>
      </footer>
    </div>
  )
}
