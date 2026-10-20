import {
  BellIcon,
  SparklesIcon,
  BriefcaseIcon,
  ZapIcon,
  AlertIcon,
  CheckIcon,
  TrendUpIcon,
} from "../components/Icons"

interface Props {
  onNavigate: (p: string) => void
}

const notifications = [
  {
    id: 1,
    type: "match",
    title: "5 New AI Internship Matches",
    desc: "Google, Stripe, Notion, Figma, and Linear posted roles that match your profile.",
    time: "2 hours ago",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    icon: SparklesIcon,
    unread: true,
  },
  {
    id: 2,
    type: "score",
    title: "Resume Score Improved",
    desc: "Your resume score increased from 79 to 87 after adding AWS certification.",
    time: "4 hours ago",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    icon: TrendUpIcon,
    unread: true,
  },
  {
    id: 3,
    type: "deadline",
    title: "Application Deadline Tomorrow",
    desc: "Stripe Software Engineer Intern — deadline is tomorrow, Aug 20.",
    time: "6 hours ago",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
    icon: AlertIcon,
    unread: true,
  },
  {
    id: 4,
    type: "match",
    title: "New Match: Figma Design Engineer",
    desc: "A new internship at Figma matches 91% of your profile skills.",
    time: "1 day ago",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
    icon: BriefcaseIcon,
    unread: true,
  },
  {
    id: 5,
    type: "skill",
    title: "Skill Gap Update",
    desc: "Docker is now required in 40% of Frontend roles you match. Consider learning it.",
    time: "2 days ago",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    icon: ZapIcon,
    unread: false,
  },
  {
    id: 6,
    type: "score",
    title: "AI Profile Analysis Complete",
    desc: "Your career domain has been identified as Frontend Developer with 94% confidence.",
    time: "3 days ago",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
    icon: SparklesIcon,
    unread: false,
  },
  {
    id: 7,
    type: "match",
    title: "Interview Reminder",
    desc: "Your Razorpay technical interview is scheduled for Aug 5. Prepare DSA + React.",
    time: "3 days ago",
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-100",
    icon: BriefcaseIcon,
    unread: false,
  },
  {
    id: 8,
    type: "achievement",
    title: "Profile 75% Complete",
    desc: "You're almost there! Add your GitHub profile to boost your completeness to 87%.",
    time: "5 days ago",
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-100",
    icon: CheckIcon,
    unread: false,
  },
]

export default function Notifications({ onNavigate }: Props) {
  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <div className="p-8 max-w-3xl mx-auto w-full font-sans">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Notifications</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {unreadCount} unread updates from your AI career companion
          </p>
        </div>
        <button className="text-sm font-semibold text-slate-500 hover:text-indigo-600 px-4 py-2 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 transition-colors bg-white">
          Mark all read
        </button>
      </div>

      {/* Unread section */}
      {notifications.filter((n) => n.unread).length > 0 && (
        <div className="mb-8">
          <div className="text-xs font-bold text-slate-400 tracking-wider mb-4 uppercase">
            Unread · {unreadCount}
          </div>
          <div className="space-y-3">
            {notifications
              .filter((n) => n.unread)
              .map(({ id, title, desc, time, color, bg, border, icon: Icon }) => (
                <div
                  key={id}
                  className="bg-white border border-indigo-100 hover:border-indigo-300 rounded-2xl p-5 flex gap-4 cursor-pointer transition-all shadow-sm hover:shadow-md group relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                  <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border ${bg} ${border}`}>
                    <Icon size={18} className={color} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-4 mb-1">
                      <div className="text-[15px] font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                        {title}
                      </div>
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 mt-1 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                    </div>
                    <div className="text-sm text-slate-600 leading-relaxed mb-2">
                      {desc}
                    </div>
                    <div className="text-xs font-semibold text-slate-400">
                      {time}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Earlier section */}
      <div>
        <div className="text-xs font-bold text-slate-400 tracking-wider mb-4 uppercase">
          Earlier
        </div>
        <div className="space-y-3 opacity-80 hover:opacity-100 transition-opacity">
          {notifications
            .filter((n) => !n.unread)
            .map(({ id, title, desc, time, color, bg, border, icon: Icon }) => (
              <div
                key={id}
                className="bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-white rounded-2xl p-5 flex gap-4 cursor-pointer transition-all"
              >
                <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border ${bg} ${border}`}>
                  <Icon size={18} className={`${color} opacity-80`} />
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-bold text-slate-700 mb-1">
                    {title}
                  </div>
                  <div className="text-sm text-slate-500 leading-relaxed mb-2">
                    {desc}
                  </div>
                  <div className="text-xs font-medium text-slate-400">
                    {time}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
