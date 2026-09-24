import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  Loader2,
  Sparkles,
  ShieldCheck,
  Database,
  Building2,
  BadgeCheck,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State untuk Captcha Canvas
  const [captcha, setCaptcha] = useState("");
  const [inputCaptcha, setInputCaptcha] = useState("");
  const canvasRef = useRef(null);

  // Fungsi untuk menggambar Captcha ke Canvas dengan efek noise & garis
  const generateCaptcha = useCallback(() => {
    const randomNum = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptcha(randomNum);
    setInputCaptcha("");

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Atur ukuran canvas
    canvas.width = 130;
    canvas.height = 48;

    // Background warna gelap / kontras agar cocok dengan tema gelap login
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Tambahkan garis-garis noise acak
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${100 + Math.random() * 155}, ${100 + Math.random() * 155}, ${100 + Math.random() * 155}, 0.5)`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Tambahkan titik-titik noise kecil
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(${150 + Math.random() * 105}, ${150 + Math.random() * 105}, ${150 + Math.random() * 105}, 0.6)`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }

    // Tulis teks angka satu per satu dengan rotasi dan pergeseran posisi
    ctx.font = "bold 24px 'Times New Roman'";
    ctx.textBaseline = "middle";

    for (let i = 0; i < randomNum.length; i++) {
      ctx.save();
      const x = 22 + i * 24;
      const y = 24 + (Math.random() * 6 - 3);
      
      ctx.translate(x, y);
      const angle = (Math.random() * 30 - 15) * Math.PI / 180;
      ctx.rotate(angle);

      // Warna teks cerah agar jelas terbaca di background gelap
      ctx.fillStyle = `rgb(${200 + Math.floor(Math.random() * 55)}, ${200 + Math.floor(Math.random() * 55)}, 255)`;
      ctx.fillText(randomNum[i], 0, 0);
      ctx.restore();
    }
  }, []);

  // Generate captcha saat komponen pertama kali dimuat
  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Validasi Captcha
    if (!inputCaptcha) {
      setError("Mohon isi kode captcha terlebih dahulu");
      return;
    }

    if (inputCaptcha !== captcha) {
      setError("Kode captcha yang Anda masukkan salah!");
      generateCaptcha(); // Refresh captcha jika salah
      return;
    }

    setIsLoading(true);

    try {
      const API_URL = import.meta.env.DEV
        ? "/bapenda-api/pepakraja/wr/data"
        : "/api/auth";

      const headers = import.meta.env.DEV
        ? {
            "Content-Type": "application/json",
            token: "xV3nKd8QpL5rTyHuWc2MfZaJbE7sRt1",
          }
        : {
            "Content-Type": "application/json",
          };

      const response = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          npwrd: identifier,
          password,
        }),
      });

      const text = await response.text();
      let result;

      try {
        result = JSON.parse(text);
      } catch {
        console.error("RAW RESPONSE:", text);
        throw new Error("Response server tidak valid");
      }

      console.log("LOGIN RESULT:", result);

      if (result.code === "00") {
        setSuccess(result.message || "Login berhasil");

        const loginTime = Date.now();
        const expiredAt = loginTime + 24 * 60 * 60 * 1000;
        const activeToken = result.data.token || "active_session";

        const sessionData = {
          isLoggedIn: true,
          loginTime,
          expiredAt,
          token: activeToken,
          user: {
            id: result.data.id,
            nama: result.data.nama,
            npwrd: result.data.npwrd,
            nik_npwp: result.data.nik_npwp,
            email: result.data.email,
            telepon: result.data.telepon,
            alamat: result.data.alamat,
            dokumen: result.data.dokumen,
            kelurahan: result.data.kelurahan,
            status: result.data.status,
            kota: result.data.kota,
            provinsi: result.data.provinsi,
          },
        };

        localStorage.setItem("wr_session", JSON.stringify(sessionData));
        localStorage.setItem(
          "wr_user_header",
          JSON.stringify({
            nama: result.data.nama,
            npwrd: result.data.npwrd,
            email: result.data.email,
          }),
        );

        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        setError(result.message || "NPWRD atau password salah");
        generateCaptcha(); // Refresh captcha jika login gagal
      }
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Server tidak dapat dihubungi. Silakan coba lagi.",
      );
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712]">
      {/* BACKGROUND */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] bg-cyan-500/20 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-blue-600/20 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:35px_35px]" />
      </div>

      {/* FLOATING PARTICLES */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-cyan-400/20 animate-float"
          style={{
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 8 + 4}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}

      <div className="relative z-10 container mx-auto px-6 min-h-screen flex items-center py-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center w-full">
          {/* LEFT SIDE */}
          <motion.div
            initial={{ opacity: 0, x: -80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="hidden lg:block"
          >
            <div className="flex">
              <img
                src="/images/pepak1.png"
                alt="PEPAKRAJA"
                className="m-2 w-32 mb-8 drop-shadow-[0_0_40px_rgba(34,211,238,0.6)]"
              />
              <img
                src="/images/massajakBregada.png"
                alt="PEPAKRAJA"
                className="w-38 h-40 m-2 mb-8 drop-shadow-[0_0_40px_rgba(34,211,238,0.6)]"
              />
            </div>

            <h1 className="text-6xl font-black text-white leading-tight">
              PEPAK RADJA
            </h1>

            <p className="text-cyan-200 text-xl mt-5 max-w-xl">
              Platform digital layanan retribusi Daerah Provinsi Jawa Tengah
              yang memberikan kemudahan, transparansi, dan keamanan dalam proses
              pembayaran serta pengelolaan retribusi secara modern.
            </p>

            <div className="grid grid-cols-3 gap-4 mt-10">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5">
                <Building2 className="w-8 h-8 text-cyan-300 mb-3" />
                <h3 className="text-3xl font-bold text-white">35</h3>
                <p className="text-gray-400 text-sm">Kab/Kota</p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5">
                <Database className="w-8 h-8 text-cyan-300 mb-3" />
                <h3 className="text-3xl font-bold text-white">24/7</h3>
                <p className="text-gray-400 text-sm">Online</p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5">
                <BadgeCheck className="w-8 h-8 text-cyan-300 mb-3" />
                <h3 className="text-3xl font-bold text-white">100%</h3>
                <p className="text-gray-400 text-sm">Terintegrasi</p>
              </div>
            </div>
          </motion.div>

          {/* LOGIN CARD */}
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-md mx-auto"
          >
            <div className="backdrop-blur-3xl bg-white/10 border border-white/20 rounded-[32px] p-8 shadow-[0_0_80px_rgba(34,211,238,0.15)] text-white">
              {/* LOGO MOBILE */}
              <div className="flex justify-center lg:hidden mb-5">
                <div className="flex">
                  <img
                    src="/images/pepak1.png"
                    alt="PEPAKRAJA"
                    className="w-24"
                  />
                  <img
                    src="/images/bregada.png"
                    alt="PEPAKRAJA"
                    className="w-24 ml-2"
                  />
                </div>
              </div>

              {/* HEADER */}
              <div className="text-center mb-8">
                <h2 className="mt-5 text-4xl font-black">Selamat Datang</h2>
                <p className="text-gray-300 mt-2">
                  Login menggunakan NPWRD/Email dan Password
                </p>
              </div>

              {error && (
                <div className="mb-5 bg-red-500/20 border border-red-400/30 text-red-200 px-4 py-3 rounded-2xl text-sm animate-shake">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-5 bg-green-500/20 border border-green-400/30 text-green-200 px-4 py-3 rounded-2xl text-sm">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* NPWRD / EMAIL INPUT */}
                <div>
                  <label className="block text-sm mb-2 text-gray-300">
                    NPWRD atau Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-300" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Masukkan NPWRD atau Email"
                      required
                      className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 outline-none text-white placeholder:text-gray-400 focus:ring-4 focus:ring-cyan-400/20 focus:border-cyan-400 transition-all"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="block text-sm mb-2 text-gray-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-300" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      required
                      className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-14 outline-none text-white placeholder:text-gray-400 focus:ring-4 focus:ring-cyan-400/20 focus:border-cyan-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  <div className="flex justify-end mt-3">
                    <a
                      href="/lupapassword"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-300 text-sm hover:underline"
                    >
                      Lupa Password?
                    </a>
                  </div>
                </div>

                {/* CAPTCHA SECTION */}
                <div>
                  <label className="block text-sm mb-2 text-gray-300">
                    Kode Verifikasi (Captcha)
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-800 border border-white/20 px-2 py-1.5 rounded-2xl select-none justify-center">
                      <canvas 
                        ref={canvasRef} 
                        className="rounded-xl border border-white/10 bg-slate-900 cursor-pointer shadow-inner"
                        onClick={generateCaptcha}
                        title="Klik untuk mengganti captcha"
                      />
                      <button
                        type="button"
                        onClick={generateCaptcha}
                        className="text-gray-300 hover:text-cyan-300 p-1.5 transition"
                        title="Refresh Captcha"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      maxLength={4}
                      value={inputCaptcha}
                      onChange={(e) => setInputCaptcha(e.target.value.replace(/\D/g, ""))}
                      placeholder="4 Angka"
                      required
                      className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-4 outline-none text-white placeholder:text-gray-400 text-center tracking-widest font-semibold focus:ring-4 focus:ring-cyan-400/20 focus:border-cyan-400 transition-all"
                    />
                  </div>
                </div>

                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative overflow-hidden w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 shadow-[0_0_40px_rgba(34,211,238,.35)] hover:scale-[1.02] transition-all"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine" />

                  <div className="relative flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        Masuk Sekarang
                      </>
                    )}
                  </div>
                </button>

                {/* LINK KE REGISTER */}
                <div className="mt-6 text-center text-sm text-gray-400">
                  Belum punya akun?{" "}
                  <a
                    href="/register"
                    className="text-cyan-400 font-bold hover:underline transition-all"
                  >
                    Daftar Sekarang
                  </a>
                </div>
              </form>

              <div className="mt-8 text-center text-xs text-gray-400">
                © 2026 Bapenda Provinsi Jawa Tengah
              </div>
            </div>
          </motion.div>
          
          <div className="fixed bottom-6 right-6 z-50 hidden-on-home">
            <a
              href="https://wa.me/6285642312609"
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:scale-110 transition-transform duration-300"
            >
              <img
                src="/images/call.png"
                alt="WhatsApp"
                className="w-32 h-32 object-contain floating-logo"
              />
            </a>
          </div>
        </div>
      </div>

      <style>
        {`
      @keyframes shake {
        0%,100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }

      .animate-shake {
        animation: shake .3s ease-in-out;
      }

      @keyframes shine {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(200%);
        }
      }

      .animate-shine {
        animation: shine 3s linear infinite;
      }

      @keyframes float {
        0%,100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-20px);
        }
      }

      .animate-float {
        animation: float 5s ease-in-out infinite;
      }
      `}
      </style>
    </div>
  );
}