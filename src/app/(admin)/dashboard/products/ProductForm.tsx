"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Upload, X, ImagePlus } from "lucide-react";

interface ProductFormData {
  sku: string;
  titleZh: string;
  titleEn: string;
  descriptionZh: string;
  descriptionEn: string;
  price: string;
  stock: string;
  category: string;
  tags: string;
  status: string;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData & { images?: string[] }>;
  productId?: string;
}

const CATEGORIES = ["dress", "tops", "outerwear", "bottoms", "accessories"];
const STATUSES = [
  { value: "DRAFT", label: "草稿" },
  { value: "ACTIVE", label: "上架" },
  { value: "INACTIVE", label: "下架" },
];

export default function ProductForm({ initialData, productId }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!productId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProductFormData>({
    sku: initialData?.sku ?? "",
    titleZh: initialData?.titleZh ?? "",
    titleEn: initialData?.titleEn ?? "",
    descriptionZh: initialData?.descriptionZh ?? "",
    descriptionEn: initialData?.descriptionEn ?? "",
    price: initialData?.price ?? "",
    stock: initialData?.stock ?? "0",
    category: initialData?.category ?? "dress",
    tags: initialData?.tags ?? "",
    status: initialData?.status ?? "DRAFT",
  });

  const [images, setImages] = useState<string[]>(initialData?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    if (images.length + files.length > 5) {
      setUploadError("最多上传5张图片");
      return;
    }

    setUploading(true);
    setUploadError("");

    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setImages((prev) => [...prev, data.url]);
      } else {
        setUploadError(data.error || "上传失败");
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (url: string) => {
    setImages((prev) => prev.filter((u) => u !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const body = {
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      images,
    };

    const url = isEdit ? `/api/admin/products/${productId}` : "/api/admin/products";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "保存失败");
      return;
    }

    router.push("/dashboard/products");
    router.refresh();
  };

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-8 cursor-pointer"
      >
        <ArrowLeft size={14} />
        返回
      </button>

      <h1 className="font-serif text-2xl font-semibold text-neutral-900 mb-8">
        {isEdit ? "编辑商品" : "新增商品"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div>
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-3">
            商品图片
          </label>
          <div className="grid grid-cols-5 gap-2 mb-2">
            {images.map((url) => (
              <div key={url} className="relative aspect-square bg-neutral-100 border border-neutral-200 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute top-1 right-1 bg-white border border-neutral-200 rounded-full p-0.5 hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer"
                >
                  <X size={10} className="text-neutral-600" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square border border-dashed border-neutral-300 flex flex-col items-center justify-center gap-1 hover:border-neutral-500 hover:bg-neutral-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 size={16} className="animate-spin text-neutral-400" />
                ) : (
                  <>
                    <ImagePlus size={16} className="text-neutral-400" />
                    <span className="text-xs text-neutral-400">上传</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
          <p className="text-xs text-neutral-400 mt-1">最多5张，每张不超过5MB</p>
        </div>

        {/* SKU */}
        <div>
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">SKU</label>
          <input
            name="sku"
            value={form.sku}
            onChange={handleChange}
            required
            className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-900 transition-colors"
          />
        </div>

        {/* Titles */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">中文名称</label>
            <input
              name="titleZh"
              value={form.titleZh}
              onChange={handleChange}
              required
              className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-900 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">英文名称</label>
            <input
              name="titleEn"
              value={form.titleEn}
              onChange={handleChange}
              className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-900 transition-colors"
            />
          </div>
        </div>

        {/* Descriptions */}
        <div>
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">中文描述</label>
          <textarea
            name="descriptionZh"
            value={form.descriptionZh}
            onChange={handleChange}
            rows={3}
            className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-900 transition-colors resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">英文描述</label>
          <textarea
            name="descriptionEn"
            value={form.descriptionEn}
            onChange={handleChange}
            rows={3}
            className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-900 transition-colors resize-none"
          />
        </div>

        {/* Price / Stock */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">价格 (¥)</label>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              required
              className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-900 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">库存</label>
            <input
              name="stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={handleChange}
              required
              className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-900 transition-colors"
            />
          </div>
        </div>

        {/* Category / Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">分类</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-900 transition-colors bg-white cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">状态</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-900 transition-colors bg-white cursor-pointer"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">标签（逗号分隔）</label>
          <input
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="例：新品,限量,夏季"
            className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-900 transition-colors"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-neutral-900 text-white text-sm px-6 py-2.5 hover:bg-neutral-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            {isEdit ? "保存修改" : "创建商品"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-neutral-200 text-sm px-6 py-2.5 hover:border-neutral-900 transition-colors cursor-pointer"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
