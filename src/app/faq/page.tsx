"use client";
import { useState } from "react";
import { Search, ChevronDown, MessageCircleQuestion } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const FAQ_DATA = [
  {
    category: "Orders",
    items: [
      { q: "How do I place an order?", a: "Simply browse our categories, select your preferred sizes, colors, and variants, add the item to your cart, and proceed to checkout securely via Paystack." },
      { q: "Can I modify my order?", a: "Once an order is placed, it is immediately processed to the factory. However, if you contact us within 12 hours of placing the order, we may be able to make modifications." },
      { q: "How do I know if my order was confirmed?", a: "You will receive an email confirmation, and the order will appear in your Account Dashboard under 'My Orders'." }
    ]
  },
  {
    category: "Shipping",
    items: [
      { q: "Where does ICONJ deliver?", a: "We deliver nationwide across Nigeria directly from the factory." },
      { q: "How long does delivery take?", a: "Delivery typically takes 7-14 working days, depending on whether the product is a standard size or requires custom manufacturing." },
      { q: "Will I receive a tracking number?", a: "Yes, you can track your order status directly from our 'Track Order' page using your Order ID." }
    ]
  },
  {
    category: "Returns & Issues",
    items: [
      { q: "How do I report a damaged product?", a: "Use our 'Report an Issue' form located in the footer or in your account dashboard. Provide clear photos of the damage and packaging." },
      { q: "How do replacements work?", a: "Our supplier guarantees that if an item is damaged or missing parts, they will either resend the parts or remake the item entirely based on the situation." },
      { q: "Can customized products be returned?", a: "For hygiene and safety reasons, certain baby products cannot be returned if they have been opened or used, unless they arrived defective. They are only eligible for replacement if defective or damaged." }
    ]
  }
];

function AccordionItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-200">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex w-full items-center justify-between py-4 text-left font-medium text-slate-900 hover:text-blue-600 transition-colors"
      >
        <span>{question}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="pb-4 text-slate-600 leading-relaxed pr-8">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [search, setSearch] = useState("");
  
  const filteredData = FAQ_DATA.map(section => {
    return {
      category: section.category,
      items: section.items.filter(item => 
        item.q.toLowerCase().includes(search.toLowerCase()) || 
        item.a.toLowerCase().includes(search.toLowerCase())
      )
    };
  }).filter(section => section.items.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircleQuestion className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Frequently Asked Questions</h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">Have a question? We're here to help. Search through our FAQs below or contact our support team.</p>
          
          <div className="mt-8 relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <Input 
              placeholder="Search for answers (e.g. 'tracking', 'returns')" 
              className="pl-12 h-12 text-base rounded-full border-slate-300 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border p-6 md:p-10">
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-4">We couldn't find any answers matching "{search}".</p>
              <Link href="/contact" className="text-blue-600 font-bold hover:underline">Contact Support</Link>
            </div>
          ) : (
            <div className="space-y-10">
              {filteredData.map((section, idx) => (
                <div key={idx}>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">{section.category}</h2>
                  <div className="border-t border-slate-200">
                    {section.items.map((item, i) => (
                      <AccordionItem key={i} question={item.q} answer={item.a} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

