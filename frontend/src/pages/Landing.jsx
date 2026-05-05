import React from "react";

const features = [
  {
    title: "Create your group and share the invite link",
    description:
      "Start a trip, dinner, rent, or event group, then copy a private invite link and share it by chat, message, or email in one click.",
    icon: "01",
  },
  {
    title: "Join with your own display name",
    description:
      "Each member can join from the invite page, use their own account name, and become part of the group without manual approval steps.",
    icon: "02",
  },
  {
    title: "Chat inside the group with images",
    description:
      "Send messages, share photos of receipts, and keep every group conversation attached to the right expense space.",
    icon: "03",
  },
  {
    title: "Add and split expenses accurately",
    description:
      "Record who paid, who owes, and how much each person owes so balances stay readable and fair at all times.",
    icon: "04",
  },
  {
    title: "Settle up and close the loop",
    description:
      "See the current balance summary, minimize settlement steps, and mark payments complete once the group is even.",
    icon: "05",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-inter overflow-hidden">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a
            href="/"
            className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent"
          >
            SplitEase
          </a>

          <nav className="flex items-center gap-3">
            <a
              href="/invite"
              className="px-5 py-2.5 rounded-xl border border-teal-400/30 bg-teal-400/10 text-teal-200 font-semibold transition-all duration-300 ease-out hover:bg-teal-400/20 hover:scale-[1.02]"
            >
              Join with Link
            </a>
            <a
              href="/signup"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-semibold transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              Get Started
            </a>
            <a
              href="/login"
              className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white transition-all duration-300 ease-out hover:bg-white/10 hover:scale-[1.02]"
            >
              Login
            </a>
          </nav>
        </div>
      </header>

      <main className="relative">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.08),_transparent_35%)]" />
          <div className="absolute -top-20 left-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-[120px]" />
          <div className="absolute top-32 right-8 h-80 w-80 rounded-full bg-teal-400/20 blur-[120px]" />
          <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[120px]" />

          <div className="relative max-w-6xl mx-auto px-6 py-24 lg:py-32">
            <div className="max-w-4xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(16,185,129,0.08)]">
                Premium expense splitting for modern groups
              </span>

              <h1 className="mt-8 text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] bg-gradient-to-r from-white via-emerald-200 to-teal-300 bg-clip-text text-transparent">
                Split Expenses. Not Friendships.
              </h1>

              <p className="mt-6 max-w-2xl text-sm md:text-lg text-slate-400 leading-7">
                SplitEase gives your group a polished, intuitive way to track shared spending,
                minimize awkward conversations, and settle balances with confidence.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <a
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-7 py-4 text-base font-semibold text-white transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                >
                  Get Started Free
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-7 py-4 text-base font-semibold text-white transition-all duration-300 ease-out hover:bg-white/10 hover:scale-[1.02]"
                >
                  See How It Works
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="relative max-w-6xl mx-auto px-6 pb-24 lg:pb-32">
          <div className="mb-10 max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              How it works
            </h2>
            <p className="mt-4 text-sm md:text-base text-slate-400 leading-7">
              SplitEase is built as a full group workflow, not just a calculator. Share a link, let people join with their own name, talk in the group chat, attach receipt images, log expenses, and settle balances from the same place.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(16,185,129,0.1)] transition-all duration-300 ease-out hover:scale-[1.02] hover:border-emerald-500/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-sm font-bold text-white transition-all duration-300 ease-out group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 backdrop-blur-xl">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Invite flow</p>
                <p className="mt-2 text-sm leading-7 text-slate-200">
                  Create a shareable group link, copy it, and send it anywhere. Members can join from any browser and land directly in the group.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Chat flow</p>
                <p className="mt-2 text-sm leading-7 text-slate-200">
                  Group chat keeps the conversation organized, supports images, and makes it easy to reference receipts or trip photos.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Money flow</p>
                <p className="mt-2 text-sm leading-7 text-slate-200">
                  Add expenses, watch balances update, and settle debt with a clear minimized summary so nobody has to guess what is owed.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;
