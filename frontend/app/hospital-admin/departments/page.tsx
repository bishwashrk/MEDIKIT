'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage, hospitalAdminApi } from '@/lib/api';
import { toast } from '@/components/ui/Toaster';
import { Department } from '@/types';
import {
  Building2,
  Edit,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';

type DepartmentForm = {
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
};

const initialForm: DepartmentForm = {
  name: '',
  description: '',
  icon: '',
  is_active: true,
};

export default function HospitalDepartmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState<number | null>(null);
  const [form, setForm] = useState<DepartmentForm>(initialForm);

  const { data, isLoading, error } = useQuery({
    queryKey: ['hospital-admin-departments'],
    queryFn: hospitalAdminApi.getDepartments,
  });

  const departments = data?.results || [];

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return departments;

    return departments.filter((dept) => {
      const name = (dept.name || '').toLowerCase();
      const description = (dept.description || '').toLowerCase();
      return name.includes(query) || description.includes(query);
    });
  }, [departments, search]);

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Department>) => hospitalAdminApi.createDepartment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-departments'] });
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-stats'] });
      setForm(initialForm);
      setIsCreating(false);
      toast('Department created successfully.', 'success');
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Department> }) =>
      hospitalAdminApi.updateDepartment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-departments'] });
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-stats'] });
      setForm(initialForm);
      setEditingDepartmentId(null);
      toast('Department updated successfully.', 'success');
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => hospitalAdminApi.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-departments'] });
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-stats'] });
      toast('Department deleted successfully.', 'success');
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const startCreate = () => {
    setEditingDepartmentId(null);
    setForm(initialForm);
    setIsCreating(true);
  };

  const startEdit = (department: Department) => {
    setIsCreating(false);
    setEditingDepartmentId(department.id);
    setForm({
      name: department.name || '',
      description: department.description || '',
      icon: department.icon || '',
      is_active: department.is_active !== false,
    });
  };

  const resetForm = () => {
    setForm(initialForm);
    setIsCreating(false);
    setEditingDepartmentId(null);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const payload: Partial<Department> = {
      name: form.name.trim(),
      description: form.description.trim(),
      icon: form.icon.trim() || undefined,
      is_active: form.is_active,
    };

    if (!payload.name) {
      toast('Department name is required.', 'error');
      return;
    }

    if (editingDepartmentId) {
      updateMutation.mutate({ id: editingDepartmentId, payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const handleDelete = (department: Department) => {
    if (!confirm(`Delete department "${department.name}"?`)) return;
    deleteMutation.mutate(department.id);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600">Create and manage departments for your hospital.</p>
        </div>
        {!isCreating && editingDepartmentId === null && (
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Department
          </button>
        )}
      </div>

      {(isCreating || editingDepartmentId !== null) && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingDepartmentId ? 'Edit Department' : 'Create Department'}
            </h2>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-800"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g. Neurology"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon (optional)</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g. brain"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Describe what this department handles"
              />
            </div>

            <div className="md:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                />
                Active department
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editingDepartmentId ? 'Save Changes' : 'Create Department'}
          </button>
        </form>
      )}

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search departments..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      )}

      {!isLoading && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load departments.
        </div>
      )}

      {!isLoading && !error && filteredDepartments.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-500">
          <Building2 className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          No departments found.
        </div>
      )}

      {!isLoading && !error && filteredDepartments.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredDepartments.map((department) => (
            <div key={department.id} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{department.description || 'No description'}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    department.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {department.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">{department.doctor_count || 0} doctors</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(department)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(department)}
                    disabled={deleteMutation.isPending}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-red-200 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
