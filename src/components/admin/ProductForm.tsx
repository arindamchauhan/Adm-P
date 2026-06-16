'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAdminBasePath } from '@/lib/admin-path';

type ProductFormMode = 'create' | 'edit';

type ProductImage = {
  url: string;
  altText?: string;
  isPrimary?: boolean;
};

type ProductPayload = {
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  discount: number;
  stock: number;
  category: string;
  sku: string;
  launchSoon: boolean;
  isPublished: boolean;
  images: ProductImage[];
};

type ProductApiResponse = {
  product?: {
    _id: string;
    name: string;
    description: string;
    shortDescription?: string;
    price: number;
    discount?: number;
    stock: number;
    category: string;
    sku: string;
    launchSoon?: boolean;
    isPublished?: boolean;
    images?: ProductImage[];
  };
  error?: string;
};

type ProductUploadResponse = {
  url?: string;
  error?: string;
};

const EMPTY_FORM: ProductPayload = {
  name: '',
  description: '',
  shortDescription: '',
  price: 0,
  discount: 0,
  stock: 0,
  category: 'masks',
  sku: '',
  launchSoon: false,
  isPublished: true,
  images: [],
};

export default function ProductForm({
  mode,
  productId,
}: {
  mode: ProductFormMode;
  productId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const adminBasePath = getAdminBasePath(pathname);
  const [form, setForm] = useState<ProductPayload>(EMPTY_FORM);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      if (mode !== 'edit' || !productId) return;

      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/products/${productId}`);
        const data: ProductApiResponse = await response.json();

        if (!response.ok || !data.product) {
          throw new Error(data.error || 'Failed to load product');
        }

        setForm({
          name: data.product.name,
          description: data.product.description,
          shortDescription: data.product.shortDescription || '',
          price: Number(data.product.price || 0),
          discount: Number(data.product.discount || 0),
          stock: Number(data.product.stock || 0),
          category: data.product.category || 'masks',
          sku: data.product.sku || '',
          launchSoon: Boolean(data.product.launchSoon),
          isPublished: Boolean(data.product.isPublished),
          images: (data.product.images || []).map((image, index) => ({
            url: image.url,
            altText: image.altText || data.product?.name,
            isPrimary: index === 0,
          })),
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [mode, productId]);

  const canSubmit = useMemo(() => {
    return Boolean(form.name.trim() && form.description.trim() && form.sku.trim());
  }, [form.name, form.description, form.sku]);

  const isManagedUploadUrl = (url: string) => url.startsWith('/uploads/products/');

  const addImage = () => {
    const url = newImageUrl.trim();
    if (!url) return;

    setForm((prev) => ({
      ...prev,
      images: [...prev.images, { url, altText: prev.name || 'Product image', isPrimary: prev.images.length === 0 }],
    }));
    setNewImageUrl('');
  };

  const uploadImageFromDevice = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError('');
    const token = localStorage.getItem('authToken');
    if (!token) {
      setUploadError('Admin session expired. Please login again.');
      event.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/uploads/products', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data: ProductUploadResponse = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Image upload failed');
      }

      setForm((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          {
            url: data.url as string,
            altText: prev.name || 'Product image',
            isPrimary: prev.images.length === 0,
          },
        ],
      }));
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const removeImage = async (indexToRemove: number) => {
    const imageToRemove = form.images[indexToRemove];

    setForm((prev) => {
      const images = prev.images.filter((_, index) => index !== indexToRemove);
      return {
        ...prev,
        images: images.map((image, index) => ({ ...image, isPrimary: index === 0 })),
      };
    });

    if (!imageToRemove || !isManagedUploadUrl(imageToRemove.url)) {
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      await fetch('/api/admin/uploads/products', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: imageToRemove.url }),
      });
    } catch (cleanupError) {
      console.error('Failed to cleanup uploaded image:', cleanupError);
    }
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!canSubmit) {
      setError('Name, description, and SKU are required.');
      return;
    }

    if (form.images.length === 0) {
      setError('Please add at least one product image URL.');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Admin session expired. Please login again.');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        ...form,
        images: form.images.map((image, index) => ({
          url: image.url,
          altText: image.altText || form.name,
          isPrimary: index === 0,
        })),
      };

      const url = mode === 'create' ? '/api/products' : `/api/products/${productId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data: ProductApiResponse = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      router.push(`${adminBasePath}/products`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-gray-600">Loading product...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-heading text-dark-text">
          {mode === 'create' ? 'Add Product' : 'Edit Product'}
        </h1>
        <p className="text-gray-600 mt-1">
          Manage description, discount, stock, and product images from one place.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-gray-700">Product Name</span>
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-gray-700">SKU</span>
          <input
            value={form.sku}
            onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-gray-700">Category</span>
          <select
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="masks">Masks</option>
            <option value="serums">Serums</option>
            <option value="skincare">Skincare</option>
            <option value="suncare">Suncare</option>
            <option value="lips">Lips</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-gray-700">Price (INR)</span>
          <input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value || 0) }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-gray-700">Discount (%)</span>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={form.discount}
              onChange={(e) => setForm((prev) => ({ ...prev, discount: Number(e.target.value || 0) }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, discount: 0 }))}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Remove
            </button>
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-gray-700">Stock</span>
          <input
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => setForm((prev) => ({ ...prev, stock: Number(e.target.value || 0) }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </label>
      </div>

      <label className="space-y-2 block">
        <span className="text-sm font-semibold text-gray-700">Description</span>
        <textarea
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          rows={6}
          className="w-full border border-gray-300 rounded-lg px-4 py-2"
          required
        />
      </label>

      <label className="space-y-2 block">
        <span className="text-sm font-semibold text-gray-700">Short Description (optional)</span>
        <textarea
          value={form.shortDescription}
          onChange={(e) => setForm((prev) => ({ ...prev, shortDescription: e.target.value }))}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-4 py-2"
        />
      </label>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-dark-text">Product Images</h2>

        <div className="space-y-2">
          <span className="text-sm font-semibold text-gray-700">Upload From Device</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            onChange={uploadImageFromDevice}
            disabled={isUploading || isSaving}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm file:mr-3 file:px-3 file:py-1 file:rounded-md file:border-0 file:bg-dark-text file:text-white"
          />
          <p className="text-xs text-gray-500">Accepted: JPG, PNG, WEBP, GIF up to 5MB.</p>
        </div>

        <div className="flex gap-2">
          <input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
          />
          <button
            type="button"
            onClick={addImage}
            className="px-4 py-2 bg-dark-text text-white rounded-lg hover:opacity-90"
          >
            Add Image
          </button>
        </div>

        {isUploading ? <p className="text-sm text-blue-600">Uploading image...</p> : null}
        {uploadError ? <p className="text-sm text-red-600">{uploadError}</p> : null}

        {form.images.length === 0 ? (
          <p className="text-sm text-gray-500">No images added yet.</p>
        ) : (
          <ul className="space-y-2">
            {form.images.map((image, index) => (
              <li
                key={`${image.url}-${index}`}
                className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <img src={image.url} alt={image.altText || form.name || 'Product image'} className="w-14 h-14 rounded-md object-cover mb-2 border border-gray-200" />
                  <p className="text-sm text-gray-700 truncate">{image.url}</p>
                  {index === 0 ? <p className="text-xs text-gold font-semibold">Primary image</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => void removeImage(index)}
                  className="text-sm px-3 py-1 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-6">
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.launchSoon}
            onChange={(e) => setForm((prev) => ({ ...prev, launchSoon: e.target.checked }))}
          />
          Launch soon product
        </label>

        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
          />
          Published
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSaving || !canSubmit}
          className="px-6 py-2 bg-gold text-white rounded-lg font-semibold disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`${adminBasePath}/products`)}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
