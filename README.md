# PillMind - Medication Reminder App

A modern, user-friendly medication reminder application built with Next.js, TypeScript, and Tailwind CSS.

## 🏗️ Project Structure

```
PillMind/
├── app/
│   ├── layout.tsx          # Root layout with SEO metadata
│   ├── page.tsx            # Main landing page (Hero + sections)
│   └── sitemap.ts         # Next.js sitemap generation
├── components/
│   ├── ui/                 # shadcn/ui components
│   │   └── button.tsx     # Customized button with PillMind colors
│   ├── sections/           # Page sections
│   │   ├── hero.tsx       # Hero section
│   │   ├── features.tsx   # Features section
│   │   ├── how-it-works.tsx # How it works section
│   │   ├── pricing.tsx    # Pricing section
│   │   ├── faq.tsx        # FAQ section
│   │   ├── security.tsx   # Security section
│   │   ├── testimonials.tsx # Testimonials section
│   │   ├── trust.tsx      # Trust indicators section
│   │   └── index.ts       # Section exports
│   ├── shared/             # Shared components
│   │   ├── header.tsx     # Site header
│   │   ├── footer.tsx     # Site footer
│   │   ├── cta.tsx        # Call-to-action component
│   │   ├── container.tsx  # Layout container
│   │   ├── header-block.tsx # Section header component
│   │   ├── logo.tsx       # Logo component
│   │   ├── icons.tsx      # Icon components
│   │   └── index.ts       # Shared component exports
│   └── theme-provider.tsx # Theme provider
├── content/                # MDX content files
│   ├── faq.mdx           # FAQ content
│   └── terms.mdx         # Terms of service
├── lib/                   # Utility libraries
│   ├── seo.ts            # SEO utilities and metadata
│   ├── analytics.ts      # Analytics configuration
│   └── utils.ts          # General utilities
├── styles/                # Global styles
│   └── globals.css       # Global CSS with PillMind color palette
├── public/                # Static assets
│   ├── images/           # Image assets
│   └── robots.txt        # Robots.txt file

└── package.json           # Dependencies and scripts
```

## 🎨 Design System

### Color Palette
- **Primary**: `#0EA8BC` (Teal)
- **Secondary**: `#12B5C9` (Light Teal)
- **Accent**: `#2ED3B7` (Mint)
- **Background**: `#F1F5F9` (Light Gray)
- **Text**: `#0F172A` (Dark Blue)

### Typography
- **Primary Font**: Inter (Latin + Cyrillic support)
- **Monospace Font**: JetBrains Mono
- **Base Size**: 16px
- **Line Height**: 1.5

### Components
- **Buttons**: Custom variants with PillMind colors
- **Cards**: Rounded corners (16px) with subtle shadows
- **Containers**: Max-width 1200px with responsive padding

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd PillMind

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Build
```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 📱 Features

### Core Functionality
- **Medication Tracking**: Add and manage medications
- **Smart Reminders**: Customizable notification system
- **Interaction Checks**: Safety warnings for drug combinations
- **Analytics**: Track adherence and generate reports
- **Data Export**: PDF/CSV export for healthcare providers

### Technical Features
- **Responsive Design**: Mobile-first approach
- **SEO Optimized**: Meta tags, sitemap, robots.txt
- **Performance**: Optimized images and animations
- **Accessibility**: ARIA labels and keyboard navigation
- **Internationalization**: Ukrainian and English support

## 🔧 Configuration

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_GA_MEASUREMENT_ID=your-ga-id
SITE_URL=https://pillmind.app
```

### Sitemap
The project includes automatic sitemap generation using Next.js built-in sitemap generation. The sitemap is automatically available at `/sitemap.xml`.

### Analytics
Google Analytics 4 integration is included with custom event tracking for:
- Page views
- Button clicks
- Form submissions
- Scroll depth
- Downloads

## 📁 Component Architecture

### Sections
Each section is a self-contained component with:
- Framer Motion animations
- Responsive design
- Accessibility features
- SEO-friendly markup

### Shared Components
Reusable components used across multiple sections:
- **Container**: Consistent layout wrapper
- **HeaderBlock**: Section title and subtitle
- **Icons**: SVG icons with consistent styling

## 🎭 Animations

Built with Framer Motion for smooth, performant animations:
- **Entrance**: Fade-in and slide-in effects
- **Hover**: Scale and color transitions
- **Scroll**: Viewport-based animations
- **Stagger**: Sequential element animations

## 🌐 SEO & Performance

### SEO Features
- Dynamic metadata generation
- Open Graph tags
- Twitter Card support
- Structured data
- Sitemap generation
- Robots.txt configuration

### Performance Optimizations
- Image optimization
- Font optimization
- Code splitting
- Lazy loading
- Bundle analysis

## 📚 Content Management

### MDX Support
Content is managed through MDX files in the `content/` directory:
- **FAQ**: Frequently asked questions
- **Terms**: Terms of service
- **Localization**: Support for multiple languages

## 🔒 Security

### Data Protection
- GDPR compliance
- Data encryption
- Access control
- User consent management
- Data export/deletion

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@pillmind.app or create an issue in the repository.

---

Built with ❤️ for better healthcare management