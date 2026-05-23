export function getAdminBasePath(pathname?: string) {
  return pathname?.startsWith('/ADM-P') ? '/ADM-P' : '/admin';
}