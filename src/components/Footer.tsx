import Link from "next/link";
import { Facebook, Instagram, Youtube, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* About */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-accent" />
              <span className="font-serif text-xl font-bold">Divine Astrology</span>
            </div>
            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              Authentic spiritual products and expert astrology consultations to guide you on your journey to wellness and enlightenment.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:text-accent" data-testid="link-facebook">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:text-accent" data-testid="link-instagram">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:text-accent" data-testid="link-youtube">
                <Youtube className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Quick Links</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/about">
                <Button variant="ghost" className="h-auto p-0 text-sm text-primary-foreground/80 hover:text-accent justify-start" data-testid="link-footer-about">
                  About Us
                </Button>
              </Link>
              <Link href="/blog">
                <Button variant="ghost" className="h-auto p-0 text-sm text-primary-foreground/80 hover:text-accent justify-start" data-testid="link-footer-blog">
                  Blog
                </Button>
              </Link>
              <Link href="/book-appointment">
                <Button variant="ghost" className="h-auto p-0 text-sm text-primary-foreground/80 hover:text-accent justify-start" data-testid="link-footer-appointment">
                  Book Consultation
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="ghost" className="h-auto p-0 text-sm text-primary-foreground/80 hover:text-accent justify-start" data-testid="link-footer-contact">
                  Contact Us
                </Button>
              </Link>
            </nav>
          </div>

          {/* Policies */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Policies</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/privacy-policy">
                <Button variant="ghost" className="h-auto p-0 text-sm text-primary-foreground/80 hover:text-accent justify-start" data-testid="link-footer-privacy">
                  Privacy Policy
                </Button>
              </Link>
              <Link href="/terms">
                <Button variant="ghost" className="h-auto p-0 text-sm text-primary-foreground/80 hover:text-accent justify-start" data-testid="link-footer-terms">
                  Terms & Conditions
                </Button>
              </Link>
              <Link href="/refund-policy">
                <Button variant="ghost" className="h-auto p-0 text-sm text-primary-foreground/80 hover:text-accent justify-start" data-testid="link-footer-refund">
                  Refund Policy
                </Button>
              </Link>
              <Link href="/shipping-policy">
                <Button variant="ghost" className="h-auto p-0 text-sm text-primary-foreground/80 hover:text-accent justify-start" data-testid="link-footer-shipping">
                  Shipping Policy
                </Button>
              </Link>
            </nav>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Stay Connected</h3>
            <p className="text-sm text-primary-foreground/80">
              Subscribe to receive updates on new products and exclusive offers.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Your email"
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                data-testid="input-newsletter-email"
              />
              <Button variant="default" className="bg-accent text-accent-foreground hover:bg-accent/90" data-testid="button-newsletter-subscribe">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} Divine Astrology. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
