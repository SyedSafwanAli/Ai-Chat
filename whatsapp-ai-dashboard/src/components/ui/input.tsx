import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
          <input
            ref={ref}
            className={cn(
              "w-full rounded-lg border border-gray-300 bg-white pl-9 pr-4 py-2 text-sm",
              "text-gray-900 placeholder:text-gray-400",
              "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
              "transition-all duration-150",
              className
            )}
            {...props}
          />
        </div>
      );
    }

    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm",
          "text-gray-900 placeholder:text-gray-400",
          "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
          "transition-all duration-150",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm",
        "text-gray-900 placeholder:text-gray-400",
        "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
        "transition-all duration-150 resize-none",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm",
        "text-gray-900",
        "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
        "transition-all duration-150 cursor-pointer appearance-none",
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_12px_center]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
