import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Link } from 'react-router-dom';
import {
  Shield,
  Phone,
  Mail,
  MapPin,
  Share2,
  Users,
  Globe,
  Car,
  Home,
  Briefcase,
  Heart,
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#020810] border-t border-[#0a1525] px-4 py-6">

      {/* ── Desktop grid ────────────────────────────────────────────────── */}
      <div
        className="mx-auto max-w-7xl grid gap-3 hidden lg:grid"
        style={{
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'auto auto',
        }}
      >
        {/* Brand block */}
        <div
          className="rounded-2xl p-8 flex flex-col justify-center"
          style={{ gridColumn: 'span 2', gridRow: 'span 2' }}
        >
          <span className="text-4xl font-semibold tracking-tight text-white leading-tight">
            Hanover Insurance
          </span>
        </div>

        {/* Products */}
        <div className="bg-[#060f1e] border border-[#0a1525] rounded-2xl p-5 space-y-3">
          <p className="text-xs font-medium text-blue-200 uppercase tracking-widest">Products</p>
          <ul className="space-y-2">
            <li>
              <Link to="/insurance/home" className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors group">
                <Home className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />Home Insurance
              </Link>
            </li>
            <li>
              <Link to="/insurance/auto" className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors group">
                <Car className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />Auto Insurance
              </Link>
            </li>
            <li>
              <Link to="/insurance/business" className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors group">
                <Briefcase className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />Business Insurance
              </Link>
            </li>
            <li>
              <Link to="/insurance/life" className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors group">
                <Heart className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />Life Insurance
              </Link>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div className="bg-[#060f1e] border border-[#0a1525] rounded-2xl p-5 space-y-3">
          <p className="text-xs font-medium text-blue-200 uppercase tracking-widest">Company</p>
          <ul className="space-y-2">
            <li><Link to="/about" className="text-sm text-white/80 hover:text-white transition-colors">About Us</Link></li>
            <li><Link to="/careers" className="text-sm text-white/80 hover:text-white transition-colors">Careers</Link></li>
            <li><Link to="/newsroom" className="text-sm text-white/80 hover:text-white transition-colors">Newsroom</Link></li>
            <li><Link to="/investors" className="text-sm text-white/80 hover:text-white transition-colors">Investors</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="bg-[#060f1e] border border-[#0a1525] rounded-2xl p-5 space-y-3">
          <p className="text-xs font-medium text-blue-200 uppercase tracking-widest">Contact</p>
          <ul className="space-y-3">
            <li>
              <a href="tel:18006266601" className="flex items-start gap-2 text-sm text-white/80 hover:text-white transition-colors">
                <Phone className="h-3.5 w-3.5 mt-0.5 text-white shrink-0" strokeWidth={1.5} />1-800-626-6601
              </a>
            </li>
            <li>
              <a href="mailto:support@hanover.com" className="flex items-start gap-2 text-sm text-white/80 hover:text-white transition-colors">
                <Mail className="h-3.5 w-3.5 mt-0.5 text-white shrink-0" strokeWidth={1.5} />support@hanover.com
              </a>
            </li>
            <li>
              <span className="flex items-start gap-2 text-sm text-white/60">
                <MapPin className="h-3.5 w-3.5 mt-0.5 text-white shrink-0" strokeWidth={1.5} />440 Lincoln St, Worcester, MA
              </span>
            </li>
          </ul>
        </div>

        {/* Social + copyright */}
        <div className="bg-[#060f1e] border border-[#0a1525] rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <p className="text-xs font-medium text-blue-200 uppercase tracking-widest">Follow Us</p>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/40 active:bg-white/20 transition-colors" aria-label="Twitter" asChild>
                    <a href="https://twitter.com" target="_blank" rel="noreferrer"><Share2 className="h-3.5 w-3.5" strokeWidth={1.5} /></a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Twitter</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/40 active:bg-white/20 transition-colors" aria-label="LinkedIn" asChild>
                    <a href="https://linkedin.com" target="_blank" rel="noreferrer"><Users className="h-3.5 w-3.5" strokeWidth={1.5} /></a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>LinkedIn</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/40 active:bg-white/20 transition-colors" aria-label="Facebook" asChild>
                    <a href="https://facebook.com" target="_blank" rel="noreferrer"><Globe className="h-3.5 w-3.5" strokeWidth={1.5} /></a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Facebook</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="space-y-2">
            <Separator className="bg-white/10" />
            <p className="text-xs text-white/50">© {new Date().getFullYear()} Hanover Insurance Group</p>
            <div className="flex gap-3">
              <Link to="/privacy" className="text-xs text-white/50 hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="text-xs text-white/50 hover:text-white transition-colors">Terms</Link>
              <Link to="/accessibility" className="text-xs text-white/50 hover:text-white transition-colors">Accessibility</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile / tablet accordion ────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl lg:hidden space-y-6">

        {/* Brand */}
        <div className="flex items-center gap-2 px-1">
          <Shield className="h-6 w-6 text-white shrink-0" strokeWidth={1.25} />
          <span className="text-xl font-semibold tracking-tight text-white">Hanover Insurance</span>
        </div>

        {/* Accordion */}
        <Accordion type="multiple" className="space-y-2">
          <AccordionItem value="products" className="bg-[#060f1e] border border-[#0a1525] rounded-2xl px-5 overflow-hidden">
            <AccordionTrigger className="text-xs font-medium text-blue-200 uppercase tracking-widest hover:no-underline py-4">
              Products
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-2">
              <Link to="/insurance/home" className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors">
                <Home className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />Home Insurance
              </Link>
              <Link to="/insurance/auto" className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors">
                <Car className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />Auto Insurance
              </Link>
              <Link to="/insurance/business" className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors">
                <Briefcase className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />Business Insurance
              </Link>
              <Link to="/insurance/life" className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors">
                <Heart className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />Life Insurance
              </Link>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="company" className="bg-[#060f1e] border border-[#0a1525] rounded-2xl px-5 overflow-hidden">
            <AccordionTrigger className="text-xs font-medium text-blue-200 uppercase tracking-widest hover:no-underline py-4">
              Company
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-2">
              <Link to="/about" className="block text-sm text-white/80 hover:text-white transition-colors">About Us</Link>
              <Link to="/careers" className="block text-sm text-white/80 hover:text-white transition-colors">Careers</Link>
              <Link to="/newsroom" className="block text-sm text-white/80 hover:text-white transition-colors">Newsroom</Link>
              <Link to="/investors" className="block text-sm text-white/80 hover:text-white transition-colors">Investors</Link>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="contact" className="bg-[#060f1e] border border-[#0a1525] rounded-2xl px-5 overflow-hidden">
            <AccordionTrigger className="text-xs font-medium text-blue-200 uppercase tracking-widest hover:no-underline py-4">
              Contact
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3">
              <a href="tel:18006266601" className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors">
                <Phone className="h-3.5 w-3.5 text-white shrink-0" strokeWidth={1.5} />1-800-626-6601
              </a>
              <a href="mailto:support@hanover.com" className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors">
                <Mail className="h-3.5 w-3.5 text-white shrink-0" strokeWidth={1.5} />support@hanover.com
              </a>
              <span className="flex items-center gap-2 text-sm text-white/60">
                <MapPin className="h-3.5 w-3.5 text-white shrink-0" strokeWidth={1.5} />440 Lincoln St, Worcester, MA
              </span>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Copyright + socials */}
        <div className="space-y-3 px-1">
          <Separator className="bg-white/10" />
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/50">© {new Date().getFullYear()} Hanover Insurance Group</p>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/40 active:bg-white/20 transition-colors" aria-label="Twitter" asChild>
                <a href="https://twitter.com" target="_blank" rel="noreferrer"><Share2 className="h-3 w-3" strokeWidth={1.5} /></a>
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/40 active:bg-white/20 transition-colors" aria-label="LinkedIn" asChild>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer"><Users className="h-3 w-3" strokeWidth={1.5} /></a>
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/40 active:bg-white/20 transition-colors" aria-label="Facebook" asChild>
                <a href="https://facebook.com" target="_blank" rel="noreferrer"><Globe className="h-3 w-3" strokeWidth={1.5} /></a>
              </Button>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/privacy" className="text-xs text-white/50 hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="text-xs text-white/50 hover:text-white transition-colors">Terms</Link>
            <Link to="/accessibility" className="text-xs text-white/50 hover:text-white transition-colors">Accessibility</Link>
          </div>
        </div>
      </div>

    </footer>
  );
}