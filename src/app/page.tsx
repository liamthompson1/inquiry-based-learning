import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">Inquire.ai</h1>
          <p className="text-indigo-200 text-lg">Agentic Inquiry-Based Learning</p>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            href="/teacher"
            className="group bg-white hover:bg-indigo-50 rounded-2xl p-6 flex items-center gap-4 transition-all shadow-lg hover:shadow-xl"
          >
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl group-hover:bg-indigo-200 transition-colors">
              👩‍🏫
            </div>
            <div>
              <div className="font-bold text-slate-900 text-lg">I&apos;m a Teacher</div>
              <div className="text-slate-500 text-sm">Plan lessons, monitor live progress</div>
            </div>
            <div className="ml-auto text-indigo-400 text-xl">→</div>
          </Link>

          <Link
            href="/student"
            className="group bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl p-6 flex items-center gap-4 transition-all"
          >
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-2xl group-hover:bg-white/30 transition-colors">
              🎒
            </div>
            <div>
              <div className="font-bold text-white text-lg">I&apos;m a Student</div>
              <div className="text-indigo-200 text-sm">Join your class with a PIN</div>
            </div>
            <div className="ml-auto text-white/60 text-xl">→</div>
          </Link>
        </div>

        <p className="text-center text-indigo-300/60 text-xs mt-8">
          Grounded in Singapore IBL research · Powered by Claude AI
        </p>
      </div>
    </div>
  )
}
