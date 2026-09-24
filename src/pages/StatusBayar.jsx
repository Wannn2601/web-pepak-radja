import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Printer, FileDown, QrCode, X, RefreshCw } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import Swal from "sweetalert2";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Html5QrcodeScanner } from "html5-qrcode";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function StatusBayar() {
  const [skrd, setSkrd] = useState("");
  const [data, setData] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  
  // State untuk Captcha
  const [captcha, setCaptcha] = useState("");
  const [inputCaptcha, setInputCaptcha] = useState("");
  const canvasRef = useRef(null);

  const componentRef = useRef();
  
  const [printInfo, setPrintInfo] = useState(null);

  // Fungsi untuk menggambar Captcha ke Canvas dengan efek visual/noise
  const generateCaptcha = useCallback(() => {
    const randomNum = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptcha(randomNum);
    setInputCaptcha("");

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    canvas.width = 120;
    canvas.height = 40;

    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 150}, ${Math.random() * 150}, ${Math.random() * 150}, 0.5)`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100}, 0.4)`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }

    ctx.font = "bold 22px 'Times New Roman'";
    ctx.textBaseline = "middle";

    for (let i = 0; i < randomNum.length; i++) {
      ctx.save();
      const x = 20 + i * 22;
      const y = 20 + (Math.random() * 6 - 3);
      
      ctx.translate(x, y);
      const angle = (Math.random() * 30 - 15) * Math.PI / 180;
      ctx.rotate(angle);

      ctx.fillStyle = `rgb(${Math.floor(Math.random() * 80)}, ${Math.floor(Math.random() * 80)}, ${Math.floor(Math.random() * 120)})`;
      ctx.fillText(randomNum[i], 0, 0);
      ctx.restore();
    }
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  const getPrintTimestamp = () => {
    const now = new Date();
    return now.toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const maskName = (str) => {
    if (!str) return "-";
    const words = str.split(" ");
    return words.map(word => {
      if (word.length <= 2) return "**";
      return word.substring(0, Math.ceil(word.length / 2)) + "*".repeat(word.length - Math.ceil(word.length / 2));
    }).join(" ");
  };

  const maskAddress = (str) => {
    if (!str) return "-";
    const length = str.length;
    if (length <= 5) return "*****";
    const visibleLength = Math.floor(length / 2);
    return str.substring(0, visibleLength) + "*".repeat(length - visibleLength);
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: data
      ? `tbp_${data.nama.replace(/\s+/g, "_")}-${data.no_tbp || "belum_bayar"}`
      : "tbp_dokumen",
  });

  const handlePrintAction = () => {
    const session = JSON.parse(localStorage.getItem("wr_session"));
    setPrintInfo({
      username: session?.user?.nama || "User",
      waktu: getPrintTimestamp(),
    });

    setTimeout(() => handlePrint(), 100);
  };

  const handleDownloadPDF = async () => {
    const session = JSON.parse(localStorage.getItem("wr_session"));
    setPrintInfo({
      username: session?.user?.nama || "User",
      waktu: getPrintTimestamp(),
    });
    setTimeout(async () => {
      const element = componentRef.current;
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`tbp_${data.nama}-${data.no_tbp || "belum_bayar"}.pdf`);
    }, 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const terbilang = (bilangan) => {
    bilangan = Math.floor(bilangan);
    const angka = [
      "",
      "Satu",
      "Dua",
      "Tiga",
      "Empat",
      "Lima",
      "Enam",
      "Tujuh",
      "Delapan",
      "Sembilan",
      "Sepuluh",
      "Sebelas",
    ];
    if (bilangan < 12) return angka[bilangan];
    if (bilangan < 20) return terbilang(bilangan - 10) + " Belas";
    if (bilangan < 100)
      return (
        terbilang(Math.floor(bilangan / 10)) +
        " Puluh " +
        terbilang(bilangan % 10)
      );
    if (bilangan < 200) return "Seratus " + terbilang(bilangan - 100);
    if (bilangan < 1000)
      return (
        terbilang(Math.floor(bilangan / 100)) +
        " Ratus " +
        terbilang(bilangan % 100)
      );
    if (bilangan < 2000) return "Seribu " + terbilang(bilangan - 1000);
    if (bilangan < 1000000)
      return (
        terbilang(Math.floor(bilangan / 1000)) +
        " Ribu " +
        terbilang(bilangan % 1000)
      );
    if (bilangan < 1000000000)
      return (
        terbilang(Math.floor(bilangan / 1000000)) +
        " Juta " +
        terbilang(bilangan % 1000000)
      );
    return "";
  };

  const handleSearch = async () => {
    if (!skrd) {
      Swal.fire(
        "Peringatan",
        "Pastikan nomor SKRD / Kode Bayar terisi",
        "warning",
      );
      return;
    }

    if (!inputCaptcha) {
      Swal.fire("Peringatan", "Mohon isi kode captcha terlebih dahulu", "warning");
      return;
    }

    if (inputCaptcha !== captcha) {
      Swal.fire("Gagal", "Kode captcha yang Anda masukkan salah!", "error");
      generateCaptcha();
      return;
    }

    setLoadingSearch(true);
    let queryVal = skrd.trim();

    const cleanNumbers = queryVal.replace(/\./g, "");
    if (/^\d{21}$/.test(cleanNumbers)) {
      queryVal = `${cleanNumbers.slice(0,2)}.${cleanNumbers.slice(2,4)}.${cleanNumbers.slice(4,6)}.${cleanNumbers.slice(6,8)}.${cleanNumbers.slice(8,10)}.${cleanNumbers.slice(10,12)}.${cleanNumbers.slice(12,14)}.${cleanNumbers.slice(14,16)}.${cleanNumbers.slice(16)}`;
    }

    try {
      let response = await fetch(
        `/bapenda/pepakraja/tbp/check?no_penetapan=${encodeURIComponent(queryVal)}`,
        {
          headers: {
            token: "xV3nKd8QpL5rTyHuWc2MfZaJbE7sRt1",
            Accept: "application/json",
          },
        },
      );

      let result = await response.json();
      
      if ((result.code !== "00" || !result.data) && queryVal !== skrd.trim()) {
        response = await fetch(
          `/bapenda/pepakraja/tbp/check?no_penetapan=${encodeURIComponent(skrd.trim())}`,
          {
            headers: {
              token: "xV3nKd8QpL5rTyHuWc2MfZaJbE7sRt1",
              Accept: "application/json",
            },
          },
        );
        result = await response.json();
      }

      if (result.code !== "00" || !result.data) {
        Swal.fire("Gagal", "Data TBP tidak ditemukan", "error");
        setData(null);
        generateCaptcha();
        return;
      }

      const item = result.data;
      const jumlahBayar = Number(item.jumlah_bayar || 0);

      setData({
        no_tbp: item.no_tbp || "",
        tanggal: formatDate(item.tanggal),
        tanggal_skrd: formatDate(item.penetapan?.tanggal),
        nama: maskName(item.wr?.nama || "-"),
        alamat: maskAddress(item.wr?.alamat || "-"),
        alamat_obyek: item.obyek?.alamat,
        jumlah: jumlahBayar.toLocaleString("id-ID"),
        terbilang: (terbilang(jumlahBayar) + " Rupiah"),
        jenis_ret: item.obyek?.sub_rekening?.golongan?.golongan || "-",
        keterangan: item.obyek?.sub_rekening?.jenis?.jenis_retribusi || "-",
        no_skrd: item.no_penetapan || skrd.trim(),
        obyek: item.obyek?.obyek_retribusi || "-",
        lokasi: item.obyek?.alamat || "-",
        uppd: item.uppd?.nama || "-",
        opd: item.opd?.nama || "-",
        status_bayar: item.status_bayar || (item.no_tbp ? "Sudah Terbayar" : "Belum Terbayar"),
        metode_pembayaran: item.metode_pembayaran || "Virtual Account / Cash / QRIS",
      });
      
      generateCaptcha();
    } catch (err) {
      Swal.fire(
        "Error",
        "Data tidak ditemukan / Gagal mengambil data dari server",
        "error",
      );
      setData(null);
      generateCaptcha();
    } finally {
      setLoadingSearch(false);
    }
  };

  useEffect(() => {
    let scanner = null;
    if (showScanner) {
      scanner = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 300, height: 150 },
          formatsToSupport: [0, 6],
        },
        false,
      );

      scanner.render(
        (decodedText) => {
          setSkrd(decodedText);
          setShowScanner(false);
          scanner.clear().catch(console.error);
        },
        (err) => {},
      );
    }
    return () => {
      if (scanner) scanner.clear().catch(console.error);
    };
  }, [showScanner]);

  return (
    <div className="min-h-screen flex flex-col pt-28 bg-slate-50">
      <Header />
      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <h2 className="font-bold text-slate-800 mb-4 uppercase text-sm md:text-base">
            Masukkan Nomor / Nomor Arsip SKRD
          </h2>
          <div className="flex flex-col gap-3">
            <input
              className="border border-slate-300 rounded p-2 text-sm w-full"
              placeholder="Masukkan Kode Bayar / No SKRD"
              value={skrd}
              onChange={(e) => setSkrd(e.target.value)}
            />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-300 px-3 py-1.5 rounded select-none justify-center">
                <canvas 
                  ref={canvasRef} 
                  className="rounded border border-slate-300 bg-white shadow-inner cursor-pointer"
                  onClick={generateCaptcha}
                  title="Klik untuk mengganti captcha"
                />
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="text-slate-600 hover:text-blue-700 p-1 transition"
                  title="Refresh Captcha"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                maxLength={4}
                className="flex-1 border border-slate-300 rounded p-2 text-sm tracking-widest font-semibold"
                placeholder="Masukkan 4 angka pada gambar"
                value={inputCaptcha}
                onChange={(e) => setInputCaptcha(e.target.value.replace(/\D/g, ""))}
              />

              <button
                onClick={handleSearch}
                disabled={loadingSearch}
                className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded flex items-center justify-center gap-1 text-sm font-medium transition"
              >
                <Search className="w-4 h-4 inline mr-1" /> {loadingSearch ? "Memuat..." : "Cari"}
              </button>
            </div>
          </div>
        </div>

        {showScanner && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white p-4 rounded w-full max-w-sm">
              <div className="flex justify-between mb-4 font-bold">
                <span>SCAN BARCODE/QR</span>
                <button onClick={() => setShowScanner(false)}>
                  <X />
                </button>
              </div>
              <div id="reader" className="w-full"></div>
            </div>
          </div>
        )}

        {/* MODAL / POPUP DETAIL DATA */}
        {data && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative flex flex-col max-h-[90vh] border border-slate-100 overflow-hidden">
              
              {/* Header Modal Action Bar */}
              <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-r from-slate-900 to-blue-900 text-white shadow-md gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse"></span>
                  <h3 className="font-semibold text-xs sm:text-base tracking-wide">Informasi Status Pembayaran Retribusi</h3>
                </div>
                <div className="flex items-center gap-2">
                  
                  <button
                    onClick={() => setData(null)}
                    className="text-slate-300 hover:text-white p-1 rounded-full hover:bg-white/10 transition ml-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Konten Utama Dokumen (Jarak dirapatkan agar pas di modal) */}
              <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
                <div
                  ref={componentRef}
                  className="bg-white text-black w-full max-w-[210mm] px-6 sm:px-10 py-6 sm:py-8 font-['Times_New_Roman'] text-[12px] sm:text-[13px] leading-snug relative flex flex-col justify-between shadow-md rounded border border-slate-200 box-border"
                >
                  <div>
                    {/* Header Logo dan Judul */}
                    <div className="flex items-center gap-4 mb-3">
                      <img
                        src="/images/logo-jateng-official.png"
                        alt="Logo"
                        className="w-[45px] sm:w-[55px] object-contain flex-shrink-0"
                      />
                      <div className="flex-1 text-center font-bold text-[13px] sm:text-[15px] tracking-wide uppercase">
                        INFORMASI STATUS PEMBAYARAN
                      </div>
                    </div>
                    <div className="border-b-2 border-black mb-4"></div>
                    
                    {/* Struktur Poin 1 - 4 dengan Jarak Rapat */}
                    <div className="space-y-3">
                      {/* 1. Ketetapan */}
                      <div>
                        <div className="font-bold">1. Ketetapan.</div>
                        <table className="w-full ml-5 mt-0.5">
                          <tbody>
                            <tr>
                              <td className="w-[150px] py-0.5">a. No. SKRD</td>
                              <td className="w-[20px] py-0.5">:</td>
                              <td className="py-0.5">{data.no_skrd}</td>
                            </tr>
                            <tr>
                              <td className="py-0.5">b. Tanggal SKRD</td>
                              <td className="py-0.5">:</td>
                              <td className="py-0.5">{data.tanggal_skrd || "-"}</td>
                            </tr>
                            <tr>
                              <td className="py-0.5">c. Jumlah Ketetapan</td>
                              <td className="py-0.5">:</td>
                              <td className="py-0.5">Rp {data.jumlah}</td>
                            </tr>
                            <tr>
                              <td className="py-0.5">d. Terbilang</td>
                              <td className="py-0.5">:</td>
                              <td className="py-0.5 italic">{data.terbilang}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* 2. Data Wajib Retribusi */}
                      <div>
                        <div className="font-bold">2. Data Wajib Retribusi.</div>
                        <table className="w-full ml-5 mt-0.5">
                          <tbody>
                            <tr>
                              <td className="w-[150px] py-0.5">a. Nama Wajib Retribusi</td>
                              <td className="w-[20px] py-0.5">:</td>
                              <td className="py-0.5">{data.nama}</td>
                            </tr>
                            <tr>
                              <td className="py-0.5">b. Alamat</td>
                              <td className="py-0.5">:</td>
                              <td className="py-0.5">{data.alamat}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* 3. Layanan Retribusi */}
                      <div>
                        <div className="font-bold">3. Layanan Retribusi.</div>
                        <table className="w-full ml-5 mt-0.5">
                          <tbody>
                            <tr>
                              <td className="w-[150px] py-0.5">a. Jenis Layanan</td>
                              <td className="w-[20px] py-0.5">:</td>
                              <td className="py-0.5">{data.jenis_ret} - {data.keterangan}</td>
                            </tr>
                            <tr>
                              <td className="py-0.5">b. Uraian Layanan</td>
                              <td className="py-0.5">:</td>
                              <td className="py-0.5">{data.obyek}</td>
                            </tr>
                            <tr>
                              <td className="py-0.5">c. Lokasi Obyek</td>
                              <td className="py-0.5">:</td>
                              <td className="py-0.5">{data.alamat_obyek}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* 4. Status Pembayaran */}
                      <div>
                        <div className="font-bold">4. Status Pembayaran.</div>
                        <table className="w-full ml-5 mt-0.5">
                          <tbody>
                            <tr>
                              <td className="w-[150px] py-0.5">a. Status Bayar</td>
                              <td className="w-[20px] py-0.5">:</td>
                              <td className="py-0.5 font-bold">
                                <span className={data.no_tbp ? "text-green-700" : "text-red-700"}>
                                  {data.no_tbp ? "Sudah Terbayar" : "Belum Terbayar"}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td className="py-0.5">b. No. TBP</td>
                              <td className="py-0.5">:</td>
                              <td className="py-0.5">{data.no_tbp || "-"}</td>
                            </tr>
                            <tr>
                              <td className="py-0.5">c. Tanggal Pembayaran</td>
                              <td className="py-0.5">:</td>
                              <td className="py-0.5">{data.tanggal || "-"}</td>
                            </tr>
                            <tr>
                              <td className="py-0.5">d. Cara Pembayaran</td>
                              <td className="py-0.5">:</td>
                              <td className="py-0.5">{data.metode_pembayaran}</td>
                            </tr>
                            <tr>
                              <td className="py-0.5">e. TBP Diterbitkan Oleh</td>
                              <td className="py-0.5">:</td>
                              <td className="py-0.5">{data.opd} / {data.uppd}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Footer Dokumen */}
                  <div className="mt-6 pb-8 text-center text-[11px] sm:text-[12px] space-y-1 pt-4 border-t border-slate-300">
                    <div className="font-bold tracking-wide">
                      Dapatkan layananannya – Bayar Murahnya – Dapatkan Kemudahannya – Lancar Urusannya
                    </div>
                    <div className="italic font-semibold text-slate-700">
                      "Terima kasih telah turut serta dalam pembangunan Provinsi Jawa Tengah"
                    </div>
                    
                    {printInfo && (
                      <div className="text-[10px] text-left italic text-slate-500 mt-2">
                        Dicetak oleh: {printInfo.username} | Waktu: {printInfo.waktu}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}