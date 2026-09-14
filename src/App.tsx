/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Sparkles, CheckCircle2, Eye, ShieldCheck, Palette } from 'lucide-react';
import logo1 from './assets/images/modern_tech_emblem_1787006780331.jpg';
import logo2 from './assets/images/core_sync_emblem_1787006794506.jpg';

export default function App() {
  const [selectedLogo, setSelectedLogo] = useState<number | null>(null);

  const logos = [
    {
      id: 1,
      title: 'Concept 1: Interlocking Fusion Cube',
      subtitle: 'মডুলার হার্ডওয়্যার ও কম্প্যাটিবিলিটি থিম',
      src: logo1,
      filename: 'concept_1_fusion_cube_emblem.jpg',
      badge: 'Hardware Modular',
      desc: 'পার্পল এবং প্ল্যাটিনাম মেটালিক ইন্টারলকিং নোডস — পার্টস ম্যাচিং ও কম্বো ফাইন্ডিংয়ের জন্য পারফেক্ট ইউনিক মেটাফর।'
    },
    {
      id: 2,
      title: 'Concept 2: Infinite Core Sync Loop',
      subtitle: 'ডাইনামিক সার্কিট ও ইন্টেলিজেন্ট কোড লুপ',
      src: logo2,
      filename: 'concept_2_infinite_core_sync.jpg',
      badge: 'Circuit & Connectivity',
      desc: 'আল্ট্রাভায়োলেট নিয়ন ফ্রস্টেড গ্লাস এবং পলিনাম কনট্যুর — ফিউচারিস্টিক ইলেকট্রনিক্স ও টেক প্ল্যাটফর্মের জন্য সেরা।'
    }
  ];

  const handleDownload = (src: string, filename: string) => {
    const link = document.createElement('a');
    link.href = src;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="logo-showcase-container" className="min-h-screen bg-[#0A0518] text-white flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-purple-500 selection:text-white">
      {/* Header */}
      <header id="main-header" className="max-w-6xl mx-auto w-full flex items-center justify-between pb-6 border-b border-purple-950/60">
        <div id="brand-tag" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Brand Identity Studio
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-purple-900/60 text-purple-300 border border-purple-700/40">
                Ultra HD 3D
              </span>
            </h1>
            <p className="text-xs text-purple-400/80">ইউনিক ও আধুনিক টেক লোগো প্রিভিউ এবং সরাসরি ডাউনলোড</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            2 New Logos Ready
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-section" className="max-w-6xl mx-auto w-full my-auto py-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/60">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            কোনো নির্দিষ্ট অক্ষরের ওপর নির্ভরশীল নয় • ১০০% ইউনিক
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            আপনার নতুন ব্র্যান্ডের জন্য <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent">২টি ইউনিক লোগো</span>
          </h2>
          <p className="text-sm sm:text-base text-purple-300/80">
            সাইটের ডিপ পার্পল থিমের সাথে ১০০% ম্যাচ করা হয়েছে। নিচে ছবিগুলো দেখুন এবং আপনার পছন্দেরটি ডাউনলোড করে নিন।
          </p>
        </div>

        {/* Logo Cards Grid */}
        <div id="logo-grid" className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {logos.map((logo) => (
            <div
              key={logo.id}
              id={`logo-card-${logo.id}`}
              className="bg-[#120B24] border border-purple-900/60 hover:border-purple-600/80 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col group"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-square w-full bg-[#070311] flex items-center justify-center p-6 border-b border-purple-950/60 overflow-hidden">
                <img
                  src={logo.src}
                  alt={logo.title}
                  className="w-full h-full object-contain rounded-2xl shadow-2xl transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-4 left-4 text-xs font-medium px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-purple-200 border border-purple-500/30">
                  {logo.badge}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                    {logo.title}
                  </h3>
                  <p className="text-xs font-medium text-purple-400">{logo.subtitle}</p>
                  <p className="text-xs text-purple-300/70 leading-relaxed">{logo.desc}</p>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    id={`btn-download-${logo.id}`}
                    onClick={() => handleDownload(logo.src, logo.filename)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] text-white shadow-lg shadow-purple-900/40 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    ডাউনলোড করুন (HD)
                  </button>
                  <a
                    href={logo.src}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/60 text-purple-300 transition-colors inline-flex items-center justify-center"
                    title="ফুল সাইজ প্রিভিউ"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer id="footer" className="max-w-6xl mx-auto w-full pt-6 border-t border-purple-950/60 text-xs text-purple-400/60 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>রয়্যালটি-ফ্রি ও এক্সক্লুসিভ টেক ব্র্যান্ডিং এসেট</span>
        </p>
        <p>সরাসরি প্রিভিউ ও ডাউনলোডের জন্য প্রস্তুত</p>
      </footer>
    </div>
  );
}


