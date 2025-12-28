import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, X, Sparkles, Phone, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/authContext";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export function Navigation() {
  const router = useRouter();
  const location = router.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin, signOut, loading } = useAuth();

  if (loading) {
    return <header className="sticky top-0 z-50 w-full border-b bg-card/95 h-16" />;
  }

  const productCategories = [
    { name: "Gemstones", href: "/products/gemstones", description: "Certified natural gemstones" },
    { name: "Bracelets", href: "/products/bracelets", description: "Healing crystal bracelets" },
    { name: "Rudraksha", href: "/products/rudraksha", description: "Authentic Rudraksha beads" },
    { name: "Yantras", href: "/products/yantras", description: "Sacred geometric yantras" },
    { name: "Rings", href: "/products/rings", description: "Astrological gemstone rings" },
    { name: "Remedies", href: "/products/remedies", description: "Spiritual remedy products" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-2 cursor-pointer hover-elevate active-elevate-2 rounded-md px-2 -ml-2 py-1">
              <span className="font-serif text-xl font-bold text-foreground">VedicIntution</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/about">
              <Button variant="ghost" size="sm" data-testid="link-about" className={location === "/about" ? "bg-accent/10" : ""}>
                About Us
              </Button>
            </Link>

            <div className="group relative">
              <Button variant="ghost" size="sm" className="text-sm font-medium" data-testid="button-consultation-menu">
                Book a Consultation Now
              </Button>

              <div className="absolute left-0 mt-0 w-56 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2 space-y-1">
                  <div className="group/item relative">
                    <Link href="/book-appointment?service=horoscope-single">
                      <div className="px-4 py-2 text-sm hover:bg-accent/10 rounded cursor-pointer flex items-center justify-between group-hover/item:text-accent" data-testid="link-consultation-horoscope">
                        <span>Horoscope Analysis</span>
                        <span className="text-xs">›</span>
                      </div>
                    </Link>
                    <div className="absolute left-full top-0 ml-1 w-56 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200">
                      <div className="p-2 space-y-1">
                        <Link href="/book-appointment?service=horoscope-single">
                          <div className="px-4 py-2 text-sm text-foreground/80 hover:bg-accent/10 hover:text-accent rounded cursor-pointer">Written Maha Consultation Report</div>
                        </Link>
                        <Link href="/book-appointment?service=horoscope-complete">
                          <div className="px-4 py-2 text-sm text-foreground/80 hover:bg-accent/10 hover:text-accent rounded cursor-pointer">Complete Consultation</div>
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="group/item relative">
                    <div className="px-4 py-2 text-sm hover:bg-accent/10 rounded cursor-pointer flex items-center justify-between group-hover/item:text-accent" data-testid="link-consultation-matchmaking">
                      <span>Match Making Consultation</span>
                      <span className="text-xs">›</span>
                    </div>
                    <div className="absolute left-full top-0 ml-1 w-56 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200">
                      <div className="p-2 space-y-1">
                        <Link href="/book-appointment?service=matchmaking">
                          <div className="px-4 py-2 text-sm text-foreground/80 hover:bg-accent/10 hover:text-accent rounded cursor-pointer">Match Making</div>
                        </Link>
                        <Link href="/book-appointment?service=matchmaking">
                          <div className="px-4 py-2 text-sm text-foreground/80 hover:bg-accent/10 hover:text-accent rounded cursor-pointer">Love marriage guidance</div>
                        </Link>
                        <Link href="/book-appointment?service=muhurta">
                          <div className="px-4 py-2 text-sm text-foreground/80 hover:bg-accent/10 hover:text-accent rounded cursor-pointer">Marriage Timing & Muhurta</div>
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="group/item relative">
                    <div className="px-4 py-2 text-sm hover:bg-accent/10 rounded cursor-pointer flex items-center justify-between group-hover/item:text-accent" data-testid="link-consultation-gemstones">
                      <span>Gemstones Consultation</span>
                      <span className="text-xs">›</span>
                    </div>
                    <div className="absolute left-full top-0 ml-1 w-56 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200">
                      <div className="p-2 space-y-1">
                        <Link href="/book-appointment?service=gemstones">
                          <div className="px-4 py-2 text-sm text-foreground/80 hover:bg-accent/10 hover:text-accent rounded cursor-pointer">Gemstone Recommendations</div>
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="group/item relative">
                    <div className="px-4 py-2 text-sm hover:bg-accent/10 rounded cursor-pointer flex items-center justify-between group-hover/item:text-accent" data-testid="link-consultation-mahavasatu">
                      <span>Maha Vastu Consultation</span>
                      <span className="text-xs">›</span>
                    </div>
                    <div className="absolute left-full top-0 ml-1 w-56 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200">
                      <div className="p-2 space-y-1">
                        <Link href="/book-appointment?service=varshaphal">
                          <div className="px-4 py-2 text-sm text-foreground/80 hover:bg-accent/10 hover:text-accent rounded cursor-pointer">Maha Consultation</div>
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="group/item relative">
                    <div className="px-4 py-2 text-sm hover:bg-accent/10 rounded cursor-pointer flex items-center justify-between group-hover/item:text-accent" data-testid="link-consultation-childbirth">
                      <span>Childbirth Consultation Service</span>
                      <span className="text-xs">›</span>
                    </div>
                    <div className="absolute left-full top-0 ml-1 w-56 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200">
                      <div className="p-2 space-y-1">
                        <Link href="/book-appointment?service=childbirth">
                          <div className="px-4 py-2 text-sm text-foreground/80 hover:bg-accent/10 hover:text-accent rounded cursor-pointer">Childbirth Consultation Service</div>
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="group/item relative">
                    <div className="px-4 py-2 text-sm hover:bg-accent/10 rounded cursor-pointer flex items-center justify-between group-hover/item:text-accent" data-testid="link-consultation-birthtime">
                      <span>Birth Time Rectification</span>
                      <span className="text-xs">›</span>
                    </div>
                    <div className="absolute left-full top-0 ml-1 w-56 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200">
                      <div className="p-2 space-y-1">
                        <Link href="/book-appointment?service=birthtime">
                          <div className="px-4 py-2 text-sm text-foreground/80 hover:bg-accent/10 hover:text-accent rounded cursor-pointer">Birth Time Rectification</div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-medium" data-testid="button-products-menu">
                    Products
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[600px] gap-3 p-6 md:grid-cols-2">
                      {productCategories.map((category) => (
                        <Link key={category.href} href={category.href}>
                          <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover-elevate active-elevate-2" data-testid={`link-category-${category.name.toLowerCase()}`}>
                            <div className="text-sm font-medium leading-none">{category.name}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {category.description}
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <Link href="/blog">
              <Button variant="ghost" size="sm" data-testid="link-blog" className={location === "/blog" ? "bg-accent/10" : ""}>
                Blogs
              </Button>
            </Link>

            <Link href="/videos">
              <Button variant="ghost" size="sm" data-testid="link-videos" className={location === "/videos" ? "bg-accent/10" : ""}>
                Videos
              </Button>
            </Link>

            <Link href="/contact">
              <Button variant="ghost" size="sm" data-testid="link-contact" className={location === "/contact" ? "bg-accent/10" : ""}>
                Contact Us
              </Button>
            </Link>
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden lg:flex" data-testid="button-phone">
              <Phone className="h-5 w-5" />
            </Button>


            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/profile">
                  <Button variant="ghost" size="icon" data-testid="button-profile">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut()}
                  data-testid="button-logout"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" data-testid="button-login">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" data-testid="button-signup">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <div className="space-y-1">
                    <Link href="/about">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-about">
                        About Us
                      </Button>
                    </Link>
                  </div>

                  <div className="border-t pt-4 space-y-1">
                    <p className="text-sm font-semibold text-muted-foreground px-2">Book a Consultation</p>
                    <Link href="/book-appointment?type=horoscope">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-consultation-horoscope">
                        Horoscope Analysis
                      </Button>
                    </Link>
                    <Link href="/book-appointment?type=matchmaking">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-consultation-matchmaking">
                        Match Making Consultation
                      </Button>
                    </Link>
                    <Link href="/book-appointment?type=gemstones">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-consultation-gemstones">
                        Gemstones Consultation
                      </Button>
                    </Link>
                    <Link href="/book-appointment?type=mahavasatu">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-consultation-mahavasatu">
                        Maha Vastu Consultation
                      </Button>
                    </Link>
                    <Link href="/book-appointment?type=childbirth">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-consultation-childbirth">
                        Childbirth Consultation Service
                      </Button>
                    </Link>
                    <Link href="/book-appointment?type=birthtime">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-consultation-birthtime">
                        Birth Time Rectification
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground px-2">Products</p>
                    {productCategories.map((category) => (
                      <Link key={category.href} href={category.href}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => setMobileMenuOpen(false)}
                          data-testid={`link-mobile-${category.name.toLowerCase()}`}
                        >
                          {category.name}
                        </Button>
                      </Link>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-1">
                    <Link href="/blog">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-blog">
                        Blogs
                      </Button>
                    </Link>
                    <Link href="/videos">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-videos">
                        Videos
                      </Button>
                    </Link>
                    <Link href="/contact">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-contact">
                        Contact Us
                      </Button>
                    </Link>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    {user ? (
                      <>
                        <Link href="/profile">
                          <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-profile">
                            <User className="w-4 h-4 mr-2" />
                            Profile
                          </Button>
                        </Link>
                        {isAdmin && (
                          <Link href="/admin">
                            <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-admin">
                              Admin Dashboard
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            signOut();
                            setMobileMenuOpen(false);
                          }}
                          data-testid="button-mobile-logout"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link href="/login">
                          <Button variant="outline" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-login">
                            Login
                          </Button>
                        </Link>
                        <Link href="/signup">
                          <Button className="w-full justify-start" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-signup">
                            Sign Up
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
