import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/ADM-P/dashboard');
}
import ProductHero from "@/components/product/ProductHero";
import ResultsSection from "@/components/product/ResultsSection";
import ReviewsSection from "@/components/product/ReviewsSection";
import FAQSection from "@/components/product/FAQSection";
import DescriptionSection from "@/components/product/DescriptionSection";
import OrderFormSection from "@/components/product/OrderFormSection";
import StickyMobileButton from "@/components/StickyMobileButton";
import WhatsAppBanner from "@/components/WhatsAppBanner";

type CheckoutSelection = {
  quantity: number;
  productName: string;
  unitPrice: number;
};

export default function Home() {
  const [checkoutSelection, setCheckoutSelection] = useState<CheckoutSelection>({
    quantity: 1,
    productName: "BijNoor Natural Hair Mask",
    unitPrice: 399,
  });
  const [quantitySyncKey, setQuantitySyncKey] = useState(0);

  const handleSelectionChange = useCallback((selection: CheckoutSelection) => {
    const safeQuantity = Math.min(5, Math.max(1, selection.quantity));
    setCheckoutSelection((prev) => {
      if (
        prev.quantity === safeQuantity &&
        prev.productName === selection.productName &&
        prev.unitPrice === selection.unitPrice
      ) {
        return prev;
      }

      return {
        quantity: safeQuantity,
        productName: selection.productName,
        unitPrice: selection.unitPrice,
      };
    });
  }, []);

  const handleBuyNow = useCallback((selection: CheckoutSelection) => {
    handleSelectionChange(selection);
    setQuantitySyncKey((prev) => prev + 1);

    window.setTimeout(() => {
      const formNode = document.getElementById("order-form");
      formNode?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, [handleSelectionChange]);

  return (
    <CartProvider>
      <Header />
      <WhatsAppBanner />
      <main className="flex flex-col pt-28 sm:pt-36">
        <ProductHero onBuyNow={handleBuyNow} onSelectionChange={handleSelectionChange} />
        <OrderFormSection
          initialQuantity={checkoutSelection.quantity}
          initialProductName={checkoutSelection.productName}
          initialUnitPrice={checkoutSelection.unitPrice}
          quantitySyncKey={quantitySyncKey}
        />
        <ReviewsSection />
        <DescriptionSection />
        <ResultsSection />
        <FAQSection />
        <StickyMobileButton />
      </main>
      <Footer />
    </CartProvider>
  );
}
