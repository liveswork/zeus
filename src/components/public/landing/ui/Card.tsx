import React from "react";
import clsx from "clsx";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "soft";
};

export const Card: React.FC<Props> = ({ className, variant = "default", ...props }) => {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-neutral-200",
        variant === "default" ? "bg-white" : "bg-neutral-50",
        className
      )}
      {...props}
    />
  );
};
