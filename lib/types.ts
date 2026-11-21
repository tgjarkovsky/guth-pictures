export type PricingPackage = {
  id?: string; // React key, optional for backward compat with existing KV data
  name: string;
  price: string;
  duration: string;
  includes: string[];
  featured?: boolean; // highlighted card ("♥ Doporučuji"); see featuredFlags in lib/package-price.ts
};
