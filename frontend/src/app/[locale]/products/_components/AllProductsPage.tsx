"use client";

import { motion } from "framer-motion";
import { usePublicQuickLinks } from "@/src/hooks/quick-payment/useQuickPayment";
import {
  Loader2,
  ShoppingCart,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link } from "@/src/i18n/routing";
import { useState } from "react";

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

export default function AllProductsPage() {
  const [page, setPage] = useState(1);
  const { data: productsData, isLoading } = usePublicQuickLinks(page, 9);

  const products = productsData?.data || [];
  const pagination = productsData?.pagination;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-20">
        <Package className="w-20 h-20 text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Product not found
        </h3>
        <p className="text-gray-500">Product is not available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 md:px-20 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product: any, index: number) => (
            <motion.div
              key={product.id}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={cardVariants}
            >
              <Link href={`/pay/${product.slug}`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden hover:border-brand-green transition-colors duration-300 h-full flex flex-col group">
                  <div className="relative h-44 bg-gray-100 overflow-hidden">
                    {product.image ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_BASE_URL}${product.image}`}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-14 h-14 text-gray-300" />
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-800 mb-1.5 line-clamp-2 group-hover:text-brand-green transition-colors">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="text-lg font-bold text-brand-green">
                        ₾{product.price}
                      </div>
                      <div className="flex items-center gap-2 text-brand-green-mid group-hover:text-brand-green transition-colors">
                        <ShoppingCart size={18} />
                        <span className="font-medium text-sm">შეძენა</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <motion.div
            className="flex items-center justify-center gap-4 mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex items-center gap-2">
              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1
              ).map((pageNum) => {
                const showPage =
                  pageNum === 1 ||
                  pageNum === pagination.totalPages ||
                  Math.abs(pageNum - page) <= 1;

                const showEllipsis =
                  (pageNum === 2 && page > 3) ||
                  (pageNum === pagination.totalPages - 1 &&
                    page < pagination.totalPages - 2);

                if (showEllipsis) {
                  return (
                    <span key={pageNum} className="px-2 text-gray-400">
                      ...
                    </span>
                  );
                }

                if (!showPage) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg transition-colors ${
                      page === pageNum
                        ? "bg-brand-green text-brand-cream"
                        : "bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
