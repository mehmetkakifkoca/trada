import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerService, Customer } from "@/lib/firebase/services/customers";
import { toast } from "sonner";

export function useCustomers() {
  const queryClient = useQueryClient();

  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: () => customerService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (newCustomer: Omit<Customer, "id" | "createdAt" | "updatedAt">) => 
      customerService.create(newCustomer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Kunde erfolgreich erstellt");
    },
    onError: () => {
      toast.error("Fehler beim Erstellen des Kunden");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) => 
      customerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Kunde erfolgreich aktualisiert");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Kunde erfolgreich gelöscht");
    },
  });

  return {
    customers: customersQuery.data ?? [],
    isLoading: customersQuery.isLoading,
    isError: customersQuery.isError,
    createCustomer: createMutation.mutateAsync,
    updateCustomer: updateMutation.mutateAsync,
    deleteCustomer: deleteMutation.mutateAsync,
  };
}
