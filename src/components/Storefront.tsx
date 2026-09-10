import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUpRight, ShoppingBag, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatSek } from '../lib/shop'
import type { Product, PublicPage } from '../types'
import { useShop } from '../context/ShopContext'
import { CartDrawer } from './CartDrawer'
import { RichText } from './RichText'

function ProductDialog({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: () => void }) {
  const { text } = useShop()
  return (
    <div className="product-dialog-layer" role="dialog" aria-modal="true" aria-label={product.title}>
      <button className="product-dialog-scrim" onClick={onClose} aria-label="Stäng produkt" />
      <article className="product-dialog">
        <button className="dialog-close icon-button" onClick={onClose} aria-label="Stäng"><X size={20} /></button>
        <div className="dialog-media"><img src={product.image} alt={product.imageAlt} /></div>
        <div className="dialog-copy">
          <span className="product-kicker">{product.category}</span>
          <h2>{product.title}</h2>
          <strong className="dialog-price">{formatSek(product.priceOre)}</strong>
          <RichText html={product.descriptionHtml} className="product-description" />
          <RichText html={product.detailsHtml} className="product-details" />
          <div className="dialog-stock">
            {product.stock > 0 ? `${text('product.stock', 'Kvar').replace(/<[^>]*>/g, '')}: ${product.stock}` : text('product.soldout', 'Slut').replace(/<[^>]*>/g, '')}
          </div>
          <button className="primary-button wide" onClick={onAdd} disabled={product.stock < 1}>
            <RichText html={product.stock < 1 ? text('product.soldout', 'Slut') : text('product.add', 'Lägg i')} inline />
            <ShoppingBag size={17} />
          </button>
        </div>
      </article>
    </div>
  )
}

function CustomBlocks({ page }: { page: PublicPage }) {
  const { snapshot } = useShop()
  const blocks = snapshot.customBlocks
    .filter((block) => block.page === page && block.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  if (!blocks.length) return null
  return (
    <section className="custom-blocks">
      {blocks.map((block) => (
        <RichText
          key={block.id}
          html={block.html}
          className={`custom-block align-${block.alignment} size-${block.size}`}
        />
      ))}
    </section>
  )
}

export function Storefront() {
  const { snapshot, cartCount, text, addToCart } = useShop()
  const [cartOpen, setCartOpen] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)

  const products = useMemo(
    () => snapshot.products.filter((product) => product.visible).sort((a, b) => a.sortOrder - b.sortOrder),
    [snapshot.products],
  )
  const featured = products.filter((product) => product.featured).slice(0, 2)
  const heroA = featured[0] ?? products[0]
  const heroB = featured[1] ?? products[1] ?? products[0]

  function add(product: Product) {
    addToCart(product.id)
    setCartOpen(true)
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand" to="/">{snapshot.settings.brandName}</Link>
        <nav>
          <a href="#objekt"><RichText html={text('nav.shop', 'Objekt')} inline /></a>
          <button className="cart-link" onClick={() => setCartOpen(true)}>
            <RichText html={text('nav.cart', 'Varukorg')} inline />
            <span className="cart-count">{String(cartCount).padStart(2, '0')}</span>
          </button>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-type">
            <RichText html={text('hero.title', 'Trä / Keramik')} />
          </div>
          {heroA && <div className="hero-object hero-object-a"><img src={heroA.image} alt="" /></div>}
          {heroB && <div className="hero-object hero-object-b"><img src={heroB.image} alt="" /></div>}
          <div className="hero-bottom">
            <RichText html={text('hero.meta', 'Små upplagor · Sverige')} className="hero-meta" />
            <a className="hero-action" href="#objekt">
              <RichText html={text('hero.action', 'Se objekt')} inline />
              <ArrowDown size={17} />
            </a>
          </div>
        </section>

        <CustomBlocks page="home" />

        <section className="products-section" id="objekt">
          <div className="section-head">
            <span className="section-number">01</span>
            <h2><RichText html={text('products.title', 'Tillgängligt')} inline /></h2>
            <span className="section-count">{String(products.length).padStart(2, '0')}</span>
          </div>

          <div className="product-list">
            {products.map((product, index) => (
              <article className={`product-row ${index % 2 ? 'is-reversed' : ''}`} key={product.id}>
                <button className="product-media" onClick={() => setSelected(product)} aria-label={`Visa ${product.title}`}>
                  <img src={product.image} alt={product.imageAlt} />
                  <span className="media-index">{String(index + 1).padStart(2, '0')}</span>
                </button>
                <div className="product-copy">
                  <div className="product-meta">
                    <span>{product.category}</span>
                    <span>{product.stock > 0 ? `${text('product.stock', 'Kvar').replace(/<[^>]*>/g, '')} ${product.stock}` : text('product.soldout', 'Slut').replace(/<[^>]*>/g, '')}</span>
                  </div>
                  <button className="product-title-button" onClick={() => setSelected(product)}>
                    <h3>{product.title}</h3>
                    <ArrowUpRight size={24} />
                  </button>
                  <RichText html={product.descriptionHtml} className="product-description" />
                  <div className="product-buyline">
                    <strong>{formatSek(product.priceOre)}</strong>
                    <button className="add-button" onClick={() => add(product)} disabled={product.stock < 1}>
                      <RichText html={product.stock < 1 ? text('product.soldout', 'Slut') : text('product.add', 'Lägg i')} inline />
                      <span>+</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand">{snapshot.settings.brandName}</div>
        <CustomBlocks page="footer" />
        <div className="footer-links">
          <a href={`mailto:${snapshot.settings.contactEmail}`}><RichText html={text('footer.contact', 'Kontakt')} inline /></a>
          <Link to="/villkor"><RichText html={text('footer.terms', 'Köpvillkor')} inline /></Link>
          <Link to="/integritet"><RichText html={text('footer.privacy', 'Integritet')} inline /></Link>
          {snapshot.settings.instagramUrl && <a href={snapshot.settings.instagramUrl} target="_blank" rel="noreferrer">Instagram ↗</a>}
        </div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      {selected && (
        <ProductDialog
          product={selected}
          onClose={() => setSelected(null)}
          onAdd={() => {
            add(selected)
            setSelected(null)
          }}
        />
      )}
    </div>
  )
}

export function LegalPage({ page }: { page: 'terms' | 'privacy' }) {
  const { snapshot, text } = useShop()
  const titleKey = page === 'terms' ? 'terms.title' : 'privacy.title'
  const bodyKey = page === 'terms' ? 'terms.body' : 'privacy.body'
  return (
    <div className="legal-shell">
      <header className="site-header">
        <Link className="brand" to="/">{snapshot.settings.brandName}</Link>
        <Link className="legal-back" to="/">Tillbaka ↙</Link>
      </header>
      <main className="legal-main">
        <span className="section-number">02</span>
        <h1><RichText html={text(titleKey, page === 'terms' ? 'Köpvillkor' : 'Integritet')} inline /></h1>
        <RichText html={text(bodyKey)} className="legal-copy" />
        <CustomBlocks page={page} />
      </main>
    </div>
  )
}
