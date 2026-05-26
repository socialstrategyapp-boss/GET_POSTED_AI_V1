import { Link } from 'react-router-dom'
import { Twitter, Instagram, Youtube, Github } from 'lucide-react'

export default function Footer() {
  const productLinks = [
    { label: 'Studio', path: '/studio' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Brand Profile', path: '/profile' },
    { label: 'Pricing', path: '/#pricing' },
  ]

  const resourceLinks = [
    { label: 'Help Center', path: '#' },
    { label: 'API Docs', path: '#' },
    { label: 'Blog', path: '#' },
    { label: 'Changelog', path: '#' },
  ]

  const legalLinks = [
    { label: 'Privacy Policy', path: '#' },
    { label: 'Terms of Service', path: '#' },
    { label: 'Cookie Policy', path: '#' },
  ]

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Youtube, href: '#', label: 'YouTube' },
    { icon: Github, href: '#', label: 'GitHub' },
  ]

  return (
    <footer className="bg-black border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1 — Brand */}
          <div>
            <Link to="/" className="font-bangers text-lg gradient-text tracking-wider">
              GET POSTED AI
            </Link>
            <p className="mt-4 text-sm text-[#888888] leading-relaxed">
              AI-powered social media content creation for modern brands.
            </p>
            <div className="flex items-center gap-4 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="text-[#888888] hover:text-white transition-colors duration-200"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 — Product */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="text-sm text-[#888888] hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Resources */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.path}
                    className="text-sm text-[#888888] hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.path}
                    className="text-sm text-[#888888] hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/[0.06] text-center">
          <p className="text-xs text-[#555555]">
            2025 GET POSTED AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
