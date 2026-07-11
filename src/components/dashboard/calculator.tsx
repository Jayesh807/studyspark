"use client";

import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Delete,
  Calculator,
  Calendar,
  Scale,
  Percent,
  GraduationCap,
  Plus,
  Trash2,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabType = "basic" | "age" | "unit" | "percent" | "gpa";

export function CalculatorWidget({ open, onOpenChange }: CalculatorProps) {
  const [activeTab, setActiveTab] = useState<TabType>("basic");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] h-[540px] p-0 flex flex-col overflow-hidden bg-background/85 backdrop-blur-3xl border-border/40 shadow-2xl rounded-3xl animate-in fade-in-50 duration-200" aria-describedby="toolbox-description">
        <DialogTitle className="sr-only">Student Toolbox</DialogTitle>
        <DialogDescription id="toolbox-description" className="sr-only">
          A multi-purpose student toolbox containing calculations for basic math, age, units, percentages, and GPA.
        </DialogDescription>

        {/* Header Tabs */}
        <div className="flex border-b border-border/40 bg-muted/30 p-2 pr-12 gap-1 overflow-x-auto scrollbar-none shrink-0">
          <TabButton
            active={activeTab === "basic"}
            onClick={() => setActiveTab("basic")}
            icon={<Calculator className="h-4 w-4" />}
            label="Calc"
          />
          <TabButton
            active={activeTab === "age"}
            onClick={() => setActiveTab("age")}
            icon={<Calendar className="h-4 w-4" />}
            label="Age"
          />
          <TabButton
            active={activeTab === "unit"}
            onClick={() => setActiveTab("unit")}
            icon={<Scale className="h-4 w-4" />}
            label="Unit"
          />
          <TabButton
            active={activeTab === "percent"}
            onClick={() => setActiveTab("percent")}
            icon={<Percent className="h-4 w-4" />}
            label="%"
          />
          <TabButton
            active={activeTab === "gpa"}
            onClick={() => setActiveTab("gpa")}
            icon={<GraduationCap className="h-4 w-4" />}
            label="GPA"
          />
        </div>

        {/* Tab Content Area */}
        <div className="p-5 flex-1 flex flex-col justify-between overflow-hidden">
          {activeTab === "basic" && <BasicCalculator open={open} />}
          {activeTab === "age" && <AgeCalculator />}
          {activeTab === "unit" && <UnitConverter />}
          {activeTab === "percent" && <PercentageCalculator />}
          {activeTab === "gpa" && <GpaCalculator />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab Button Helper                                                         */
/* -------------------------------------------------------------------------- */
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap",
        active
          ? "bg-violet-500/15 text-violet-500 shadow-sm border border-violet-500/10"
          : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03]"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  1. Basic Calculator                                                       */
/* -------------------------------------------------------------------------- */
function BasicCalculator({ open }: { open: boolean }) {
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [isNewNumber, setIsNewNumber] = useState(true);
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);

  const handleNumber = useCallback((num: string) => {
    if (isNewNumber) {
      setDisplay(num);
      setIsNewNumber(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  }, [display, isNewNumber]);

  const evaluate = (a: number, b: number, op: string) => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleOperator = useCallback((op: string) => {
    const currentNum = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(currentNum);
      setEquation(`${currentNum} ${op}`);
    } else if (operator && !isNewNumber) {
      const result = evaluate(previousValue, currentNum, operator);
      setPreviousValue(result);
      setDisplay(String(result));
      setEquation(`${result} ${op}`);
    } else {
      setEquation(`${previousValue} ${op}`);
    }

    setOperator(op);
    setIsNewNumber(true);
  }, [display, previousValue, operator, isNewNumber]);

  const handleEqual = useCallback(() => {
    if (operator && previousValue !== null) {
      const currentNum = parseFloat(display);
      const result = evaluate(previousValue, currentNum, operator);
      setDisplay(String(result));
      setEquation(`${previousValue} ${operator} ${currentNum} =`);
      setPreviousValue(null);
      setOperator(null);
      setIsNewNumber(true);
    }
  }, [display, operator, previousValue]);

  const handleClear = useCallback(() => {
    setDisplay("0");
    setEquation("");
    setPreviousValue(null);
    setOperator(null);
    setIsNewNumber(true);
  }, []);

  const handleBackspace = useCallback(() => {
    if (isNewNumber) return;
    setDisplay(display.length > 1 ? display.slice(0, -1) : "0");
  }, [display, isNewNumber]);

  const handleDecimal = useCallback(() => {
    if (isNewNumber) {
      setDisplay("0.");
      setIsNewNumber(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  }, [display, isNewNumber]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (/[0-9]/.test(key)) handleNumber(key);
      if (key === ".") handleDecimal();
      if (key === "+" || key === "-") handleOperator(key);
      if (key === "*") handleOperator("×");
      if (key === "/") handleOperator("÷");
      if (key === "Enter" || key === "=") {
        e.preventDefault();
        handleEqual();
      }
      if (key === "Backspace") handleBackspace();
      if (key === "Escape") handleClear();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleNumber, handleOperator, handleEqual, handleClear, handleBackspace, handleDecimal]);

  return (
    <div className="flex flex-col gap-3.5">
      {/* Display area */}
      <div className="h-24 flex flex-col justify-end items-end p-4 bg-foreground/[0.03] dark:bg-foreground/[0.02] rounded-2xl border border-white/10 shadow-inner overflow-hidden relative">
        <div className="text-muted-foreground/80 text-xs font-medium h-4 tracking-wider absolute top-3 right-4 truncate max-w-[90%] font-mono">
          {equation}
        </div>
        <div
          className={cn(
            "text-4xl font-light tracking-tight truncate w-full text-right transition-all text-foreground font-mono",
            display.length > 10 ? "text-2xl" : "text-4xl",
            display.length > 15 ? "text-xl" : ""
          )}
        >
          {display}
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-4 gap-2.5">
        <Button variant="ghost" className="h-13 rounded-full text-lg font-medium text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 transition-all" onClick={handleClear}>C</Button>
        <Button variant="ghost" className="h-13 rounded-full bg-foreground/5 hover:bg-foreground/10 active:scale-95 transition-all" onClick={handleBackspace}><Delete className="h-5 w-5 text-foreground/70" /></Button>
        <Button variant="ghost" className="h-13 rounded-full text-xl font-medium text-violet-500 bg-violet-500/10 hover:bg-violet-500/20 active:scale-95 transition-all" onClick={() => handleOperator("÷")}>÷</Button>
        <Button variant="ghost" className="h-13 rounded-full text-xl font-medium text-violet-500 bg-violet-500/10 hover:bg-violet-500/20 active:scale-95 transition-all" onClick={() => handleOperator("×")}>×</Button>

        <Button variant="ghost" className="h-13 rounded-full text-xl font-normal bg-foreground/5 hover:bg-foreground/10 text-foreground active:scale-95 transition-all" onClick={() => handleNumber("7")}>7</Button>
        <Button variant="ghost" className="h-13 rounded-full text-xl font-normal bg-foreground/5 hover:bg-foreground/10 text-foreground active:scale-95 transition-all" onClick={() => handleNumber("8")}>8</Button>
        <Button variant="ghost" className="h-13 rounded-full text-xl font-normal bg-foreground/5 hover:bg-foreground/10 text-foreground active:scale-95 transition-all" onClick={() => handleNumber("9")}>9</Button>
        <Button variant="ghost" className="h-13 rounded-full text-2xl font-medium text-violet-500 bg-violet-500/10 hover:bg-violet-500/20 active:scale-95 transition-all" onClick={() => handleOperator("-")}>-</Button>

        <Button variant="ghost" className="h-13 rounded-full text-xl font-normal bg-foreground/5 hover:bg-foreground/10 text-foreground active:scale-95 transition-all" onClick={() => handleNumber("4")}>4</Button>
        <Button variant="ghost" className="h-13 rounded-full text-xl font-normal bg-foreground/5 hover:bg-foreground/10 text-foreground active:scale-95 transition-all" onClick={() => handleNumber("5")}>5</Button>
        <Button variant="ghost" className="h-13 rounded-full text-xl font-normal bg-foreground/5 hover:bg-foreground/10 text-foreground active:scale-95 transition-all" onClick={() => handleNumber("6")}>6</Button>
        <Button variant="ghost" className="h-13 rounded-full text-2xl font-medium text-violet-500 bg-violet-500/10 hover:bg-violet-500/20 active:scale-95 transition-all" onClick={() => handleOperator("+")}>+</Button>

        <Button variant="ghost" className="h-13 rounded-full text-xl font-normal bg-foreground/5 hover:bg-foreground/10 text-foreground active:scale-95 transition-all" onClick={() => handleNumber("1")}>1</Button>
        <Button variant="ghost" className="h-13 rounded-full text-xl font-normal bg-foreground/5 hover:bg-foreground/10 text-foreground active:scale-95 transition-all" onClick={() => handleNumber("2")}>2</Button>
        <Button variant="ghost" className="h-13 rounded-full text-xl font-normal bg-foreground/5 hover:bg-foreground/10 text-foreground active:scale-95 transition-all" onClick={() => handleNumber("3")}>3</Button>
        <Button className="h-[110px] rounded-3xl text-2xl font-medium bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white row-span-2 border-0 shadow-lg shadow-violet-500/25 active:scale-95 transition-all" onClick={handleEqual}>=</Button>

        <Button variant="ghost" className="h-13 rounded-full text-xl font-normal bg-foreground/5 hover:bg-foreground/10 text-foreground col-span-2 active:scale-95 transition-all" onClick={() => handleNumber("0")}>0</Button>
        <Button variant="ghost" className="h-13 rounded-full text-2xl font-normal bg-foreground/5 hover:bg-foreground/10 text-foreground active:scale-95 transition-all" onClick={handleDecimal}>.</Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  2. Age Calculator                                                         */
/* -------------------------------------------------------------------------- */
function AgeCalculator() {
  const [dob, setDob] = useState("");
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [ageDetails, setAgeDetails] = useState<{
    years: number;
    months: number;
    days: number;
    totalDays: number;
    totalWeeks: number;
    daysToNextBday: number;
  } | null>(null);

  const calculateAge = () => {
    if (!dob) return;
    const birth = new Date(dob);
    const target = new Date(targetDate);

    if (isNaN(birth.getTime()) || isNaN(target.getTime())) return;

    let years = target.getFullYear() - birth.getFullYear();
    let months = target.getMonth() - birth.getMonth();
    let days = target.getDate() - birth.getDate();

    if (days < 0) {
      const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
      days += prevMonth.getDate();
      months--;
    }
    if (months < 0) {
      months += 12;
      years--;
    }

    const diffTime = Math.abs(target.getTime() - birth.getTime());
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);

    // Countdown to next birthday
    const nextBday = new Date(target.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextBday < target) {
      nextBday.setFullYear(target.getFullYear() + 1);
    }
    const daysToNextBday = Math.ceil((nextBday.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

    setAgeDetails({ years, months, days, totalDays, totalWeeks, daysToNextBday });
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Date of Birth</label>
          <Input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="bg-foreground/[0.02] border-border/50 text-xs"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Target Date</label>
          <Input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="bg-foreground/[0.02] border-border/50 text-xs"
          />
        </div>
      </div>

      <Button
        onClick={calculateAge}
        disabled={!dob}
        className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl shadow-md shadow-violet-500/25"
      >
        Calculate Age
      </Button>

      <div className="flex-1 flex flex-col justify-center">
        {ageDetails ? (
          <div className="flex flex-col gap-3.5 bg-foreground/[0.02] p-4 rounded-2xl border border-border/40 font-sans">
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-violet-500/10">
              <span className="text-xs font-semibold text-violet-500 uppercase tracking-wide">Precise Age</span>
              <span className="text-2xl font-bold text-foreground mt-1">
                {ageDetails.years} <span className="text-sm font-normal text-muted-foreground mr-1">years</span>
                {ageDetails.months} <span className="text-sm font-normal text-muted-foreground mr-1">months</span>
                {ageDetails.days} <span className="text-sm font-normal text-muted-foreground">days</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="flex flex-col p-2 bg-foreground/[0.01] rounded-xl border border-border/20">
                <span className="text-[10px] text-muted-foreground uppercase">Next Birthday</span>
                <span className="text-sm font-bold text-violet-500 mt-0.5">{ageDetails.daysToNextBday === 366 || ageDetails.daysToNextBday === 365 ? "Today 🎂" : `${ageDetails.daysToNextBday} days`}</span>
              </div>
              <div className="flex flex-col p-2 bg-foreground/[0.01] rounded-xl border border-border/20">
                <span className="text-[10px] text-muted-foreground uppercase">Total Weeks</span>
                <span className="text-sm font-bold text-foreground mt-0.5">{ageDetails.totalWeeks.toLocaleString()}</span>
              </div>
              <div className="flex flex-col p-2 bg-foreground/[0.01] rounded-xl border border-border/20">
                <span className="text-[10px] text-muted-foreground uppercase">Total Days</span>
                <span className="text-sm font-bold text-foreground mt-0.5">{ageDetails.totalDays.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <Calendar className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-xs">Enter your birth date above to see your exact age breakdown and birthday countdown.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  3. Unit Converter                                                         */
/* -------------------------------------------------------------------------- */
type UnitCategory = "length" | "weight" | "temp" | "area";

const UNITS: Record<UnitCategory, { label: string; value: string }[]> = {
  length: [
    { label: "Meters (m)", value: "m" },
    { label: "Centimeters (cm)", value: "cm" },
    { label: "Kilometers (km)", value: "km" },
    { label: "Inches (in)", value: "in" },
    { label: "Feet (ft)", value: "ft" },
    { label: "Yards (yd)", value: "yd" },
    { label: "Miles (mi)", value: "mi" },
  ],
  weight: [
    { label: "Kilograms (kg)", value: "kg" },
    { label: "Grams (g)", value: "g" },
    { label: "Pounds (lb)", value: "lb" },
    { label: "Ounces (oz)", value: "oz" },
  ],
  temp: [
    { label: "Celsius (°C)", value: "C" },
    { label: "Fahrenheit (°F)", value: "F" },
    { label: "Kelvin (K)", value: "K" },
  ],
  area: [
    { label: "Square Meters (m²)", value: "sqm" },
    { label: "Square Kilometers (km²)", value: "sqkm" },
    { label: "Acres (ac)", value: "ac" },
    { label: "Hectares (ha)", value: "ha" },
    { label: "Square Feet (ft²)", value: "sqft" },
  ],
};

const LENGTH_FACTORS: Record<string, number> = {
  m: 1,
  cm: 0.01,
  km: 1000,
  in: 0.0254,
  ft: 0.3048,
  yd: 0.9144,
  mi: 1609.344,
};

const WEIGHT_FACTORS: Record<string, number> = {
  kg: 1,
  g: 0.001,
  lb: 0.45359237,
  oz: 0.028349523,
};

const AREA_FACTORS: Record<string, number> = {
  sqm: 1,
  sqkm: 1000000,
  ac: 4046.85642,
  ha: 10000,
  sqft: 0.09290304,
};

function UnitConverter() {
  const [category, setCategory] = useState<UnitCategory>("length");
  const [inputValue, setInputValue] = useState("1");
  const [fromUnit, setFromUnit] = useState("m");
  const [toUnit, setToUnit] = useState("cm");
  const [result, setResult] = useState("100");

  const convert = useCallback((valStr: string, from: string, to: string, cat: UnitCategory) => {
    const value = parseFloat(valStr);
    if (isNaN(value)) {
      setResult("");
      return;
    }

    if (from === to) {
      setResult(String(value));
      return;
    }

    if (cat === "temp") {
      let tempInC = value;
      if (from === "F") tempInC = (value - 32) * (5 / 9);
      else if (from === "K") tempInC = value - 273.15;

      let finalTemp = tempInC;
      if (to === "F") finalTemp = tempInC * (9 / 5) + 32;
      else if (to === "K") finalTemp = tempInC + 273.15;

      setResult(finalTemp.toFixed(4).replace(/\.?0+$/, ""));
      return;
    }

    const factors = cat === "length"
      ? LENGTH_FACTORS
      : cat === "weight"
        ? WEIGHT_FACTORS
        : AREA_FACTORS;

    const baseValue = value * (factors[from] || 1);
    const converted = baseValue / (factors[to] || 1);
    setResult(converted.toFixed(6).replace(/\.?0+$/, ""));
  }, []);

  const handleCategoryChange = (cat: UnitCategory) => {
    setCategory(cat);
    const firstUnit = UNITS[cat][0].value;
    const secondUnit = UNITS[cat][1]?.value || firstUnit;
    setFromUnit(firstUnit);
    setToUnit(secondUnit);
    convert(inputValue, firstUnit, secondUnit, cat);
  };

  const handleValueChange = (val: string) => {
    setInputValue(val);
    convert(val, fromUnit, toUnit, category);
  };

  const handleFromUnitChange = (unit: string) => {
    setFromUnit(unit);
    convert(inputValue, unit, toUnit, category);
  };

  const handleToUnitChange = (unit: string) => {
    setToUnit(unit);
    convert(inputValue, fromUnit, unit, category);
  };

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    convert(inputValue, toUnit, fromUnit, category);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Category Tabs */}
      <div className="flex justify-between bg-foreground/[0.03] p-1 rounded-xl gap-1">
        {(["length", "weight", "temp", "area"] as UnitCategory[]).map((cat) => (
          <button
            type="button"
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={cn(
              "flex-1 text-[10px] sm:text-xs font-semibold py-1 px-1.5 rounded-lg transition-all capitalize",
              category === cat
                ? "bg-background shadow-xs text-violet-500"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {cat === "temp" ? "Temp" : cat}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {/* Input area */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground">From</label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={inputValue}
              onChange={(e) => handleValueChange(e.target.value)}
              className="flex-1 bg-foreground/[0.02] border-border/50 text-sm font-mono"
            />
            <Select value={fromUnit} onValueChange={handleFromUnitChange}>
              <SelectTrigger className="w-[170px] text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS[category].map((unit) => (
                  <SelectItem key={unit.value} value={unit.value} className="text-xs">
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={swapUnits}
            className="h-8 w-8 rounded-full border border-border/30 hover:bg-violet-500/10 text-muted-foreground hover:text-violet-500 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Output area */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground">To</label>
          <div className="flex gap-2">
            <Input
              type="text"
              readOnly
              value={result}
              className="flex-1 bg-foreground/[0.02] border-border/50 text-sm font-mono focus-visible:ring-0"
            />
            <Select value={toUnit} onValueChange={handleToUnitChange}>
              <SelectTrigger className="w-[170px] text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS[category].map((unit) => (
                  <SelectItem key={unit.value} value={unit.value} className="text-xs">
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  4. Percentage Calculator                                                  */
/* -------------------------------------------------------------------------- */
type PercentageTab = "marks" | "simple";

interface MarksRow {
  id: string;
  name: string;
  obtained: string;
  max: string;
}

function PercentageCalculator() {
  const [subMode, setSubMode] = useState<PercentageTab>("marks");

  // Dynamic Marks Rows state (limited to max 10 rows)
  const [marksRows, setMarksRows] = useState<MarksRow[]>([
    { id: "1", name: "Subject 1", obtained: "85", max: "100" },
    { id: "2", name: "Subject 2", obtained: "90", max: "100" },
    { id: "3", name: "Subject 3", obtained: "78", max: "100" },
    { id: "4", name: "Subject 4", obtained: "92", max: "100" },
  ]);

  // Mode 1: What is X% of Y
  const [val1_X, setVal1_X] = useState("");
  const [val1_Y, setVal1_Y] = useState("");
  const [res1, setRes1] = useState("");

  // Mode 2: X is what percent of Y
  const [val2_X, setVal2_X] = useState("");
  const [val2_Y, setVal2_Y] = useState("");
  const [res2, setRes2] = useState("");

  // Mode 3: Percent change from X to Y
  const [val3_X, setVal3_X] = useState("");
  const [val3_Y, setVal3_Y] = useState("");
  const [res3, setRes3] = useState("");

  const calculateMode1 = (x: string, y: string) => {
    const valX = parseFloat(x);
    const valY = parseFloat(y);
    if (!isNaN(valX) && !isNaN(valY)) {
      setRes1(((valX / 100) * valY).toFixed(4).replace(/\.?0+$/, ""));
    } else {
      setRes1("");
    }
  };

  const calculateMode2 = (x: string, y: string) => {
    const valX = parseFloat(x);
    const valY = parseFloat(y);
    if (!isNaN(valX) && !isNaN(valY) && valY !== 0) {
      setRes2(((valX / valY) * 100).toFixed(4).replace(/\.?0+$/, "") + "%");
    } else {
      setRes2("");
    }
  };

  const calculateMode3 = (x: string, y: string) => {
    const valX = parseFloat(x);
    const valY = parseFloat(y);
    if (!isNaN(valX) && !isNaN(valY) && valX !== 0) {
      const diff = valY - valX;
      const change = (diff / valX) * 100;
      const prefix = change > 0 ? "+" : "";
      setRes3(prefix + change.toFixed(2).replace(/\.?0+$/, "") + "%");
    } else {
      setRes3("");
    }
  };

  // Marks Percentage calculation
  let totalObtained = 0;
  let totalMax = 0;
  marksRows.forEach((r) => {
    const ob = parseFloat(r.obtained);
    const mx = parseFloat(r.max);
    if (!isNaN(ob) && !isNaN(mx) && mx > 0) {
      totalObtained += ob;
      totalMax += mx;
    }
  });
  const overallPercentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) + "%" : "0.00%";

  const addMarksRow = () => {
    if (marksRows.length >= 10) return;
    setMarksRows([...marksRows, { id: String(Date.now()), name: `Subject ${marksRows.length + 1}`, obtained: "", max: "100" }]);
  };
  const removeMarksRow = (id: string) => {
    setMarksRows(marksRows.filter((r) => r.id !== id));
  };
  const updateMarksRow = (id: string, field: keyof MarksRow, val: string) => {
    setMarksRows(marksRows.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  };

  return (
    <div className="flex flex-col gap-3 text-xs font-sans h-full overflow-hidden">
      {/* Sub Mode Selection */}
      <div className="flex bg-foreground/[0.03] p-1 rounded-xl gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setSubMode("marks")}
          className={cn(
            "flex-1 py-1 px-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all uppercase",
            subMode === "marks" ? "bg-background shadow-xs text-violet-500" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Marks %
        </button>
        <button
          type="button"
          onClick={() => setSubMode("simple")}
          className={cn(
            "flex-1 py-1 px-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all uppercase",
            subMode === "simple" ? "bg-background shadow-xs text-violet-500" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Simple %
        </button>
      </div>

      {subMode === "marks" ? (
        <div className="flex flex-col gap-2.5 flex-1 overflow-hidden">
          {/* Scrollable Subjects list with fixed height boundary */}
          <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-hidden">
            <ScrollArea className="flex-1 border border-border/30 rounded-xl bg-foreground/[0.01] h-[210px]">
              <div className="p-3 flex flex-col gap-2">
                {marksRows.map((r) => (
                  <div key={r.id} className="flex gap-2 items-center">
                    <Input
                      placeholder="Subject Name"
                      value={r.name}
                      onChange={(e) => updateMarksRow(r.id, "name", e.target.value)}
                      className="flex-1 bg-background text-[11px] h-8 border-border/40"
                    />
                    <Input
                      placeholder="Obtained"
                      type="number"
                      value={r.obtained}
                      onChange={(e) => updateMarksRow(r.id, "obtained", e.target.value)}
                      className="w-18 bg-background text-[11px] text-center h-8 border-border/40 font-mono"
                    />
                    <span className="text-muted-foreground">/</span>
                    <Input
                      placeholder="Max"
                      type="number"
                      value={r.max}
                      onChange={(e) => updateMarksRow(r.id, "max", e.target.value)}
                      className="w-18 bg-background text-[11px] text-center h-8 border-border/40 font-mono"
                    />
                    {marksRows.length > 1 && (
                      <Button variant="ghost" size="icon" type="button" onClick={() => removeMarksRow(r.id)} className="h-8 w-8 hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground shrink-0 rounded-lg transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={addMarksRow}
              disabled={marksRows.length >= 10}
              className="w-full h-8 shrink-0 text-[11px] border-border/50 bg-background hover:bg-muted font-semibold rounded-xl gap-1 transition-all disabled:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" />
              {marksRows.length >= 10 ? "Max 10 Subjects Reached" : "Add Subject"}
            </Button>
          </div>

          {/* Result Box */}
          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-violet-500/10 border border-violet-500/10 shrink-0 mt-auto">
            <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider leading-none">Overall Percentage</span>
            <span className="text-xl font-bold text-foreground mt-1 leading-none">{overallPercentage}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 font-sans justify-start">
          {/* Percentage Mode 1 */}
          <div className="flex flex-col gap-1.5 p-2.5 bg-foreground/[0.01] rounded-2xl border border-border/20">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">What is X% of Y?</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="X"
                value={val1_X}
                onChange={(e) => { setVal1_X(e.target.value); calculateMode1(e.target.value, val1_Y); }}
                className="w-16 bg-background border-border/40 font-mono text-center h-8 text-[11px]"
              />
              <span className="text-muted-foreground text-[10px]">% of</span>
              <Input
                type="number"
                placeholder="Y"
                value={val1_Y}
                onChange={(e) => { setVal1_Y(e.target.value); calculateMode1(val1_X, e.target.value); }}
                className="w-18 bg-background border-border/40 font-mono text-center h-8 text-[11px]"
              />
              <span className="text-muted-foreground text-[10px]">=</span>
              <Input
                type="text"
                readOnly
                placeholder="Result"
                value={res1}
                className="flex-1 bg-foreground/[0.02] border-border/30 font-mono text-center text-violet-500 font-bold h-8 text-[11px] focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Percentage Mode 2 */}
          <div className="flex flex-col gap-1.5 p-2.5 bg-foreground/[0.01] rounded-2xl border border-border/20">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">X is what percent of Y?</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="X"
                value={val2_X}
                onChange={(e) => { setVal2_X(e.target.value); calculateMode2(e.target.value, val2_Y); }}
                className="w-16 bg-background border-border/40 font-mono text-center h-8 text-[11px]"
              />
              <span className="text-muted-foreground text-[10px]">is what % of</span>
              <Input
                type="number"
                placeholder="Y"
                value={val2_Y}
                onChange={(e) => { setVal2_Y(e.target.value); calculateMode2(val2_X, e.target.value); }}
                className="w-18 bg-background border-border/40 font-mono text-center h-8 text-[11px]"
              />
              <span className="text-muted-foreground text-[10px]">=</span>
              <Input
                type="text"
                readOnly
                placeholder="Result"
                value={res2}
                className="flex-1 bg-foreground/[0.02] border-border/30 font-mono text-center text-violet-500 font-bold h-8 text-[11px] focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Percentage Mode 3 */}
          <div className="flex flex-col gap-1.5 p-2.5 bg-foreground/[0.01] rounded-2xl border border-border/20">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Percentage change from X to Y</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="X"
                value={val3_X}
                onChange={(e) => { setVal3_X(e.target.value); calculateMode3(e.target.value, val3_Y); }}
                className="w-16 bg-background border-border/40 font-mono text-center h-8 text-[11px]"
              />
              <span className="text-muted-foreground text-[10px]">to</span>
              <Input
                type="number"
                placeholder="Y"
                value={val3_Y}
                onChange={(e) => { setVal3_Y(e.target.value); calculateMode3(val3_X, e.target.value); }}
                className="w-20 bg-background border-border/40 font-mono text-center h-8 text-[11px]"
              />
              <span className="text-muted-foreground text-[10px]">=</span>
              <Input
                type="text"
                readOnly
                placeholder="Result"
                value={res3}
                className={cn(
                  "flex-1 bg-foreground/[0.02] border-border/30 font-mono text-center font-bold h-8 text-[11px] focus-visible:ring-0",
                  res3.startsWith("-") ? "text-rose-500" : res3.startsWith("+") ? "text-emerald-500" : "text-violet-500"
                )}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  5. CGPA / GPA Calculator                                                  */
/* -------------------------------------------------------------------------- */
type GpaMode = "gpa" | "cgpa";

interface CourseRow {
  id: string;
  name: string;
  credits: string;
  grade: string;
}

interface SemesterRow {
  id: string;
  name: string;
  gpa: string;
  credits: string;
}

const GRADE_POINTS_10: Record<string, number> = {
  "O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C": 5, "D": 4, "F": 0
};

const GRADE_POINTS_4: Record<string, number> = {
  "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7, "C+": 2.3, "C": 2.0, "C-": 1.7, "D": 1.0, "F": 0.0
};

function GpaCalculator() {
  const [mode, setMode] = useState<GpaMode>("gpa");
  const [scale, setScale] = useState<"10" | "4">("10");

  // GPA List (limited to max 10 rows)
  const [courses, setCourses] = useState<CourseRow[]>([
    { id: "1", name: "", credits: "3", grade: "A+" },
    { id: "2", name: "", credits: "4", grade: "A" },
    { id: "3", name: "", credits: "3", grade: "B+" },
  ]);

  // CGPA List
  const [semesters, setSemesters] = useState<SemesterRow[]>([
    { id: "1", name: "Semester 1", gpa: "8.5", credits: "20" },
    { id: "2", name: "Semester 2", gpa: "8.8", credits: "22" },
  ]);

  const [finalScore, setFinalScore] = useState("");

  const calculateResults = useCallback(() => {
    if (mode === "gpa") {
      let totalPoints = 0;
      let totalCredits = 0;
      const pointsMap = scale === "10" ? GRADE_POINTS_10 : GRADE_POINTS_4;

      courses.forEach((c) => {
        const cr = parseFloat(c.credits);
        const pts = pointsMap[c.grade] ?? 0;
        if (!isNaN(cr) && cr > 0) {
          totalPoints += cr * pts;
          totalCredits += cr;
        }
      });

      const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
      setFinalScore(`${gpa} / ${scale === "10" ? "10.0" : "4.0"}`);
    } else {
      let totalGpaCredits = 0;
      let totalCredits = 0;

      semesters.forEach((s) => {
        const g = parseFloat(s.gpa);
        const cr = parseFloat(s.credits);
        if (!isNaN(g) && !isNaN(cr) && cr > 0) {
          totalGpaCredits += g * cr;
          totalCredits += cr;
        }
      });

      const cgpa = totalCredits > 0 ? (totalGpaCredits / totalCredits).toFixed(2) : "0.00";
      setFinalScore(cgpa);
    }
  }, [mode, scale, courses, semesters]);

  useEffect(() => {
    calculateResults();
  }, [calculateResults]);

  // GPA Actions
  const addCourse = () => {
    if (courses.length >= 10) return;
    setCourses([...courses, { id: String(Date.now()), name: "", credits: "3", grade: scale === "10" ? "A+" : "A" }]);
  };
  const removeCourse = (id: string) => {
    setCourses(courses.filter((c) => c.id !== id));
  };
  const updateCourse = (id: string, field: keyof CourseRow, val: string) => {
    setCourses(courses.map((c) => (c.id === id ? { ...c, [field]: val } : c)));
  };

  // CGPA Actions (also limited to 10 semesters)
  const addSemester = () => {
    if (semesters.length >= 10) return;
    setSemesters([...semesters, { id: String(Date.now()), name: `Semester ${semesters.length + 1}`, gpa: "8.0", credits: "20" }]);
  };
  const removeSemester = (id: string) => {
    setSemesters(semesters.filter((s) => s.id !== id));
  };
  const updateSemester = (id: string, field: keyof SemesterRow, val: string) => {
    setSemesters(semesters.map((s) => (s.id === id ? { ...s, [field]: val } : s)));
  };

  return (
    <div className="flex flex-col gap-3 text-xs font-sans h-full overflow-hidden">
      {/* Sub Mode Tabs */}
      <div className="flex bg-foreground/[0.03] p-1 rounded-xl gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setMode("gpa")}
          className={cn(
            "flex-1 py-1 px-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all uppercase",
            mode === "gpa" ? "bg-background shadow-xs text-violet-500" : "text-muted-foreground hover:text-foreground"
          )}
        >
          GPA
        </button>
        <button
          type="button"
          onClick={() => setMode("cgpa")}
          className={cn(
            "flex-1 py-1 px-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all uppercase",
            mode === "cgpa" ? "bg-background shadow-xs text-violet-500" : "text-muted-foreground hover:text-foreground"
          )}
        >
          CGPA
        </button>
      </div>

      {/* Main calculation container */}
      <div className="flex-1 flex flex-col gap-2.5 min-h-0 overflow-hidden">
        {mode === "gpa" ? (
          <div className="flex flex-col gap-2 flex-1 overflow-hidden">
            {/* Scale toggle */}
            <div className="flex justify-between items-center shrink-0">
              <span className="text-muted-foreground font-medium text-[10px] uppercase">Grading Scale</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setScale("10"); setCourses(courses.map(c => ({ ...c, grade: "A+" }))); }}
                  className={cn("px-2 py-0.5 rounded text-[10px] font-semibold border", scale === "10" ? "bg-violet-500/10 text-violet-500 border-violet-500/20" : "border-transparent text-muted-foreground")}
                >
                  10.0 Scale
                </button>
                <button
                  type="button"
                  onClick={() => { setScale("4"); setCourses(courses.map(c => ({ ...c, grade: "A" }))); }}
                  className={cn("px-2 py-0.5 rounded text-[10px] font-semibold border", scale === "4" ? "bg-violet-500/10 text-violet-500 border-violet-500/20" : "border-transparent text-muted-foreground")}
                >
                  4.0 Scale
                </button>
              </div>
            </div>

            {/* List scroll boundary */}
            <ScrollArea className="flex-1 border border-border/30 rounded-xl bg-foreground/[0.01] h-[190px]">
              <div className="p-3 flex flex-col gap-2">
                {courses.map((c) => (
                  <div key={c.id} className="flex gap-2 items-center">
                    <Input
                      placeholder="Subject Name"
                      value={c.name}
                      onChange={(e) => updateCourse(c.id, "name", e.target.value)}
                      className="flex-1 bg-background text-[11px] h-8 border-border/40"
                    />
                    <Input
                      placeholder="Credits"
                      type="number"
                      value={c.credits}
                      onChange={(e) => updateCourse(c.id, "credits", e.target.value)}
                      className="w-14 bg-background text-[11px] text-center h-8 border-border/40 font-mono"
                    />
                    <Select value={c.grade} onValueChange={(val) => updateCourse(c.id, "grade", val)}>
                      <SelectTrigger className="w-16 h-8 text-[11px] border-border/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(scale === "10" ? GRADE_POINTS_10 : GRADE_POINTS_4).map((g) => (
                          <SelectItem key={g} value={g} className="text-[11px]">
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {courses.length > 1 && (
                      <Button variant="ghost" size="icon" type="button" onClick={() => removeCourse(c.id)} className="h-8 w-8 hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground shrink-0 rounded-lg transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={addCourse}
              disabled={courses.length >= 10}
              className="w-full h-8 shrink-0 text-[11px] border-border/50 bg-background hover:bg-muted font-semibold rounded-xl gap-1 transition-all disabled:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" />
              {courses.length >= 10 ? "Max 10 Subjects Reached" : "Add Subject"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 flex-1 overflow-hidden">
            {/* List scroll boundary */}
            <ScrollArea className="flex-1 border border-border/30 rounded-xl bg-foreground/[0.01] h-[210px]">
              <div className="p-3 flex flex-col gap-2">
                {semesters.map((s) => (
                  <div key={s.id} className="flex gap-2 items-center">
                    <Input
                      placeholder="Semester Name"
                      value={s.name}
                      onChange={(e) => updateSemester(s.id, "name", e.target.value)}
                      className="flex-1 bg-background text-[11px] h-8 border-border/40"
                    />
                    <Input
                      placeholder="GPA"
                      type="number"
                      value={s.gpa}
                      onChange={(e) => updateSemester(s.id, "gpa", e.target.value)}
                      className="w-16 bg-background text-[11px] text-center h-8 border-border/40 font-mono"
                    />
                    <Input
                      placeholder="Credits"
                      type="number"
                      value={s.credits}
                      onChange={(e) => updateSemester(s.id, "credits", e.target.value)}
                      className="w-16 bg-background text-[11px] text-center h-8 border-border/40 font-mono"
                    />
                    {semesters.length > 1 && (
                      <Button variant="ghost" size="icon" type="button" onClick={() => removeSemester(s.id)} className="h-8 w-8 hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground shrink-0 rounded-lg transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={addSemester}
              disabled={semesters.length >= 10}
              className="w-full h-8 shrink-0 text-[11px] border-border/50 bg-background hover:bg-muted font-semibold rounded-xl gap-1 transition-all disabled:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" />
              {semesters.length >= 10 ? "Max 10 Semesters Reached" : "Add Semester"}
            </Button>
          </div>
        )}
      </div>

      {/* Result Display */}
      <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-violet-500/10 border border-violet-500/10 shrink-0 mt-auto">
        <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider leading-none">
          {mode === "gpa" ? "Calculated GPA" : "Calculated CGPA"}
        </span>
        <span className="text-xl font-bold text-foreground mt-1 leading-none">
          {finalScore}
        </span>
      </div>
    </div>
  );
}
