'use client'
import React, { useState, useEffect, useRef } from "react";

interface AnalyticsLoadingTextProps {
  title?: string;
  messages?: string[];
  brandName?: string;
}

export function AnalyticsLoadingText({
  title = "Analyse en cours",
  messages = [
    "Chargement des statistiques",
    "Analyse des données",
    "Préparation des graphiques",
    "Optimisation des rapports"
  ],
  brandName = "hissab",
}: AnalyticsLoadingTextProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Typewriter + delete + cycle
  useEffect(() => {
    const currentFull = messages[msgIndex];
    const speed = isDeleting ? 30 : 60;

    const step = () => {
      if (!isDeleting) {
        if (typedText.length < currentFull.length) {
          setTypedText(currentFull.slice(0, typedText.length + 1));
        } else {
          timeoutRef.current = setTimeout(() => setIsDeleting(true), 2000);
          return;
        }
      } else {
        if (typedText.length > 0) {
          setTypedText(typedText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setMsgIndex((prev) => (prev + 1) % messages.length);
          return;
        }
      }
      timeoutRef.current = setTimeout(step, speed);
    };

    timeoutRef.current = setTimeout(step, speed);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [typedText, isDeleting, msgIndex, messages]);

  // Blinking cursor
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 px-4">
      <div className="text-center space-y-8 max-w-2xl">

        {/* Brand / Title with shimmer and float */}
        <h1 className="text-4xl md:text-5xl font-light tracking-wide animate-float-slow">
          <span className="font-semibold text-transparent bg-clip-text
                           bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600
                           bg-[length:200%_auto] animate-shimmer">
            {brandName}
          </span>
          <span className="mx-3 text-gray-300">•</span>
          <span className="text-gray-700">{title}</span>
        </h1>

        {/* Dynamic typewriter message with cursor */}
        <div className="relative h-12 flex items-center justify-center">
          <p className="text-xl md:text-2xl text-gray-700 font-light">
            {typedText}
            <span
              className={`inline-block w-[2px] h-7 ml-0.5 bg-indigo-400
                          transition-opacity duration-100
                          ${cursorVisible ? "opacity-100" : "opacity-0"}`}
            />
          </p>
        </div>

        {/* Subtle hint */}
        <p className="text-sm text-gray-400 animate-pulse-slow tracking-wider uppercase">
          Mise à jour en temps réel
        </p>
      </div>
    </div>
  );
}