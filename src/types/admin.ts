export interface Company {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

export interface CompanyCreate {
  name: string;
  slug: string;
}

export interface CompanyUpdate {
  name?: string;
  slug?: string;
  is_active?: boolean;
}