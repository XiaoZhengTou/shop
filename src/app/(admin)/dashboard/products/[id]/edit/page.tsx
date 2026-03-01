import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductForm from "../../ProductForm";

async function getProduct(id: string) {
  try {
    return await prisma.product.findUnique({
      where: { id },
      select: {
        id: true, sku: true, titleZh: true, titleEn: true,
        descriptionZh: true, descriptionEn: true,
        price: true, stock: true, category: true, tags: true, status: true, images: true,
      },
    });
  } catch {
    return null;
  }
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <ProductForm
      productId={product.id}
      initialData={{
        sku: product.sku,
        titleZh: product.titleZh,
        titleEn: product.titleEn,
        descriptionZh: product.descriptionZh,
        descriptionEn: product.descriptionEn,
        price: Number(product.price).toFixed(2),
        stock: String(product.stock),
        category: product.category,
        tags: product.tags.join(", "),
        status: product.status,
        images: product.images,
      }}
    />
  );
}
