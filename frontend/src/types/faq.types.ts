export interface FAQLocalization {
  id?: string;
  locale: string;
  question: string;
  answer: string;
}

export interface getFAQ {
  id: string;
  category?: string;
  localizations: FAQLocalization[];
  createdAt: string;
  updatedAt: string;
}
