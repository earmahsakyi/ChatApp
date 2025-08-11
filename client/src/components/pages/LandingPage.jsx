import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import chat from '../../assets/Chat.jpg'

const LandingPage = () => {
  return (
    <>
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between p-3">
          <span className="text-lg font-semibold">SwiftChat</span>
          <nav className="flex items-center gap-2 p-3">
            <Button asChild variant="ghost">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="container grid gap-10 py-14 md:grid-cols-2 p-3">
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              SwiftChat – Chat instantly, anywhere, anytime
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Real-time messaging with a clean, minimal interface. Secure, fast, and
              accessible on any device.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="shadow">
                <Link to="/signup">Create your account</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/login">I already have an account</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-xl border bg-card p-3 shadow">
              <img
                src={chat}
                alt="SwiftChat app mockup showing real-time chat interface"
                loading="lazy"
                className="rounded-lg w-full h-auto"
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t">
          <div className="container grid gap-6 py-12 md:grid-cols-3">
            <article className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Real-time messaging</h2>
              <p className="mt-2 text-muted-foreground">
                Send and receive messages instantly with smooth, reliable delivery.
              </p>
            </article>
            <article className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Secure conversations</h2>
              <p className="mt-2 text-muted-foreground">
                Your chats stay private with best-practice security controls.
              </p>
            </article>
            <article className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Accessible anywhere</h2>
              <p className="mt-2 text-muted-foreground">
                Works beautifully on mobile, tablet, and desktop.
              </p>
            </article>
          </div>
        </section>
      </main>
    </>
  );
};

export default LandingPage;
