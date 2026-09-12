"use client";

import Link from "next/link";
import Image from "next/image";
import { History, Menu, Moon, Search, Sun, X } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useApp } from "@/components/providers";

const links = [
  ["Trang chủ", "/"],
  ["Phim lẻ", "/movies"],
  ["Phim bộ", "/tv"],
  ["Phim Việt", "/movies?country=viet-nam"],
  ["Phim Trung", "/movies?country=trung-quoc"],
  ["Phim Hàn", "/movies?country=han-quoc"],
  ["Mới cập nhật", "/trending"],
  ["Danh sách xem", "/watchlist"],
  ["Lịch sử xem", "/history"],
] as const;

function DesktopNavLinks() {
  const path = usePathname();
  const searchParams = useSearchParams();

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return path === "/";
    }
    if (href.includes("?")) {
      const [targetPath, queryString] = href.split("?");
      if (path !== targetPath) return false;
      const targetParams = new URLSearchParams(queryString);
      for (const [key, val] of targetParams.entries()) {
        if (searchParams.get(key) !== val) return false;
      }
      return true;
    }
    if (path === href) {
      if (href === "/movies" || href === "/tv") {
        return !searchParams.get("country") && !searchParams.get("genre");
      }
      return true;
    }
    return false;
  };

  return (
    <nav className="desktop-nav">
      {links.slice(0, 8).map(([label, href]) => (
        <Link
          key={label}
          href={href}
          className={isLinkActive(href) ? "active" : ""}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

function MobileNavLinks({ onNavigate }: { onNavigate: () => void }) {
  const path = usePathname();
  const searchParams = useSearchParams();

  const isLinkActive = (href: string) => {
    if (href === "/") return path === "/";
    if (href.includes("?")) {
      const [targetPath, queryString] = href.split("?");
      if (path !== targetPath) return false;
      const targetParams = new URLSearchParams(queryString);
      for (const [key, val] of targetParams.entries()) {
        if (searchParams.get(key) !== val) return false;
      }
      return true;
    }
    if (path === href) {
      if (href === "/movies" || href === "/tv") {
        return !searchParams.get("country") && !searchParams.get("genre");
      }
      return true;
    }
    return false;
  };

  return (
    <nav className="mobile-menu animate-fade-in">
      {links.map(([label, href]) => (
        <Link
          key={label}
          href={href}
          className={isLinkActive(href) ? "active" : ""}
          onClick={onNavigate}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useApp();

  const toggleMenu = () => setOpen((isOpen) => !isOpen);

  // Đóng menu khi đổi route
  useEffect(() => {
    setOpen(false);
  }, [path]);

  // Đóng menu khi nhấn phím Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="logo" aria-label="QMovies home">
          <Image className="brand-cinema-mark" src="/brand/qmovies-cinema-icon.png" alt="" width={32} height={32} priority />
          <span className="brand-cinema-type"><b>Movies</b></span>
        </Link>

        <Suspense
          fallback={
            <nav className="desktop-nav">
              {links.slice(0, 8).map(([label, href]) => (
                <Link key={label} href={href}>
                  {label}
                </Link>
              ))}
            </nav>
          }
        >
          <DesktopNavLinks />
        </Suspense>

        <div className="header-actions">
          <Link href="/search" className="icon-button" aria-label="Search">
            <Search size={19} />
          </Link>
          <button className="icon-button" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link href="/history" className="icon-button header-profile-btn" aria-label="Lịch sử xem phim" title="Lịch sử xem">
            <History size={19} />
          </Link>
          <button
            className="menu-button icon-button"
            onClick={toggleMenu}
            aria-label={open ? "Đóng menu" : "Mở menu"}
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

    </header>

    <div className="mobile-app-menu">
      <div className="mobile-app-launcher">
        <Link
          href="/"
          className="mobile-app-mark-link"
          aria-label="Về trang chủ QMovies"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
          }}
        >
          <Image className="mobile-app-mark" src="/brand/qmovies-cinema-icon.png" alt="QMovies" width={30} height={30} />
        </Link>
        <button
          type="button"
          className="mobile-app-trigger"
          onClick={(e) => {
            e.stopPropagation();
            toggleMenu();
          }}
          aria-label={open ? "Đóng menu" : "Mở menu Movies"}
          aria-expanded={open}
        >
          <span>Movies</span>
          {open ? <X size={19} /> : <Menu size={20} />}
        </button>
      </div>
    </div>

    {open && (
      <div className="mobile-menu-portal">
        <div 
          className="mobile-menu-backdrop" 
          onClick={() => setOpen(false)} 
          aria-label="Đóng menu"
          role="button"
          tabIndex={-1}
        />
        <aside 
          className="mobile-menu-drawer" 
          aria-label="Menu Movies"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mobile-menu-header">
            <div className="mobile-menu-brand">
              <Image src="/brand/qmovies-cinema-icon.png" alt="" width={22} height={22} />
              <span>QMovies</span>
            </div>
            <button
              type="button"
              className="mobile-menu-close-btn"
              onClick={() => setOpen(false)}
              aria-label="Đóng menu"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mobile-menu-tools">
            <Link href="/search" onClick={() => setOpen(false)}>
              <Search size={16} /> Tìm kiếm
            </Link>
            <button type="button" onClick={toggleTheme}>
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              {theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}
            </button>
          </div>
          <Suspense
            fallback={
              <nav className="mobile-menu animate-fade-in">
                {links.map(([label, href]) => (
                  <Link key={label} href={href} onClick={() => setOpen(false)}>
                    {label}
                  </Link>
                ))}
              </nav>
            }
          >
            <MobileNavLinks onNavigate={() => setOpen(false)} />
          </Suspense>
        </aside>
      </div>
    )}
    </>
  );
}
