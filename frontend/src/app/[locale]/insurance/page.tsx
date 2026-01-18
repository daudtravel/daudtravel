// app/[locale]/insurance/page.tsx

"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Upload,
  X,
  Loader2,
  Shield,
  Users,
  CheckCircle,
  Mail,
  User,
  Phone,
  Image as ImageIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useInsuranceSettings,
  useSubmitInsurance,
} from "@/src/hooks/insurance/useInsurance";

interface PersonForm {
  id: string;
  fullName: string;
  phoneNumber: string;
  passportPhoto: string | null;
  passportPreview: string | null;
}

export default function InsuranceSubmissionPage() {
  const router = useRouter();
  const { data: settingsData, isLoading: settingsLoading } =
    useInsuranceSettings();
  const submitInsurance = useSubmitInsurance();

  const [submitterEmail, setSubmitterEmail] = useState("");
  const [people, setPeople] = useState<PersonForm[]>([
    {
      id: crypto.randomUUID(),
      fullName: "",
      phoneNumber: "",
      passportPhoto: null,
      passportPreview: null,
    },
  ]);

  const settings = settingsData?.data;
  const pricePerPerson = settings?.pricePerPerson || 0;
  const totalPrice = people.length * pricePerPerson;

  const addPerson = () => {
    setPeople([
      ...people,
      {
        id: crypto.randomUUID(),
        fullName: "",
        phoneNumber: "",
        passportPhoto: null,
        passportPreview: null,
      },
    ]);
  };

  const removePerson = (id: string) => {
    if (people.length === 1) {
      alert("უნდა იყოს მინიმუმ 1 ადამიანი");
      return;
    }
    setPeople(people.filter((p) => p.id !== id));
  };

  const updatePerson = (id: string, field: string, value: any) => {
    setPeople(people.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleImageUpload = (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("გთხოვთ აირჩიოთ სურათი");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("სურათი ძალიან დიდია (მაქსიმუმ 5MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPeople(
        people.map((p) =>
          p.id === id
            ? { ...p, passportPhoto: base64, passportPreview: base64 }
            : p
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (id: string) => {
    setPeople(
      people.map((p) =>
        p.id === id ? { ...p, passportPhoto: null, passportPreview: null } : p
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!submitterEmail) {
      alert("გთხოვთ შეიყვანოთ თქვენი ელ.ფოსტა");
      return;
    }

    const invalidPerson = people.find(
      (p) => !p.fullName || !p.phoneNumber || !p.passportPhoto
    );

    if (invalidPerson) {
      alert("გთხოვთ შეავსოთ ყველა ველი ყველა ადამიანისთვის");
      return;
    }

    try {
      const result = await submitInsurance.mutateAsync({
        submitterEmail,
        people: people.map((p) => ({
          fullName: p.fullName,
          phoneNumber: p.phoneNumber,
          passportPhoto: p.passportPhoto!,
        })),
      });

      // Redirect to payment
      if (result.data.paymentUrl) {
        window.location.href = result.data.paymentUrl;
      }
    } catch (error: any) {
      console.error("Error submitting:", error);
      alert(
        error.response?.data?.message ||
          "შეცდომა დაზღვევის შეკვეთის გაგზავნისას"
      );
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  if (!settings?.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            დაზღვევის სერვისი დროებით მიუწვდომელია
          </h2>
          <p className="text-gray-600">
            გთხოვთ სცადოთ მოგვიანებით ან დაგვიკავშირდეთ
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            სამოგზაურო დაზღვევა
          </h1>
          <p className="text-gray-600 text-lg">
            შეავსეთ ფორმა და მიიღეთ დაზღვევა სწრაფად და მარტივად
          </p>
        </div>

        {/* Price Info */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-6 mb-8 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-blue-100 text-sm mb-1">ფასი თითო ადამიანზე</p>
              <p className="text-3xl font-bold">₾{pricePerPerson}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm mb-1">
                ადამიანების რაოდენობა
              </p>
              <p className="text-3xl font-bold">{people.length}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm mb-1">სულ თანხა</p>
              <p className="text-4xl font-bold">₾{totalPrice.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Submitter Email */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <label className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
              <Mail className="w-5 h-5 text-blue-600" />
              თქვენი ელ.ფოსტა
            </label>
            <input
              type="email"
              value={submitterEmail}
              onChange={(e) => setSubmitterEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="example@email.com"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              ამ ელ.ფოსტაზე მიიღებთ დადასტურებას და დაზღვევის დოკუმენტებს
            </p>
          </div>

          {/* People Forms */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                დასაზღვევი პირები
              </h2>
              <button
                type="button"
                onClick={addPerson}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                პირის დამატება
              </button>
            </div>

            {people.map((person, index) => (
              <div
                key={person.id}
                className="bg-white rounded-2xl shadow-md p-6 relative"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    პირი #{index + 1}
                  </h3>
                  {people.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePerson(person.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4" />
                      სრული სახელი *
                    </label>
                    <input
                      type="text"
                      value={person.fullName}
                      onChange={(e) =>
                        updatePerson(person.id, "fullName", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="მაგ: გიორგი გელაშვილი"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4" />
                      ტელეფონის ნომერი *
                    </label>
                    <input
                      type="tel"
                      value={person.phoneNumber}
                      onChange={(e) =>
                        updatePerson(person.id, "phoneNumber", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+995 555 12 34 56"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <ImageIcon className="w-4 h-4" />
                    პასპორტის ფოტო *
                  </label>

                  {person.passportPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={person.passportPreview}
                        alt="პასპორტი"
                        className="w-48 h-48 object-cover rounded-lg border-2 border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(person.id)}
                        className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 font-medium">
                        ატვირთეთ პასპორტის ფოტო
                      </p>
                      <p className="text-xs text-gray-500 mt-1">მაქსიმუმ 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(person.id, e)}
                        className="hidden"
                        required
                      />
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">რას მოიცავს დაზღვევა:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>სამედიცინო ხარჯების დაფარვა</li>
                  <li>ბარგის დაკარგვის კომპენსაცია</li>
                  <li>24/7 დახმარების სერვისი</li>
                  <li>საერთაშორისო დაფარვა</li>
                </ul>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitInsurance.isPending}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl text-lg font-semibold"
            >
              {submitInsurance.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>მიმდინარეობს დამუშავება...</span>
                </>
              ) : (
                <>
                  <Shield size={24} />
                  <span>გადასვლა გადახდაზე - ₾{totalPrice.toFixed(2)}</span>
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              გადახდის შემდეგ მიიღებთ დადასტურებას ელ.ფოსტაზე.
              <br />
              დაზღვევის დოკუმენტები გამოგეგზავნებათ 24-48 საათში.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
