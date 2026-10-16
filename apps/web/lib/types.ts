export type Item = {
  id: number;
  name: string;
  created_at: string;
};

export type Case = {
  id: number;
  slug: string;
  company: string;
  title: string;
  authority: string;
  jurisdiction: string;
  year: number;
  category: string;
  outcome: string;
  amount: number | null;
  currency: string | null;
  amount_label: string;
  status: string | null;
  summary: string;
};

export type Source = {
  case_id: number;
  label: string;
  url: string;
};
