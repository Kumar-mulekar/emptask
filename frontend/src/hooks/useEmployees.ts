import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  CreateEmployeeInput,
  Employee,
  EmployeeQueryParams,
  PaginatedEmployeesResponse,
  UpdateEmployeeInput,
} from '@/types/employee';

export function useEmployees(params: EmployeeQueryParams) {
  return useQuery<PaginatedEmployeesResponse>({
    queryKey: ['employees', params],
    queryFn: () => api.get<PaginatedEmployeesResponse>('/api/employees', params as Record<string, string | number | undefined>),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation<Employee, Error, CreateEmployeeInput>({
    mutationFn: (data: CreateEmployeeInput) => api.post<Employee>('/api/employees', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation<Employee, Error, { id: string; data: UpdateEmployeeInput }>({
    mutationFn: ({ id, data }) => api.put<Employee>(`/api/employees/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useDeactivateEmployee() {
  const queryClient = useQueryClient();

  return useMutation<Employee, Error, string>({
    mutationFn: (id: string) => api.patch<Employee>(`/api/employees/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
