"use client";

import type { ReactNode } from "react";

/** Small client wrapper: a server-action form with a confirm() guard. */
export function ConfirmForm({
  action,
  message,
  fields,
  className,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  message: string;
  fields: Record<string, string>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children}
    </form>
  );
}
