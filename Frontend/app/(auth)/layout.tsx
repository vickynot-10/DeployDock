import "../globals.css";
import Image from "next/image";
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className=" h-dvh m-auto w-full theme-bg-black grid  grid-cols-1 lg:grid-cols-2  ">
      <div
        className="relative hidden flex-col overflow-hidden lg:flex "
        style={{
          borderRight: "1px solid var(--border-1)",
        }}
      >
        <div className="absolute  top-10 left-10 right-10 z-10" >
          <span
            className="text-[22px] font-extrabold tracking-tight"
            style={{ color: "var(--text-1)" }}
          >
            ⬡ Deploy
            <span className=" ms-1" style={{ color: "var(--accent, #6366f1)" }}>Dock</span>
          </span>
        </div>
        <Image
          src="/login_banner.svg"
          alt="Cover Image"
          fill
          className="  object-cover"
          priority
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, var(--bg-0) 0%, transparent 60%)",
          }}
        />

        <div className="absolute bottom-10 left-10 right-10 z-10">
          <p
            className="text-[28px] font-bold leading-snug"
            style={{ color: "var(--text-1)" }}
          >
            Build and deploy
            <br />
            <span style={{ color: "var(--accent)" }}>faster than ever.</span>
          </p>
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}
