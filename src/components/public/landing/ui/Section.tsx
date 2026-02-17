import React from "react";

type Props = {
  id?: string;
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export const Section: React.FC<Props> = ({ id, title, action, children, className }) => {
  return (
    <section id={id} className={className}>
      <div className="container mx-auto px-4">
        {(title || action) && (
          <div className="flex items-end justify-between gap-3 mb-4">
            {title ? <h2 className="text-xl md:text-2xl font-extrabold">{title}</h2> : <div />}
            {action ? <div>{action}</div> : null}
          </div>
        )}
        {children}
      </div>
    </section>
  );
};
