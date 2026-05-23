'use client';

import Link from 'next/link';

const WHATSAPP_NUMBER = '9876543210';
const PREFILL_MESSAGE = 'Hi! I would like to order directly from WhatsApp. Please share the available products and pricing.';

export default function WhatsAppBanner() {
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(PREFILL_MESSAGE)}`;

  const messages = [
    { en: '📱 Order Direct on WhatsApp', hi: 'व्हाट्सएप पर सीधे ऑर्डर करें' },
    { en: '🚚 Free Delivery', hi: 'मुफ्त डिलीवरी' },
    { en: '⚡ Instant Response', hi: 'तत्काल प्रतिक्रिया' },
    { en: '💎 Exclusive Deals', hi: 'विशेष ऑफर' },
    { en: '✅ 100% Authentic', hi: '100% असली' },
  ];

  // Duplicate messages to create a seamless loop
  const trackItems = [...messages, ...messages];

  return (
    <Link href={whatsappLink} target="_blank" rel="noopener noreferrer" className="block w-full">
      <div className="whatsapp-banner w-full fixed top-16 left-0 right-0 z-40 sm:top-20">
        <style>{`
          .whatsapp-banner { --banner-height: 64px; }
          .whatsapp-track { display: flex; align-items: center; gap: 2.5rem; }

          /* Desktop marquee: translate left by 50% of the track to loop smoothly */
          @keyframes marqueeDesktop {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }

          /* Mobile marquee: shorter distance and faster */
          @keyframes marqueeMobile {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }

          .marquee-desktop { animation: marqueeDesktop 22s linear infinite; }
          .marquee-mobile { animation: marqueeMobile 12s linear infinite; }

          /* Pause on hover/focus */
          .whatsapp-banner:hover .marquee-desktop,
          .whatsapp-banner:focus-within .marquee-desktop,
          .whatsapp-banner:hover .marquee-mobile,
          .whatsapp-banner:focus-within .marquee-mobile {
            animation-play-state: paused;
          }

          /* Respect reduced motion */
          @media (prefers-reduced-motion: reduce) {
            .marquee-desktop, .marquee-mobile { animation: none !important; }
          }

        `}</style>

        <div className="w-full bg-gradient-to-r from-[#25D366] via-[#128C7E] to-[#25D366] cursor-pointer group shadow-md">
          <div className="max-w-screen-xl mx-auto">
            {/* Desktop marquee */}
            <div className="hidden sm:block overflow-hidden">
              <div className="marquee-desktop whatsapp-track py-3 px-2">
              <div className="flex gap-12 whitespace-nowrap w-[200%] items-center">
                {trackItems.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex flex-col gap-1 min-w-max">
                      <span className="text-sm sm:text-lg font-bold text-white drop-shadow-md">{m.en}</span>
                      <span className="text-xs sm:text-sm text-white/90 drop-shadow-md font-medium">{m.hi}</span>
                    </div>
                    <div className="text-white/60 text-2xl">▸</div>
                  </div>
                ))}
              </div>
            </div>
            </div>

            {/* Mobile marquee (single compact line) */}
            <div className="sm:hidden overflow-hidden">
            <div className="marquee-mobile whatsapp-track py-2 px-3">
              <div className="flex gap-6 whitespace-nowrap w-[200%] items-center">
                {trackItems.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white drop-shadow-md leading-tight">{m.en}</span>
                      <span className="text-[10px] text-white/90 drop-shadow-md leading-tight">{m.hi}</span>
                    </div>
                    <div className="text-white/60 text-lg">▸</div>
                  </div>
                ))}
              </div>
            </div>
            </div>

          </div>
        </div>
      </div>
    </Link>
  );
}
