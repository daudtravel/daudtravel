"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Loader2,
  AlertCircle,
  Package,
  User,
  Mail,
  Phone,
  Plus,
  Minus,
} from "lucide-react";

interface QuickPaymentPageProps {
  slug: string;
  locale: string;
}

interface ProductData {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  locale: string;
  availableLocales: string[];
}

export const QuickPaymentPage: React.FC<QuickPaymentPageProps> = ({
  slug,
  locale,
}) => {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({
    customerFullName: "",
    customerEmail: "",
    customerPhone: "",
  });
  const [formErrors, setFormErrors] = useState<{
    customerFullName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }>({});

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/quick-payment/links/${slug}?locale=${locale || "ka"}`
        );

        if (!response.ok) {
          throw new Error("Product not found");
        }

        const result = await response.json();

        if (result.success) {
          setProduct(result.data);
        } else {
          throw new Error(result.message || "Failed to load product");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug, locale]);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(100, prev + delta)));
  };

  const totalPrice = product ? product.price * quantity : 0;

  const validateForm = () => {
    const errors: typeof formErrors = {};

    if (!formData.customerFullName.trim()) {
      errors.customerFullName = "სახელი სავალდებულოა";
    }

    if (!formData.customerEmail.trim()) {
      errors.customerEmail = "ელ.ფოსტა სავალდებულოა";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      errors.customerEmail = "გთხოვთ შეიყვანოთ სწორი ელ.ფოსტა";
    }

    if (
      formData.customerPhone.trim() &&
      !/^[\d\s\+\-\(\)]+$/.test(formData.customerPhone)
    ) {
      errors.customerPhone = "გთხოვთ შეიყვანოთ სწორი ტელეფონის ნომერი";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setPaying(true);

    try {
      const payload: any = {
        customerFullName: formData.customerFullName.trim(),
        customerEmail: formData.customerEmail.trim(),
        locale: locale || "ka",
        quantity: quantity,
      };

      if (formData.customerPhone.trim()) {
        payload.customerPhone = formData.customerPhone.trim();
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/quick-payment/links/${slug}/pay`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Payment initialization failed");
      }

      const result = await response.json();

      if (result.success && result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (err) {
      alert("შეცდომა გადახდის დაწყებისას");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">იტვირთება...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">შეცდომა</h2>
          <p className="text-gray-600 mb-6">
            {error || "პროდუქტი ვერ მოიძებნა"}
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            მთავარ გვერდზე დაბრუნება
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-white text-center">
            <Package className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold">გადახდა</h1>
          </div>

          <div className="p-8">
            {product.image && (
              <div className="mb-6">
                <img
                  src={`${process.env.NEXT_PUBLIC_BASE_URL}${product.image}`}
                  alt={product.name}
                  className="w-full h-64 object-cover rounded-xl"
                />
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                {product.name}
              </h2>
              {product.description && (
                <p className="text-gray-600 mb-4">{product.description}</p>
              )}

              {/* Unit Price */}
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium">
                  ერთეულის ფასი:
                </span>
                <span className="text-xl font-semibold text-gray-800">
                  ₾{product.price.toFixed(2)}
                </span>
              </div>

              {/* Quantity Selector */}
              <div className="py-4 border-b border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  რაოდენობა
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="w-12 h-12 rounded-xl bg-orange-100 hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-5 h-5 text-orange-600" />
                  </button>

                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.max(
                          1,
                          Math.min(100, parseInt(e.target.value) || 1)
                        )
                      )
                    }
                    min="1"
                    max="100"
                    className="flex-1 max-w-[120px] text-center text-2xl font-bold py-3 px-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                  />

                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= 100}
                    className="w-12 h-12 rounded-xl bg-orange-100 hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-5 h-5 text-orange-600" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  მაქსიმუმ 100 ერთეული
                </p>
              </div>

              {/* Total Price */}
              <div className="flex items-center justify-between pt-4">
                <div>
                  <span className="text-gray-600 font-medium text-lg block">
                    ჯამური თანხა:
                  </span>
                  <span className="text-sm text-gray-500">
                    ₾{product.price.toFixed(2)} × {quantity}{" "}
                    {quantity === 1 ? "ერთეული" : "ერთეული"}
                  </span>
                </div>
                <span className="text-4xl font-bold text-orange-500">
                  ₾{totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handlePay} className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 font-medium">
                  📋 გთხოვთ შეავსოთ საკონტაქტო ინფორმაცია
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  სრული სახელი <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.customerFullName}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        customerFullName: e.target.value,
                      });
                      setFormErrors({
                        ...formErrors,
                        customerFullName: undefined,
                      });
                    }}
                    placeholder="მაგ: გიორგი ბერიძე"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      formErrors.customerFullName
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    disabled={paying}
                  />
                </div>
                {formErrors.customerFullName && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.customerFullName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ელ.ფოსტა <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        customerEmail: e.target.value,
                      });
                      setFormErrors({
                        ...formErrors,
                        customerEmail: undefined,
                      });
                    }}
                    placeholder="მაგ: example@mail.com"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      formErrors.customerEmail
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    disabled={paying}
                  />
                </div>
                {formErrors.customerEmail && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.customerEmail}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ტელეფონის ნომერი{" "}
                  <span className="text-gray-400 text-xs font-normal">
                    (არასავალდებულო)
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        customerPhone: e.target.value,
                      });
                      setFormErrors({
                        ...formErrors,
                        customerPhone: undefined,
                      });
                    }}
                    placeholder="მაგ: +995 555 123 456"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      formErrors.customerPhone
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    disabled={paying}
                  />
                </div>
                {formErrors.customerPhone && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.customerPhone}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={paying}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-5 rounded-xl font-bold text-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 mt-6"
              >
                {paying ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    მიმდინარეობს...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-6 h-6" />
                    გადახდა - ₾{totalPrice.toFixed(2)}
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                🔒 უსაფრთხო გადახდა Bank of Georgia-ს საშუალებით
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-800">
            გადახდის შემდეგ დაბრუნდებით დადასტურების გვერდზე
          </p>
        </div>
      </div>
    </div>
  );
};
