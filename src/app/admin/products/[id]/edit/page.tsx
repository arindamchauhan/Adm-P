'use client';

import { useParams } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id;

  if (!productId) {
    return <p className="text-sm text-red-600">Missing product id.</p>;
  }

  return <ProductForm mode="edit" productId={productId} />;
}
