"use client";

import React, { useRef, useState } from "react";

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
  defaultTiltY?: number;
  defaultTiltX?: number;
}

export function Card3D({
  children,
  className = "",
  maxTilt = 14,
  glare = true,
  defaultTiltY = 0,
  defaultTiltX = 0,
}: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({ opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setIsHovered(true);
    setTilt({ x: rotateX, y: rotateY });

    if (glare) {
      const glareX = (x / rect.width) * 100;
      const glareY = (y / rect.height) * 100;
      setGlareStyle({
        opacity: 0.35,
        background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.15) 45%, transparent 75%)`,
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    setGlareStyle({ opacity: 0 });
  };

  // Nếu không rê chuột thì tự động giữ nguyên góc nghiêng 3D mặc định
  const currentTransform = isHovered
    ? `perspective(850px) rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg) scale3d(1.08, 1.08, 1.08) translateZ(24px)`
    : `perspective(850px) rotateX(${defaultTiltX}deg) rotateY(${defaultTiltY}deg) scale3d(1, 1, 1)`;

  return (
    <div
      ref={cardRef}
      className={`card-3d-wrapper ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: currentTransform,
        transition: isHovered
          ? "transform 0.08s ease-out, box-shadow 0.25s ease"
          : "transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.45s ease",
        transformStyle: "preserve-3d",
        position: "relative",
      }}
    >
      {children}
      {glare && (
        <div
          className="card-3d-glare"
          style={{
            ...glareStyle,
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            borderRadius: "inherit",
            zIndex: 10,
            transition: "opacity 0.25s ease-out",
          }}
        />
      )}
    </div>
  );
}

