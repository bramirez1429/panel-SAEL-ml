import { PricingCalculator } from "@/modules/pricing-calculator/presentation/pricing-calculator.client";

export const metadata = {
  title: "Calculadora de Mercado Libre y Tiendanube | SAEL",
  description: "Precios y márgenes de SAEL según costos, promociones, cuotas y envíos.",
};

export default function CalculadoraPreciosPage() {
  return <PricingCalculator />;
}
