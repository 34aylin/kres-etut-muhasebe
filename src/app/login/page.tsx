import Link from "next/link";

export default function LoginChooserPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl border bg-background p-10 shadow-sm">
        <p className="mb-8 text-center text-sm font-medium text-muted-foreground">
          Kreş &amp; Etüt Merkezi Muhasebe — hangi sistemde oturum açmak
          istersiniz?
        </p>
        <div className="flex flex-col gap-6 sm:flex-row">
          <Link
            href="/login/kres"
            className="flex flex-1 flex-col gap-3 rounded-2xl border p-6 transition-transform hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(155deg,#FFE9A8 0%,#FFD98A 100%)",
              borderColor: "#F3C25E",
            }}
          >
            <span
              className="flex size-12 items-center justify-center rounded-2xl text-2xl"
              style={{ background: "#FF6F59" }}
            >
              🧸
            </span>
            <span
              className="text-xl font-bold"
              style={{ fontFamily: "var(--font-playful)", color: "#5B3A00" }}
            >
              Kreş Girişi
            </span>
            <span className="text-sm" style={{ color: "#7A5A12" }}>
              Kreş şubeleri için veli, öğrenci ve gün içi kayıt yönetimi.
            </span>
            <span
              className="mt-1 self-start rounded-full px-4 py-2 text-sm font-bold"
              style={{
                background: "#2EC4B6",
                color: "#06322E",
                fontFamily: "var(--font-playful)",
              }}
            >
              Kreş girişine geç →
            </span>
          </Link>
          <Link
            href="/login/etut"
            className="flex flex-1 flex-col gap-3 rounded-2xl border p-6 transition-transform hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(160deg,#211D52 0%,#372F8C 100%)",
              borderColor: "#4338CA",
            }}
          >
            <span
              className="flex size-12 items-center justify-center rounded-2xl text-2xl"
              style={{ background: "#3B82C4" }}
            >
              📘
            </span>
            <span className="text-xl font-bold text-white">Etüt Girişi</span>
            <span className="text-sm" style={{ color: "#C7C4F2" }}>
              Etüt merkezleri için kursiyer, program ve muhasebe yönetimi.
            </span>
            <span
              className="mt-1 self-start rounded-lg px-4 py-2 text-sm font-bold"
              style={{ background: "#EC6FA6", color: "#fff" }}
            >
              Etüt girişine geç →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
