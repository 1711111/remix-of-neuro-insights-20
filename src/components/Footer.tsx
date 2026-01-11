import { useEffect, useRef } from "react";
import { Leaf, Heart, Github, Twitter, Instagram } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Footer = () => {
  const footerRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Brand section animation
      gsap.fromTo(
        brandRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Links section animation
      gsap.fromTo(
        linksRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Resources section animation
      gsap.fromTo(
        resourcesRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Social icons stagger animation
      if (socialRef.current) {
        const icons = socialRef.current.querySelectorAll(".social-icon");
        gsap.fromTo(
          icons,
          { scale: 0, rotation: -180 },
          {
            scale: 1,
            rotation: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: footerRef.current,
              start: "top 90%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      // Bottom bar slide up
      gsap.fromTo(
        bottomRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay: 0.3,
          ease: "power3.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Floating leaf animation
      gsap.to(".footer-leaf-icon", {
        y: -5,
        rotation: 5,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Heart beat animation
      gsap.to(".footer-heart", {
        scale: 1.2,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
      });

    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="bg-card border-t border-border py-16 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div ref={brandRef} className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                <Leaf className="footer-leaf-icon w-6 h-6 text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-foreground transition-colors duration-300 group-hover:text-primary">
                Green<span className="text-primary">Quest</span>
              </span>
            </div>
            <p className="text-muted-foreground max-w-md mb-6">
              Turning everyday eco-friendly actions into a rewarding journey. 
              Join thousands of students and communities making a real difference for our planet.
            </p>
            <div ref={socialRef} className="flex gap-4">
              <a 
                href="#" 
                className="social-icon w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground
                           transition-all duration-300 hover:bg-primary hover:text-white hover:scale-110 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/25"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="social-icon w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground
                           transition-all duration-300 hover:bg-gradient-to-br hover:from-pink-500 hover:to-orange-400 hover:text-white hover:scale-110 hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-500/25"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="social-icon w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground
                           transition-all duration-300 hover:bg-foreground hover:text-background hover:scale-110 hover:-translate-y-1 hover:shadow-lg hover:shadow-foreground/25"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div ref={linksRef}>
            <h4 className="font-heading font-semibold text-lg mb-4 text-foreground">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <a href="#how-it-works" className="footer-link text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-2 inline-block relative group">
                  <span className="relative z-10">How It Works</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
              <li>
                <a href="#rewards" className="footer-link text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-2 inline-block relative group">
                  <span className="relative z-10">Rewards</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
              <li>
                <a href="#challenges" className="footer-link text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-2 inline-block relative group">
                  <span className="relative z-10">Challenges</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
              <li>
                <a href="#teams" className="footer-link text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-2 inline-block relative group">
                  <span className="relative z-10">Teams</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div ref={resourcesRef}>
            <h4 className="font-heading font-semibold text-lg mb-4 text-foreground">Resources</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="footer-link text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-2 inline-block relative group">
                  <span className="relative z-10">For Schools</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
              <li>
                <a href="#" className="footer-link text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-2 inline-block relative group">
                  <span className="relative z-10">For Communities</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
              <li>
                <a href="#" className="footer-link text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-2 inline-block relative group">
                  <span className="relative z-10">Privacy Policy</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
              <li>
                <a href="#" className="footer-link text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-2 inline-block relative group">
                  <span className="relative z-10">Terms of Service</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div ref={bottomRef} className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © 2025 GreenQuest. All rights reserved.
          </p>
          <p className="text-muted-foreground text-sm flex items-center gap-1">
            Made with <Heart className="footer-heart w-4 h-4 text-destructive fill-destructive" /> for our planet
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
