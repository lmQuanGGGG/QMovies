"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, Compass, History, House, Search } from "lucide-react";
import { usePathname } from "next/navigation";

const tabs = [
  { icon: House, label: "Trang chủ", href: "/" },
  { icon: Compass, label: "Khám phá", href: "/movies" },
  { icon: Search, label: "Tìm kiếm", href: "/search" },
  { icon: Bookmark, label: "Đã lưu", href: "/watchlist" },
  { icon: History, label: "Lịch sử", href: "/history" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const [isCompact, setIsCompact] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const delta = currentScrollY - lastScrollY.current;

          // Khi ở gần đỉnh trang: luôn mở kích thước đầy đủ
          if (currentScrollY <= 30) {
            setIsCompact(false);
          } else if (delta > 8) {
            // Vuốt lên (cuộn trang xuống dưới): Thu nhỏ thanh navbar
            setIsCompact(true);
          } else if (delta < -8) {
            // Vuốt xuống (cuộn trang lên trên): Phóng to lại kích thước ban đầu
            setIsCompact(false);
          }

          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav 
      className={`bottom-nav ${isCompact ? "compact" : ""}`} 
      aria-label="Thanh điều hướng di động"
    >
      <div className="bottom-nav-island">
        {tabs.map(({ icon: Icon, label, href }) => {
          const isActive = href === "/" ? pathname === "/" : pathname?.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              className={`bottom-nav-item ${isActive ? "active" : ""}`}
              aria-label={label}
            >
              <div className="bottom-nav-pill-bg" />
              <div className="bottom-nav-icon-box">
                <Icon size={19} className="nav-icon" />
              </div>
              <span className="nav-label">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

