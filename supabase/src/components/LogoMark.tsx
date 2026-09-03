import React from "react";

interface LogoMarkProps {
  size?: string;
  className?: string;
}

export default React.memo(function LogoMark({ size = "h-8 w-8", className = "" }: LogoMarkProps) {
  return (
    <img
      src="/logo.svg"
      alt="LoadSaathi logo"
      className={`${size} object-contain select-none ${className}`}
      draggable={false}
      width={128}
      height={128}
    />
  );
});
