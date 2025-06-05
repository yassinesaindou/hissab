"use client";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";

interface PeriodSelectorProps {
  period: string;
  customStart?: string;
  customEnd?: string;
}

const periodOptions = [
  { label: "Aujourd'hui", value: "today" },
  { label: "Cette semaine", value: "this_week" },
  { label: "Derniers 30 Jours", value: "last_30_days" },
  { label: "Derniers 90 Jours", value: "last_90_days" },
  { label: "Derniers 120 Jours", value: "last_120_days" },
  { label: "Derniers 365 Jours", value: "last_365_days" },
  { label: "Durée Personalisée", value: "custom" },
];

export default function PeriodSelector({ period, customStart, customEnd }: PeriodSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCustom, setIsCustom] = useState(period === "custom");
  const [startDate, setStartDate] = useState<Date | undefined>(
    customStart ? new Date(customStart) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    customEnd ? new Date(customEnd) : undefined
  );

  const handlePeriodChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("period", value);
    if (value !== "custom") {
      newParams.delete("start");
      newParams.delete("end");
      setIsCustom(false);
      setStartDate(undefined);
      setEndDate(undefined);
    } else {
      setIsCustom(true);
    }
    router.push(`/analytics?${newParams.toString()}`);
  };

  const handleCustomRangeApply = () => {
    if (startDate && endDate) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("period", "custom");
      newParams.set("start", startDate.toISOString().split("T")[0]);
      newParams.set("end", endDate.toISOString().split("T")[0]);
      router.push(`/analytics?${newParams.toString()}`);
    }
  };

  return (
    <div className="flex items-center gap-4 mb-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-48">
            {periodOptions.find((opt) => opt.value === period)?.label || "Choisir une période"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {periodOptions.map((opt) => (
            <DropdownMenuItem key={opt.value} onSelect={() => handlePeriodChange(opt.value)}>
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {isCustom && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-40">
                {startDate ? format(startDate, "PPP") : "Start Date"}
                <CalendarIcon className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-40">
                {endDate ? format(endDate, "PPP") : "End Date"}
                <CalendarIcon className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button onClick={handleCustomRangeApply} disabled={!startDate || !endDate}>
           Appliquer
          </Button>
        </div>
      )}
    </div>
  );
}