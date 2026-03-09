import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function PaginationControl({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  isLoading 
}: PaginationControlProps) {
  // Se não houver páginas ou for apenas 1, não precisa mostrar, 
  // mas às vezes é bom mostrar para indicar que é o fim.
  // Vamos esconder se totalPages for 0 ou 1 para limpar a tela.
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <div className="flex-1 text-sm text-muted-foreground">
        Página {currentPage} de {totalPages}
      </div>
      <div className="space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
        >
          Próxima
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}