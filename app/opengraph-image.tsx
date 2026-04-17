import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MaternityCare — Aqlli Boshqaruv Tizimi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #3730a3 0%, #4f46e5 40%, #7c3aed 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -60,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "rgba(167,139,250,0.15)",
          }}
        />

        {/* Top: Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
            }}
          >
            🏥
          </div>
          <span style={{ color: "white", fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
            MaternityCare
          </span>
          <div
            style={{
              marginLeft: 12,
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 20,
              padding: "6px 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#34d399",
              }}
            />
            <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}>
              clinicuk24.com
            </span>
          </div>
        </div>

        {/* Center: Main text */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ color: "#c7d2fe", fontSize: 20, fontWeight: 500 }}>
              🇺🇿 O'zbekcha
            </span>
            <h1
              style={{
                color: "white",
                fontSize: 64,
                fontWeight: 800,
                lineHeight: 1.1,
                margin: 0,
                letterSpacing: -2,
              }}
            >
              Aqlli Boshqaruv
              <br />
              <span style={{ color: "#a5b4fc" }}>Tizimi</span>
            </h1>
          </div>
          <p
            style={{
              color: "rgba(199,210,254,0.85)",
              fontSize: 22,
              margin: 0,
              maxWidth: 720,
              lineHeight: 1.5,
            }}
          >
            Xodimlar davomati, maosh va kasalxona operatsiyalarini bir platformada boshqaring.
            <br />
            <span style={{ color: "rgba(199,210,254,0.65)", fontSize: 19 }}>
              🇷🇺 Умная система управления персоналом роддома — посещаемость, зарплата, операции.
            </span>
          </p>
        </div>

        {/* Bottom: Stats */}
        <div style={{ display: "flex", gap: 20 }}>
          {[
            { value: "99%", label: "Davomat aniqligi / Точность учёта" },
            { value: "24/7", label: "Monitoring / Мониторинг" },
            { value: "< 5 daq", label: "O'rnatish / Установка" },
          ].map((s) => (
            <div
              key={s.value}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 16,
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <span style={{ color: "white", fontSize: 32, fontWeight: 800 }}>
                {s.value}
              </span>
              <span style={{ color: "#c7d2fe", fontSize: 14, lineHeight: 1.3 }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
