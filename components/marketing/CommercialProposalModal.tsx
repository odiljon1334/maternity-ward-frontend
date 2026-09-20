"use client";

import React, { useState, useRef } from "react";
import { formatMoney } from "@/lib/utils";
import {
  X,
  Printer,
  CheckCircle,
} from "lucide-react";

interface CommercialProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    employees?: number;
    salary?: number;
    lostMinutes?: number;
    monthlyLoss?: number;
    savings?: number;
  };
}

export function CommercialProposalModal({
  isOpen,
  onClose,
  initialData,
}: CommercialProposalModalProps) {
  const [companyName, setCompanyName] = useState<string>("Smart Business MCHJ");
  const [contactPerson, setContactPerson] = useState<string>("Bosh Direktor");
  const [employeeCount, setEmployeeCount] = useState<number>(
    initialData?.employees || 65
  );

  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const today = new Date().toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const estimatedLoss =
    initialData?.monthlyLoss ||
    Math.round(employeeCount * 18 * 22 * (4500000 / (22 * 480)) + employeeCount * 4500000 * 0.025);

  const estimatedSavings =
    initialData?.savings ||
    Math.max(
      0,
      estimatedLoss -
        (employeeCount <= 20
          ? 290000
          : employeeCount <= 50
          ? 590000
          : employeeCount <= 100
          ? 990000
          : employeeCount <= 300
          ? 1890000
          : employeeCount * 7500)
    );

  const formatUZS = (val: number) => {
    return formatMoney(val);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Controls Header (Not printed) */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              PDF
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Rasmiy Tijoriy Taklif (Commercial Proposal)
              </h3>
              <p className="text-[11px] text-slate-500">
                Korxona rahbari yoki ta&apos;sischilarga taqdim etish uchun A4 formati
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Chop etish / PDF saqlash</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Input Customizer Row (Quick tweak before print) */}
        <div className="px-6 py-3 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs print:hidden">
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              Kompaniya nomi:
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              Qabul qiluvchi shaxs:
            </label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              Xodimlar soni:
            </label>
            <input
              type="number"
              value={employeeCount}
              onChange={(e) => setEmployeeCount(Number(e.target.value))}
              className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            />
          </div>
        </div>

        {/* Printable Proposal Document Body */}
        <div
          ref={printRef}
          className="p-6 sm:p-10 overflow-y-auto bg-white text-slate-900 space-y-6 text-xs sm:text-sm print:p-0 print:text-black"
        >
          {/* Header with Logo and Proposal No */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-blue-600">
                  StaffPulse
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Universal Davomat, Face ID va Smart HR Boshqaruv Ekotizimi
              </p>
              <p className="text-[10px] text-slate-400">Toshkent sh., O&apos;zbekiston | staffpulse.uz</p>
            </div>

            <div className="text-right">
              <div className="text-base font-black text-slate-900 uppercase">
                TIJORIY TAKLIF
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5" suppressHydrationWarning>
                № SP-2026-9824
              </div>
              <div className="text-[11px] text-slate-500" suppressHydrationWarning>
                Sana: {today}
              </div>
            </div>
          </div>

          {/* Addressee Info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Mijoz tashkilot:
              </span>
              <div className="font-bold text-slate-900 text-sm">{companyName}</div>
              <div className="text-slate-600 text-xs">Diqqatiga: {contactPerson}</div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Loyiha ko&apos;lami:
              </span>
              <div className="font-bold text-slate-900 text-sm">
                {employeeCount} nafar xodim uchun davomat nazorati
              </div>
              <div className="text-slate-600 text-xs">Sinov muddati: 14 kun mutlaqo bepul</div>
            </div>
          </div>

          {/* Proposal Essence */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
              1. Loyiha maqsadi va iqtisodiy asos
            </h4>
            <p className="text-slate-700 leading-relaxed text-xs">
              Ushbu taklif <strong>&quot;{companyName}&quot;</strong> korxonasida inson omilisiz 100% shaffof davomat, ish vaqti hisobi (tabel), tungi va rotatsion smenalarni to&apos;liq avtomatlashtirishga qaratilgan.
            </p>
          </div>

          {/* Financial Calculation Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
              2. Kutilayotgan moliyaviy samaradorlik
            </h4>
            <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                    <th className="p-3">Ko&apos;rsatkich</th>
                    <th className="p-3 text-right">Hozirgi yo&apos;qotish</th>
                    <th className="p-3 text-right">StaffPulse bilan</th>
                    <th className="p-3 text-right text-emerald-700">Oylik Tejamkorlik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-3">Kechikishlar va erta ketishlar yo&apos;qotishi</td>
                    <td className="p-3 text-right text-red-600" suppressHydrationWarning>
                      {formatUZS(Math.round(estimatedLoss * 0.7))}
                    </td>
                    <td className="p-3 text-right text-slate-500">0 so&apos;m (Qat&apos;iy nazorat)</td>
                    <td className="p-3 text-right font-bold text-emerald-600" suppressHydrationWarning>
                      +{formatUZS(Math.round(estimatedLoss * 0.7))}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">Kadrlar tabeli va hisob-kitob xarajatlari</td>
                    <td className="p-3 text-right text-red-600" suppressHydrationWarning>
                      {formatUZS(Math.round(estimatedLoss * 0.3))}
                    </td>
                    <td className="p-3 text-right text-slate-500">Avtomatik (1 bosishda)</td>
                    <td className="p-3 text-right font-bold text-emerald-600" suppressHydrationWarning>
                      +{formatUZS(Math.round(estimatedLoss * 0.3))}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50 font-bold text-slate-900">
                    <td className="p-3">JAMI KORXONA FOYDASI:</td>
                    <td className="p-3 text-right text-red-700" suppressHydrationWarning>{formatUZS(estimatedLoss)}/oy</td>
                    <td className="p-3 text-right text-slate-700">Minimal obuna</td>
                    <td className="p-3 text-right text-emerald-700 text-sm" suppressHydrationWarning>
                      +{formatUZS(estimatedSavings)} / oy
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Conditions & Guarantees */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
              3. Ta&apos;minot va kafolatlar
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Face ID majburiy emas:</strong> Xodimlar smartfon ilovasi (GPS + yuz) orqali 0 xarajat bilan foydalanishi mumkin.
                </span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>O&apos;rnatish va montaj:</strong> Mutaxassislarimiz borib o&apos;rnatish va sozlash xizmati mutlaqo 0 so&apos;m (obuna hisobidan).
                </span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>1C va YAMMT:</strong> T-13 tabel avtomatik 1C formatiga eksport bo&apos;ladi.
                </span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>14 kunlik sinov:</strong> Hech qanday oldindan to&apos;lovsiz to&apos;liq funksional sinov davri.
                </span>
              </div>
            </div>
          </div>

          {/* Signatures Footer */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
            <div>
              <div className="font-bold text-slate-900">Ijrochi: &quot;StaffPulse PRO&quot;</div>
              <div className="text-slate-500 mt-1">Bosh Direktor: Rustamov A.M.</div>
              <div className="text-slate-500">M.O&apos;. ____________________</div>
            </div>
            <div>
              <div className="font-bold text-slate-900">Buyurtmachi: &quot;{companyName}&quot;</div>
              <div className="text-slate-500 mt-1">Qabul qildi: {contactPerson}</div>
              <div className="text-slate-500">Imzo: ____________________</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
