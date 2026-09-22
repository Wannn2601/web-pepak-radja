import { useState, useRef, useEffect } from "react";
import { Search, Printer, FileDown, QrCode, X } from "lucide-react";
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
  const componentRef = useRef();
  
  const [printInfo, setPrintInfo] = useState(null);
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

  // Fungsi sensor nama bagian belakang
  const maskName = (str) => {
    if (!str) return "-";
    const words = str.split(" ");
    return words.map(word => {
      if (word.length <= 2) return "**";
      return word.substring(0, Math.ceil(word.length / 2)) + "*".repeat(word.length - Math.ceil(word.length / 2));
    }).join(" ");
  };

  // Fungsi sensor alamat bagian belakang
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
    setLoadingSearch(true);

    if (!skrd) {
      Swal.fire(
        "Peringatan",
        "Pastikan nomor SKRD / Kode Bayar terisi",
        "warning",
      );
      setLoadingSearch(false);
      return;
    }

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
        return;
      }

      const item = result.data;
      const pejabat = JSON.parse(item.json_pejabat || "{}");
      const jumlahBayar = Number(item.jumlah_bayar || 0);

      setData({
        no_tbp: item.no_tbp || "",
        tanggal: formatDate(item.tanggal),
        tanggal_skrd: formatDate(item.penetapan?.tanggal),
        nama: maskName(item.wr?.nama || "-"),
        alamat: maskAddress(item.wr?.alamat || "-"),
        nik: item.wr?.nik_npwp || "-",
        jumlah: jumlahBayar.toLocaleString("id-ID"),
        terbilang: terbilang(jumlahBayar) + " Rupiah",
        jenis_ret: item.obyek?.sub_rekening?.golongan?.golongan || "-",
        keterangan: item.obyek?.sub_rekening?.jenis?.jenis_retribusi || "-",
        no_skrd: item.no_penetapan || skrd.trim(),
        obyek: item.obyek?.obyek_retribusi || "-",
        lokasi: item.obyek?.alamat || "-",
        nama_bendahara: pejabat.nama_bendahara || "-",
        nip: pejabat.nip_bendahara || "-",
        uppd: item.uppd?.nama || "-",
        opd: item.opd?.nama || "-",
        alamatuppd: item.opd?.alamat || "-",
        status_bayar: item.status_bayar || (item.no_tbp ? "sudah" : "belum"),
      });
    } catch (err) {
      Swal.fire(
        "Error",
        "Data tidak ditemukan / Gagal mengambil data dari server",
        "error",
      );
      setData(null);
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
            Masukkan kode bayar / No SKRD
          </h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 border border-slate-300 rounded p-2 text-sm"
              placeholder="Masukkan Kode Bayar"
              value={skrd}
              onChange={(e) => setSkrd(e.target.value)}
            />
            <button
              onClick={handleSearch}
              disabled={loadingSearch}
              className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded flex items-center justify-center gap-1 text-sm font-medium"
            >
              <Search className="w-4 h-4 inline mr-1" /> {loadingSearch ? "Memuat..." : "Cari"}
            </button>
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative flex flex-col max-h-[95vh] border border-slate-100 overflow-hidden">
              
              {/* Header Modal */}
              <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-slate-900 to-blue-900 text-white shadow-md gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse"></span>
                  <h3 className="font-semibold text-xs sm:text-base tracking-wide">Informasi Status Pembayaran Retribusi</h3>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                 
                  <button
                    onClick={() => setData(null)}
                    className="text-slate-300 hover:text-white p-1 rounded-full hover:bg-white/10 transition ml-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Konten Utama Dokumen yang Responsif & Auto-Adjust untuk Layar Kecil */}
              <div className="p-2 sm:p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
                <div
                  ref={componentRef}
                  className="bg-white text-black w-full max-w-[210mm] min-h-[auto] sm:min-h-[297mm] px-4 sm:px-12 py-6 sm:py-10 font-['Times_New_Roman'] text-[11px] sm:text-[12px] leading-normal sm:leading-relaxed relative flex flex-col justify-between shadow-md rounded border border-slate-200 box-border"
                >
                  <div>
                    {/* Logo dan Judul */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 mb-2 text-center sm:text-left">
                      <img
                        src="/images/logo-jateng-official.png"
                        alt="Logo"
                        className="w-[50px] sm:w-[60px] object-contain flex-shrink-0"
                      />
                      <div className="flex-1 font-bold text-[12px] sm:text-[14px]">
                        <div>INFORMASI STATUS PEMBAYARAN KETETAPAN RETRIBUSI</div>
                      </div>
                    </div>
                    <div className="text-right font-bold mt-2 text-[11px] sm:text-[12px]">{data.nik}</div>
                    <div className="border-b-2 border-black mt-2 mb-4 sm:mb-6"></div>
                    
                    <div className="mt-2 sm:mt-4">
                      <div className="font-bold mb-2 text-[11px] sm:text-[12px]">
                        Telah terima dari Wajib Retribusi :
                      </div>
                      
                      {/* Tabel Data Responsif Menggunakan Grid/Table Fleksibel */}
                      <table className="w-full text-left ml-1 sm:ml-10">
                        <tbody>
                          <tr>
                            <td className="w-[130px] sm:w-[180px] font-bold align-top py-1">1. Nama</td>
                            <td className="px-1 align-top py-1">:</td>
                            <td className="py-1 break-all">{data.nama}</td>
                          </tr>
                          <tr>
                            <td className="font-bold align-top py-1">2. Alamat</td>
                            <td className="px-1 align-top py-1">:</td>
                            <td className="py-1 break-words">{data.alamat}</td>
                          </tr>
                          <tr>
                            <td className="font-bold align-top py-1">3. Jumlah Uang</td>
                            <td className="px-1 align-top py-1">:</td>
                            <td className="py-1">Rp {data.jumlah}</td>
                          </tr>
                          <tr>
                            <td className="font-bold pl-4 sm:pl-8 align-top py-1">terbilang</td>
                            <td className="px-1 align-top py-1">:</td>
                            <td className="py-1 italic">{data.terbilang}</td>
                          </tr>
                          <tr>
                            <td className="py-1" colSpan="3"></td>
                          </tr>
                          <tr>
                            <td className="font-bold align-top py-1" colSpan="3">
                              4. Untuk Membayar
                            </td>
                          </tr>
                          <tr>
                            <td className="font-bold pl-4 sm:pl-8 align-top py-1">Jenis Layanan</td>
                            <td className="px-1 align-top py-1">:</td>
                            <td className="py-1">{data.jenis_ret} - {data.keterangan}</td>
                          </tr>
                          <tr>
                            <td className="font-bold pl-4 sm:pl-8 align-top py-1">No. SKRD</td>
                            <td className="px-1 align-top py-1">:</td>
                            <td className="py-1">{data.no_skrd}</td>
                          </tr>
                          <tr>
                            <td className="font-bold pl-4 sm:pl-8 align-top py-1">Tanggal SKRD</td>
                            <td className="px-1 align-top py-1">:</td>
                            <td className="py-1">{data.tanggal_skrd}</td>
                          </tr>
                          <tr>
                            <td className="py-1" colSpan="3"></td>
                          </tr>
                          <tr>
                            <td className="font-bold align-top py-1" colSpan="3">
                              5. Obyek Retribusi
                            </td>
                          </tr>
                          <tr>
                            <td className="font-bold pl-4 sm:pl-8 align-top py-1">Obyek</td>
                            <td className="px-1 align-top py-1">:</td>
                            <td className="py-1">{data.obyek}</td>
                          </tr>
                          <tr>
                            <td className="font-bold pl-4 sm:pl-8 align-top py-1">Lokasi Obyek</td>
                            <td className="px-1 align-top py-1">:</td>
                            <td className="py-1 break-words">{data.lokasi}</td>
                          </tr>
                          <tr>
                            <td className="py-1" colSpan="3"></td>
                          </tr>
                          <tr>
                            <td className="font-bold align-top py-1" colSpan="3">
                              6. Status Pembayaran & No TBP
                            </td>
                          </tr>
                          <tr>
                            <td className="font-bold pl-4 sm:pl-8 align-top py-1">Status Bayar</td>
                            <td className="px-1 align-top py-1">:</td>
                            <td className="py-1">
                              <span
                                className={
                                  data.status_bayar === "sudah"
                                    ? "text-green-600 uppercase font-bold"
                                    : "text-red-600 uppercase font-bold"
                                }
                              >
                                {data.status_bayar === "sudah"
                                  ? "Sudah Terbayar"
                                  : "Belum Terbayar"}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="font-bold pl-4 sm:pl-8 align-top py-1">No. TBP</td>
                            <td className="px-1 align-top py-1">:</td>
                            <td className="py-1">{data.no_tbp ? data.no_tbp : "- (Belum Melakukan Pembayaran)"}</td>
                          </tr>
                          <tr>
                            <td className="font-bold pl-4 sm:pl-8 align-top py-1">Tanggal Pembayaran</td>
                            <td className="px-1 align-top py-1">:</td>
                            <td className="py-1">{data.tanggal ? data.tanggal : "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Informasi Waktu Cetak di Bagian Bawah */}
                  <div className="mt-8 sm:mt-12 border-t pt-3 text-[10px] italic text-slate-500">
                    {printInfo && (
                      <div>
                        <div>Dicetak oleh: {printInfo.username}</div>
                        <div>Waktu: {printInfo.waktu}</div>
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