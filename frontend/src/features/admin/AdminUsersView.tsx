import { useState, useEffect } from 'react';
import { adminService } from '../../api/admin';
import { User } from '../../store/useAppStore';
import { UserPlus, Shield, ShieldOff, Trash2 } from 'lucide-react';

export default function AdminUsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async () => {
    const email = prompt("Email del nuevo usuario:");
    if (!email) return;
    const password = prompt("Contraseña provisional:");
    if (!password) return;
    const isSuperuser = confirm("¿Hacer a este usuario administrador?");
    
    try {
      await adminService.createUser({ email, password, is_superuser: isSuperuser });
      fetchUsers();
    } catch (e) {
      alert("Error al crear usuario. Revisa la consola.");
      console.error(e);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await adminService.toggleUserStatus(id);
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Crea cuentas nuevas y administra accesos.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-[#6366f1] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-[#4f46e5] transition-colors"
        >
          <UserPlus size={18} /> Nuevo Usuario
        </button>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
              <th className="p-4 font-medium text-[var(--color-text-secondary)] text-sm">ID</th>
              <th className="p-4 font-medium text-[var(--color-text-secondary)] text-sm">Email</th>
              <th className="p-4 font-medium text-[var(--color-text-secondary)] text-sm">Rol</th>
              <th className="p-4 font-medium text-[var(--color-text-secondary)] text-sm">Estado</th>
              <th className="p-4 font-medium text-[var(--color-text-secondary)] text-sm text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-[var(--color-text-secondary)]">Cargando...</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)] transition-colors">
                <td className="p-4 text-sm">{u.id}</td>
                <td className="p-4 font-medium">{u.email}</td>
                <td className="p-4">
                  {u.is_superuser ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-500">
                      <Shield size={12} /> Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-500">
                      Usuario
                    </span>
                  )}
                </td>
                <td className="p-4">
                  {u.is_active ? (
                    <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-500">Activo</span>
                  ) : (
                    <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-gray-500/10 text-gray-400">Inactivo</span>
                  )}
                </td>
                <td className="p-4 text-right space-x-2">
                  <button 
                    onClick={() => handleToggleStatus(u.id)}
                    className="text-sm px-3 py-1.5 rounded bg-[var(--color-background)] border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors"
                  >
                    {u.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
