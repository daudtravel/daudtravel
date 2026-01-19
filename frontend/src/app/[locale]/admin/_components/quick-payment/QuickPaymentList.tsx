"use client";

import React, { useState } from "react";
import {
  Plus,
  Copy,
  Edit,
  Trash2,
  Power,
  Loader2,
  ExternalLink,
  CheckCircle,
  TrendingUp,
  Package,
  Globe,
  GlobeLock,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import {
  useDeleteQuickLink,
  useQuickLinks,
  useToggleQuickLink,
} from "@/src/hooks/quick-payment/useQuickPayment";

export const QuickLinksList = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [page, setPage] = useState(1);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const { data, isLoading, error } = useQuickLinks(page, 20);
  const toggleLink = useToggleQuickLink();
  const deleteLink = useDeleteQuickLink();

  const handleCreateNew = () => {
    router.push(`${pathname}?quickPayment=create`);
  };

  const handleCopyLink = (link: string, slug: string) => {
    navigator.clipboard.writeText(link);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleEdit = (slug: string) => {
    router.push(`${pathname}?quickPayment=${slug}`);
  };

  const handleToggle = async (slug: string) => {
    if (confirm("დარწმუნებული ხართ?")) {
      try {
        await toggleLink.mutateAsync(slug);
      } catch (error) {
        alert("შეცდომა სტატუსის შეცვლისას");
        console.error(error);
      }
    }
  };

  const handleDelete = async (slug: string) => {
    if (confirm("დარწმუნებული ხართ რომ გსურთ წაშლა?")) {
      try {
        await deleteLink.mutateAsync(slug);
      } catch (error) {
        alert("შეცდომა წაშლისას");
        console.error(error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        შეცდომა მონაცემების ჩატვირთვისას
      </div>
    );
  }

  const links = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mx-2 sm:mx-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            გადახდის ლინკები
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            სულ: {pagination?.total || 0} ლინკი
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => router.push(`${pathname}?quickPayment=orders`)}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex-1 sm:flex-initial"
          >
            <TrendingUp size={18} />
            <span>შეკვეთები</span>
          </button>
          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex-1 sm:flex-initial"
          >
            <Plus size={18} />
            <span>ახალი ლინკი</span>
          </button>
        </div>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">ლინკები არ მოიძებნა</p>
          <p className="text-sm mt-2">დააჭირეთ ახალი ლინკი-ს რათა შექმნათ</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    პროდუქტი
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    ფასი
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    შეკვეთები
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    ხილვადობა
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    სტატუსი
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    ლინკი
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    მოქმედებები
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {links.map((link: any) => (
                  <tr key={link.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {link.image ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_BASE_URL}${link?.image}`}
                            alt={link.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {link.name}
                          </p>
                          {link.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {link.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-lg font-semibold text-green-600">
                        ₾{link.price}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {link.paidOrdersCount} გადახდილი
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {link.showOnWebsite ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Globe size={14} />
                          საჯარო
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <GlobeLock size={14} />
                          პირადი
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {link.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          აქტიური
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                          გამორთული
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() =>
                          handleCopyLink(link.paymentLink, link.slug)
                        }
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {copiedSlug === link.slug ? (
                          <>
                            <CheckCircle size={16} />
                            <span className="text-sm">კოპირებულია!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            <span className="text-sm">/{link.slug}</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={link.paymentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="გახსნა"
                        >
                          <ExternalLink size={18} />
                        </a>
                        <button
                          onClick={() => handleToggle(link.slug)}
                          disabled={toggleLink.isPending}
                          className={`p-2 rounded-lg transition-colors ${
                            link.isActive
                              ? "text-green-600 hover:bg-green-50"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                          title={link.isActive ? "გამორთვა" : "ჩართვა"}
                        >
                          <Power size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(link.slug)}
                          disabled={deleteLink.isPending}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="წაშლა"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(link.slug)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="რედაქტირება"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {links.map((link: any) => (
              <div
                key={link.id}
                className="border rounded-lg p-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-3">
                  {link.image ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_BASE_URL}${link?.image}`}
                      alt={link.name}
                      className="w-16 h-16 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 mb-1">
                      {link.name}
                    </p>
                    {link.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                        {link.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-semibold text-green-600">
                        ₾{link.price}
                      </span>
                      {link.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          აქტიური
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                          გამორთული
                        </span>
                      )}
                      {link.showOnWebsite ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Globe size={12} />
                          საჯარო
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <GlobeLock size={12} />
                          პირადი
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-3 pb-3 border-b">
                  <button
                    onClick={() => handleCopyLink(link.paymentLink, link.slug)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors text-sm"
                  >
                    {copiedSlug === link.slug ? (
                      <>
                        <CheckCircle size={14} />
                        <span>კოპირებულია!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>/{link.slug}</span>
                      </>
                    )}
                  </button>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                    {link.paidOrdersCount} გადახდილი
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <a
                    href={link.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ExternalLink size={18} />
                  </a>
                  <button
                    onClick={() => handleToggle(link.slug)}
                    disabled={toggleLink.isPending}
                    className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                      link.isActive
                        ? "text-green-600 hover:bg-green-50"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Power size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(link.slug)}
                    disabled={deleteLink.isPending}
                    className="flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(link.slug)}
                    className="flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 sm:mt-6 pt-4 border-t">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 sm:px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                წინა
              </button>
              <span className="text-xs sm:text-sm text-gray-600">
                გვერდი {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.totalPages}
                className="px-3 sm:px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                შემდეგი
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
