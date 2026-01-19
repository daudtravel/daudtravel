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
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  if (!settings?.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            დაზღვევის სერვისი დროებით მიუწვდომელია
          </h2>
          <p className="text-gray-600 text-sm">
            გთხოვთ სცადოთ მოგვიანებით ან დაგვიკავშირდეთ
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 py-6 sm:py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-3">
            <Shield className="w-6 h-6 text-orange-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            სამოგზაურო დაზღვევა
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            შეავსეთ ფორმა და მიიღეთ დაზღვევა სწრაფად და მარტივად
          </p>
        </div>

        {/* Price Info */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-md p-4 sm:p-5 mb-6 text-white">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-orange-100 text-xs mb-1">ფასი/პირი</p>
              <p className="text-xl sm:text-2xl font-bold">₾{pricePerPerson}</p>
            </div>
            <div>
              <p className="text-orange-100 text-xs mb-1">რაოდენობა</p>
              <p className="text-xl sm:text-2xl font-bold">{people.length}</p>
            </div>
            <div>
              <p className="text-orange-100 text-xs mb-1">სულ</p>
              <p className="text-2xl sm:text-3xl font-bold">
                ₾{totalPrice.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Submitter Email */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
            <label className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-2">
              <Mail className="w-4 h-4 text-orange-600" />
              თქვენი ელ.ფოსტა
            </label>
            <input
              type="email"
              value={submitterEmail}
              onChange={(e) => setSubmitterEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="example@email.com"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              ამ ელ.ფოსტაზე მიიღებთ დადასტურებას და დაზღვევის დოკუმენტებს
            </p>
          </div>

          {/* People Forms */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" />
                დასაზღვევი პირები
              </h2>
              <button
                type="button"
                onClick={addPerson}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all shadow-sm"
              >
                <Plus size={16} />
                დამატება
              </button>
            </div>

            {people.map((person, index) => (
              <div
                key={person.id}
                className="bg-white rounded-xl shadow-sm p-4 sm:p-5 relative border border-gray-100"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-800">
                    პირი #{index + 1}
                  </h3>
                  {people.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePerson(person.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                      <User className="w-3.5 h-3.5" />
                      სრული სახელი *
                    </label>
                    <input
                      type="text"
                      value={person.fullName}
                      onChange={(e) =>
                        updatePerson(person.id, "fullName", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="მაგ: გიორგი გელაშვილი"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      ტელეფონის ნომერი *
                    </label>
                    <input
                      type="tel"
                      value={person.phoneNumber}
                      onChange={(e) =>
                        updatePerson(person.id, "phoneNumber", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="+995 555 12 34 56"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    პასპორტის ფოტო *
                  </label>

                  {person.passportPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={person.passportPreview}
                        alt="პასპორტი"
                        className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(person.id)}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 sm:h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-600 font-medium">
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
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
            <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-100 rounded-lg mb-4">
              <CheckCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-orange-900">
                <p className="font-semibold mb-1">რას მოიცავს დაზღვევა:</p>
                <ul className="list-disc list-inside space-y-0.5 text-orange-800">
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
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-sm font-semibold"
            >
              {submitInsurance.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>მიმდინარეობს...</span>
                </>
              ) : (
                <>
                  <Shield size={18} />
                  <span>გადასვლა გადახდაზე - ₾{totalPrice.toFixed(2)}</span>
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
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
