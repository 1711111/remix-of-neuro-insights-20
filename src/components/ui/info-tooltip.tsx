import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";
import { gsap } from "gsap";

interface InfoTooltipProps {
  content: string;
  className?: string;
}

const InfoTooltip = ({ content, className = "" }: InfoTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tooltipRef.current || !iconRef.current) return;

    if (isVisible) {
      gsap.fromTo(
        tooltipRef.current,
        { opacity: 0, y: 8, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: "back.out(2)" }
      );
      gsap.to(iconRef.current, {
        scale: 1.15,
        duration: 0.2,
        ease: "power2.out",
      });
    } else {
      gsap.to(tooltipRef.current, {
        opacity: 0,
        y: 8,
        scale: 0.95,
        duration: 0.15,
        ease: "power2.in",
      });
      gsap.to(iconRef.current, {
        scale: 1,
        duration: 0.2,
        ease: "power2.out",
      });
    }
  }, [isVisible]);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div
        ref={iconRef}
        className="w-5 h-5 rounded-full border border-muted-foreground/30 flex items-center justify-center cursor-help transition-colors hover:border-primary/50 hover:bg-primary/10"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        <Info className="w-3 h-3 text-muted-foreground" />
      </div>
      <div
        ref={tooltipRef}
        className={`absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-popover-foreground bg-popover border border-border rounded-lg shadow-lg max-w-[200px] pointer-events-none ${
          isVisible ? "" : "opacity-0"
        }`}
      >
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
          <div className="w-2 h-2 bg-popover border-r border-b border-border transform rotate-45 -translate-y-1" />
        </div>
      </div>
    </div>
  );
};

export default InfoTooltip;
