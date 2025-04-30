import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  variant?: "default" | "money";
  indicator?: {
    value: number;
    text: string;
    type: "positive" | "negative" | "neutral";
  };
  details?: ReactNode;
}

export default function StatsCard({ 
  title, 
  value, 
  variant = "default", 
  indicator,
  details
}: StatsCardProps) {
  const formattedValue = variant === "money" && typeof value === "number" 
    ? formatMoney(value) 
    : value;
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-neutral-500 text-sm font-medium">{title}</h4>
          {indicator && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              indicator.type === "positive" 
                ? "bg-green-100 text-green-800" 
                : indicator.type === "negative"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}>
              {indicator.type === "positive" && <ArrowUp className="w-3 h-3 mr-1" />}
              {indicator.type === "negative" && <ArrowDown className="w-3 h-3 mr-1" />}
              {indicator.value !== 0 && indicator.value > 0 ? '+' : ''}{indicator.value}%
            </span>
          )}
        </div>
        <p className="text-3xl font-semibold text-neutral-800">{formattedValue}</p>
        {details && (
          <div className="mt-4 flex items-center text-sm">
            {details}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
