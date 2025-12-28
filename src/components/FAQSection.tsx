import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQSection() {
  const faqs = [
    {
      question: "Are all your gemstones certified?",
      answer: "Yes, all our gemstones come with authentic certification from recognized gemological laboratories. Each product includes detailed information about its origin, quality, and astrological properties."
    },
    {
      question: "How do I know which gemstone is right for me?",
      answer: "Our expert astrologers provide personalized consultations to recommend the perfect gemstone based on your birth chart, planetary positions, and specific life goals. You can book a consultation through our website."
    },
    {
      question: "What is your return and refund policy?",
      answer: "We offer a 7-day return policy for all products. If you're not satisfied with your purchase, you can return it in its original condition for a full refund. Custom-made items may have different terms."
    },
    {
      question: "How long does shipping take?",
      answer: "We typically ship orders within 1-2 business days. Delivery usually takes 3-7 business days depending on your location. We provide tracking information for all orders."
    },
    {
      question: "Do you offer astrology consultations?",
      answer: "Yes, we offer comprehensive astrology consultations with experienced astrologers. Sessions can be booked online and conducted via video call at your convenience."
    },
    {
      question: "How should I care for my gemstone?",
      answer: "Each gemstone comes with specific care instructions. Generally, avoid exposure to harsh chemicals, extreme temperatures, and direct sunlight. Clean regularly with a soft cloth and store separately to prevent scratches."
    }
  ];

  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`} data-testid={`faq-item-${index}`}>
          <AccordionTrigger className="text-left text-base font-semibold" data-testid={`faq-question-${index}`}>
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed" data-testid={`faq-answer-${index}`}>
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
