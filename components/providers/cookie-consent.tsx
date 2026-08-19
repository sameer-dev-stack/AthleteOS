"use client";

import { CookieIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function CookieConsent({
  variant = "default",
  onAcceptCallback = () => {},
  onDeclineCallback = () => {},
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hide, setHide] = useState(false);
  const pathname = usePathname();

  const accept = () => {
    setIsOpen(false);
    document.cookie =
      "cookieConsent=true; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
    setTimeout(() => {
      setHide(true);
    }, 700);
    onAcceptCallback();
  };

  const decline = () => {
    setIsOpen(false);
    setTimeout(() => {
      setHide(true);
    }, 700);
    onDeclineCallback();
  };

  useEffect(() => {
    if (pathname !== "/") {
      setHide(true);
      setIsOpen(false);
      return;
    }
    try {
      setIsOpen(true);
      if (document.cookie.includes("cookieConsent=true")) {
        if (variant === "default") {
          setIsOpen(false);
          setTimeout(() => {
            setHide(true);
          }, 700);
        }
      }
    } catch (error) {
      console.error("Error checking cookie consent:", error);
    }
  }, [pathname, variant]);

  if (pathname !== "/" || hide) return null;

  if (variant === "default") {
    return (
      <div
        className={cn(
          "fixed z-200 bottom-0 left-0 right-0 p-4 sm:p-0 sm:left-4 sm:bottom-4 w-full sm:max-w-md duration-700",
          !isOpen
            ? "transition-[opacity,transform] translate-y-8 opacity-0"
            : "transition-[opacity,transform] translate-y-0 opacity-100",
          hide && "hidden"
        )}
      >
        <div className="dark:bg-card bg-bg-elev rounded-lg sm:rounded-md border border-white/[0.06] shadow-lg">
          <div className="grid gap-2">
            <div className="border-b border-white/[0.06] h-12 sm:h-14 flex items-center justify-between p-3 sm:p-4">
              <h1 className="text-base sm:text-lg font-medium text-ink">We use cookies</h1>
              <CookieIcon className="h-4 w-4 sm:h-[1.2rem] sm:w-[1.2rem] text-ink-muted" />
            </div>
            <div className="p-3 sm:p-4">
              <p className="text-xs sm:text-sm font-normal text-start text-ink-muted">
                We use cookies to ensure you get the best experience on our
                website. For more information on how we use cookies, please see
                our cookie policy.
                <br />
                <br />
                <span className="text-xs">
                  By clicking{" "}
                  <span className="font-medium text-ink">Accept</span>, you
                  agree to our use of cookies.
                </span>
                <br />
                <a href="#" className="text-xs underline text-accent hover:text-accent-soft">
                  Learn more.
                </a>
              </p>
            </div>
            <div className="grid grid-cols-2 items-center gap-2 p-3 sm:p-4 sm:py-5 border-t border-white/[0.06] dark:bg-bg-elev/20">
              <Button onClick={accept} className="w-full">
                Accept
              </Button>
              <Button onClick={decline} variant="outline" className="w-full">
                Decline
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "small") {
    return (
      <div
        className={cn(
          "fixed z-200 bottom-0 left-0 right-0 p-4 sm:p-0 sm:left-4 sm:bottom-4 w-full sm:max-w-md duration-700",
          !isOpen
            ? "transition-[opacity,transform] translate-y-8 opacity-0"
            : "transition-[opacity,transform] translate-y-0 opacity-100",
          hide && "hidden"
        )}
      >
        <div className="m-0 sm:m-3 dark:bg-card bg-bg-elev border border-white/[0.06] rounded-lg shadow-lg">
          <div className="flex items-center justify-between p-3">
            <h1 className="text-base sm:text-lg font-medium text-ink">We use cookies</h1>
            <CookieIcon className="h-4 w-4 sm:h-[1.2rem] sm:w-[1.2rem] text-ink-muted" />
          </div>
          <div className="p-3 -mt-2">
            <p className="text-xs sm:text-sm text-left text-ink-muted">
              We use cookies to ensure you get the best experience on our website.
              For more information on how we use cookies, please see our cookie
              policy.
            </p>
          </div>
          <div className="grid grid-cols-2 items-center gap-2 p-3 mt-2 border-t border-white/[0.06]">
            <Button onClick={accept} className="w-full">
              Accept
            </Button>
            <Button
              onClick={decline}
              className="w-full"
              variant="outline"
            >
              Decline
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    variant === "minimal" && (
      <div
        className={cn(
          "fixed z-200 bottom-0 left-0 right-0 p-4 sm:p-0 sm:left-4 sm:bottom-4 w-full sm:max-w-[300px] duration-700",
          !isOpen
            ? "transition-[opacity,transform] translate-y-8 opacity-0"
            : "transition-[opacity,transform] translate-y-0 opacity-100",
          hide && "hidden"
        )}
      >
        <div className="m-0 sm:m-3 dark:bg-card bg-bg-elev border border-white/[0.06] rounded-lg shadow-lg">
          <div className="p-3 flex items-center justify-between border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <CookieIcon className="h-3 w-3 sm:h-4 sm:w-4 text-ink-muted" />
              <span className="text-xs sm:text-sm font-medium text-ink">Cookie Notice</span>
            </div>
          </div>
          <div className="p-3">
            <p className="text-[11px] sm:text-xs text-ink-muted">
              We use cookies to enhance your browsing experience.
            </p>
            <div className="grid grid-cols-2 items-center gap-2 mt-3">
              <Button
                onClick={accept}
                variant="default"
                className="w-full"
              >
                Accept
              </Button>
              <Button
                onClick={decline}
                variant="ghost"
                className="w-full"
              >
                Decline
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  );
}
