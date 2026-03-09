import React from 'react';

interface LinkProps {
  name: string; // Ex: eth1 - VIVO
  isDown: boolean;
}

export const LinkStatusBadge: React.FC<LinkProps> = ({ name, isDown }) => {
  // Extrai apenas o nome amigável se possível (Ex: "VIVO" de "eth1 - Principal - VIVO")
  // Lógica simples: Pega a última palavra ou o texto todo
  const friendlyName = name.split('-').pop()?.trim() || name;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border
        ${isDown 
          ? 'bg-red-50 text-red-700 border-red-200' 
          : 'bg-blue-50 text-blue-700 border-blue-200'
        }
      `}
      title={isDown ? "Link indisponível" : "Link operando normalmente"}
    >
      <span className={`w-2 h-2 rounded-full ${isDown ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}></span>
      {friendlyName}
    </span>
  );
};