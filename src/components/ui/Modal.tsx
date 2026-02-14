import React, { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;

  // Mantive os seus:
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  zIndex?: number;
  maxWidth?: string;

  // NOVOS (opcionais)
  variant?: 'default' | 'window';  // "window" = barra estilo janela
  lockSize?: boolean;              // true = altura fixa (não redimensiona)
  heightClass?: string;            // ex: "h-[85vh]" ou "max-h-[85vh]"
  bodyClassName?: string;          // caso queira customizar padding/scroll
}

export const Modal: React.FC<ModalProps> = ({
  children,
  isOpen,
  onClose,
  title,
  size = '3xl',
  zIndex = 50,
  maxWidth = '',
  variant = 'default',
  lockSize = false,
  heightClass,
  bodyClassName,
}) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };

  const widthClass = maxWidth?.trim() ? maxWidth : sizeClasses[size];

  // Default:
  // - se lockSize = true → fixa (h-[85vh]) para não ficar redimensionando
  // - se lockSize = false → só limita (max-h-[85vh]) para não “esticar” confirm modals
  const finalHeightClass =
    heightClass ??
    (lockSize ? 'h-[85vh]' : 'max-h-[85vh]');

  // Body padrão: 1 scroll vertical + sem scroll horizontal
  const finalBodyClass =
    bodyClassName ??
    'flex-1 overflow-y-auto overflow-x-hidden bg-white px-6 py-5';

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
    >
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* wrapper */}
      <div className="relative flex h-full w-full items-center justify-center p-4 sm:p-6">
        <div
          className={[
            'relative w-full',
            widthClass,
            finalHeightClass,
            'rounded-xl bg-white shadow-xl overflow-hidden',
            'flex flex-col',
          ].join(' ')}
          onClick={(e) => e.stopPropagation()}
        >
          {/* header */}
          {variant === 'window' ? (
            <div className="shrink-0 border-b bg-gradient-to-b from-gray-100 to-white">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-yellow-400" />
                    <span className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <h3 className="ml-2 text-base sm:text-lg font-semibold text-gray-900">
                    {title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-2 hover:bg-gray-200 transition-colors"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          ) : (
            <div className="shrink-0 border-b bg-white">
              <div className="flex items-center justify-between px-6 py-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-2 hover:bg-gray-100 transition-colors"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          )}

          {/* body */}
          <div className={finalBodyClass}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
