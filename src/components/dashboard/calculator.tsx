"use client";

import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CalculatorWidget({ open, onOpenChange }: CalculatorProps) {
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

  // Keyboard support
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
      // Only clear if not in an input, but wait Dialog handles Escape
      if (key === "Escape") {
        handleClear();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleNumber, handleOperator, handleEqual, handleClear, handleBackspace, handleDecimal]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[340px] p-0 overflow-hidden bg-background/60 backdrop-blur-3xl border-border/40 shadow-2xl rounded-[2rem] sm:rounded-[2.5rem]" aria-describedby="calculator-description">
        <DialogTitle className="sr-only">Calculator</DialogTitle>
        <DialogDescription id="calculator-description" className="sr-only">
          A fully functional popup calculator.
        </DialogDescription>
        
        <div className="p-6 sm:p-7 flex flex-col gap-5">
          {/* Display area */}
          <div className="h-28 flex flex-col justify-end items-end p-4 bg-foreground/[0.03] dark:bg-foreground/[0.02] rounded-3xl border border-white/10 shadow-inner overflow-hidden relative">
            <div className="text-muted-foreground/80 text-sm font-medium h-5 tracking-wider absolute top-4 right-5 truncate max-w-[90%]">
              {equation}
            </div>
            <div 
              className={cn(
                "text-5xl font-light tracking-tight truncate w-full text-right transition-all text-foreground",
                display.length > 10 ? "text-3xl" : "text-5xl",
                display.length > 15 ? "text-2xl" : ""
              )}
            >
              {display}
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-4 gap-3">
            <Button variant="ghost" className="h-16 rounded-full text-xl font-medium text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-600 transition-colors active:scale-95 active:shadow-[0_0_15px_rgba(244,63,94,0.4)]" onClick={handleClear}>C</Button>
            <Button variant="ghost" className="h-16 rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors active:scale-95" onClick={handleBackspace}><Delete className="h-5 w-5 text-foreground/70" /></Button>
            <Button variant="ghost" className="h-16 rounded-full text-2xl font-medium text-violet-500 bg-violet-500/10 hover:bg-violet-500/20 transition-all active:scale-95 active:shadow-[0_0_15px_rgba(139,92,246,0.5)]" onClick={() => handleOperator("÷")}>÷</Button>
            <Button variant="ghost" className="h-16 rounded-full text-2xl font-medium text-violet-500 bg-violet-500/10 hover:bg-violet-500/20 transition-all active:scale-95 active:shadow-[0_0_15px_rgba(139,92,246,0.5)]" onClick={() => handleOperator("×")}>×</Button>

            <Button variant="ghost" className="h-16 rounded-full text-2xl font-normal bg-foreground/5 hover:bg-foreground/10 text-foreground transition-all duration-75 active:scale-95 active:shadow-[0_0_15px_rgba(255,255,255,0.3)] dark:active:shadow-[0_0_15px_rgba(255,255,255,0.15)] active:bg-foreground/15" onClick={() => handleNumber("7")}>7</Button>
            <Button variant="ghost" className="h-16 rounded-full text-2xl font-normal bg-foreground/5 hover:bg-foreground/10 text-foreground transition-all duration-75 active:scale-95 active:shadow-[0_0_15px_rgba(255,255,255,0.3)] dark:active:shadow-[0_0_15px_rgba(255,255,255,0.15)] active:bg-foreground/15" onClick={() => handleNumber("8")}>8</Button>
            <Button variant="ghost" className="h-16 rounded-full text-2xl font-normal bg-foreground/5 hover:bg-foreground/10 text-foreground transition-all duration-75 active:scale-95 active:shadow-[0_0_15px_rgba(255,255,255,0.3)] dark:active:shadow-[0_0_15px_rgba(255,255,255,0.15)] active:bg-foreground/15" onClick={() => handleNumber("9")}>9</Button>
            <Button variant="ghost" className="h-16 rounded-full text-3xl font-medium text-violet-500 bg-violet-500/10 hover:bg-violet-500/20 transition-all active:scale-95 active:shadow-[0_0_15px_rgba(139,92,246,0.5)]" onClick={() => handleOperator("-")}>-</Button>

            <Button variant="ghost" className="h-16 rounded-full text-2xl font-normal bg-foreground/5 hover:bg-foreground/10 text-foreground transition-all duration-75 active:scale-95 active:shadow-[0_0_15px_rgba(255,255,255,0.3)] dark:active:shadow-[0_0_15px_rgba(255,255,255,0.15)] active:bg-foreground/15" onClick={() => handleNumber("4")}>4</Button>
            <Button variant="ghost" className="h-16 rounded-full text-2xl font-normal bg-foreground/5 hover:bg-foreground/10 text-foreground transition-all duration-75 active:scale-95 active:shadow-[0_0_15px_rgba(255,255,255,0.3)] dark:active:shadow-[0_0_15px_rgba(255,255,255,0.15)] active:bg-foreground/15" onClick={() => handleNumber("5")}>5</Button>
            <Button variant="ghost" className="h-16 rounded-full text-2xl font-normal bg-foreground/5 hover:bg-foreground/10 text-foreground transition-all duration-75 active:scale-95 active:shadow-[0_0_15px_rgba(255,255,255,0.3)] dark:active:shadow-[0_0_15px_rgba(255,255,255,0.15)] active:bg-foreground/15" onClick={() => handleNumber("6")}>6</Button>
            <Button variant="ghost" className="h-16 rounded-full text-3xl font-medium text-violet-500 bg-violet-500/10 hover:bg-violet-500/20 transition-all active:scale-95 active:shadow-[0_0_15px_rgba(139,92,246,0.5)]" onClick={() => handleOperator("+")}>+</Button>

            <Button variant="ghost" className="h-16 rounded-full text-2xl font-normal bg-foreground/5 hover:bg-foreground/10 text-foreground transition-all duration-75 active:scale-95 active:shadow-[0_0_15px_rgba(255,255,255,0.3)] dark:active:shadow-[0_0_15px_rgba(255,255,255,0.15)] active:bg-foreground/15" onClick={() => handleNumber("1")}>1</Button>
            <Button variant="ghost" className="h-16 rounded-full text-2xl font-normal bg-foreground/5 hover:bg-foreground/10 text-foreground transition-all duration-75 active:scale-95 active:shadow-[0_0_15px_rgba(255,255,255,0.3)] dark:active:shadow-[0_0_15px_rgba(255,255,255,0.15)] active:bg-foreground/15" onClick={() => handleNumber("2")}>2</Button>
            <Button variant="ghost" className="h-16 rounded-full text-2xl font-normal bg-foreground/5 hover:bg-foreground/10 text-foreground transition-all duration-75 active:scale-95 active:shadow-[0_0_15px_rgba(255,255,255,0.3)] dark:active:shadow-[0_0_15px_rgba(255,255,255,0.15)] active:bg-foreground/15" onClick={() => handleNumber("3")}>3</Button>
            <Button className="h-[140px] rounded-[2rem] text-3xl font-medium bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white row-span-2 shadow-lg shadow-violet-500/25 border-0 transition-all hover:scale-[1.02] active:scale-95 active:shadow-[0_0_20px_rgba(139,92,246,0.7)]" onClick={handleEqual}>=</Button>

            <Button variant="ghost" className="h-16 rounded-full text-2xl font-normal bg-foreground/5 hover:bg-foreground/10 text-foreground col-span-2 transition-all duration-75 active:scale-95 active:shadow-[0_0_15px_rgba(255,255,255,0.3)] dark:active:shadow-[0_0_15px_rgba(255,255,255,0.15)] active:bg-foreground/15" onClick={() => handleNumber("0")}>0</Button>
            <Button variant="ghost" className="h-16 rounded-full text-3xl font-normal bg-foreground/5 hover:bg-foreground/10 text-foreground transition-all duration-75 active:scale-95 active:shadow-[0_0_15px_rgba(255,255,255,0.3)] dark:active:shadow-[0_0_15px_rgba(255,255,255,0.15)] active:bg-foreground/15" onClick={handleDecimal}>.</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
