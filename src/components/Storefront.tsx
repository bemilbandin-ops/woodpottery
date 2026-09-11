import { useMemo, useState } from 'react'
import { ArrowUpRight, ShoppingBag, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatSek } from '../lib/shop'
import type { Product, PublicPage } from '../types'
import { useShop } from '../context/ShopContext'
import { CartDrawer } from './CartDrawer'
import { RichText } from './RichText'

function plainText(html: string) {
  return html.replace(/<[^>]*>/g, '').trim()
}

function ProductDialog({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: () => void }) {
  const { text } = useShop()
  const stock = product.stock > 0
    ? `${plainText(text('product.stock', 'Kvar'))} ${product.stock}`
    : plainText(text('product.soldout', 'Slut'))

  return (
    <div className="product-dialog-layer" role="dialog" aria-modal="true" aria-label={product.title}>
      <button className="product-dialog-scrim" onClick={onClose} aria-label="Stäng produkt" />
      <article className="product-dialog">
        <button className="dialog-close icon-button" onClick={onClose} aria-label="Stäng"><X size={19} /></button>
        <div className="dialog-media"><img src={product.image} alt={product.imageAlt} /></div>
        <div className="dialog-copy">
          <div className="dialog-topline"><span>{product.category}</span><span>{stock}</span></div>
          <h2>{product.title}</h2>
          <strong className="dialog-price">{formatSek(product.priceOre)}</strong>
          <RichText html={product.descriptionHtml} className="product-description" />
          <RichText html={product.detailsHtml} className="product-details" />
          <button className="primary-button wide" onClick={onAdd} disabled={product.stock < 1}>
            <RichText html={product.stock < 1 ? text('product.soldout', 'Slut') : text('product.add', 'Lägg i')} inline />
            <ShoppingBag size={16} />
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
        <RichText key={block.id} html={block.html} className={`custom-block align-${block.alignment} size-${block.size}`} />
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

  const heroProduct = products.find((product) => product.featured) ?? products[0]

  function add(product: Product) {
    addToCart(product.id)
    setCartOpen(true)
  }

  return (
    <div className="site-shell shop-v2">
      <header className="site-header">
        <Link className="brand" to="/">{snapshot.settings.brandName}</Link>
        <nav>
          <a href="#objekt"><RichText html={text('nav.shop', 'Objekt')} inline /></a>
          <button className="cart-link" onClick={() => setCartOpen(true)}>
            <RichText html={text('nav.cart', 'Varukorg')} inline />
            <span className="cart-count">{cartCount}</span>
          </button>
        </nav>
      </header>

      <main>
        <section className="hero-v2">
          <div className="hero-v2-copy">
            <RichText html={text('hero.meta', 'Små upplagor · Sverige')} className="hero-v2-meta" />
            <h1><RichText html={text('hero.title', 'Trä / Keramik')} inline /></h1>
          </div>

          {heroProduct && (
            <button className="hero-v2-media" onClick={() => setSelected(heroProduct)} aria-label={`Visa ${heroProduct.title}`}>
              <img src={heroProduct.image} alt={heroProduct.imageAlt} />
            </button>
          )}

          {heroProduct && (
            <div className="hero-v2-object">
              <button onClick={() => setSelected(heroProduct)}>{heroProduct.title}</button>
              <span>{formatSek(heroProduct.priceOre)}</span>
            </div>
          )}
        </section>

        <CustomBlocks page="home" />

        <section className="catalog-v2" id="objekt">
          <div className="catalog-v2-head">
            <h2><RichText html={text('products.title', 'Tillgängligt')} inline /></h2>
            <span>{products.length}</span>
          </div>

          <div className="catalog-v2-grid">
            {products.map((product) => {
              const stock = product.stock > 0
                ? `${plainText(text('product.stock', 'Kvar'))} ${product.stock}`
                : plainText(text('product.soldout', 'Slut'))

              return (
                <article className="catalog-v2-item" key={product.id}>
                  <button className="catalog-v2-media" onClick={() => setSelected(product)} aria-label={`Visa ${product.title}`}>
                    <img src={product.image} alt={product.imageAlt} />
                  </button>

                  <div className="catalog-v2-info">
                    <button className="catalog-v2-title" onClick={() => setSelected(product)}>
                      <span>{product.title}</span>
                      <ArrowUpRight size={17} />
                    </button>
                    <span className="catalog-v2-price">{formatSek(product.priceOre)}</span>
                    <RichText html={product.descriptionHtml} className="catalog-v2-description" />
                    <div className="catalog-v2-bottom">
                      <span>{stock}</span>
                      <button onClick={() => add(product)} disabled={product.stock < 1}>
                        <RichText html={product.stock < 1 ? text('product.soldout', 'Slut') : text('product.add', 'Lägg i')} inline />
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-topline">
          <span>{snapshot.settings.brandName}</span>
          <span>{new Date().getFullYear()}</span>
        </div>
        <CustomBlocks page="footer" />
        <div className="footer-links">
          <a href={`mailto:${snapshot.settings.contactEmail}`}><RichText html={text('footer.contact', 'Kontakt')} inline /></a>
          <Link to="/villkor"><RichText html={text('footer.terms', 'Köpvillkor')} inline /></Link>
          <Link to="/integritet"><RichText html={text('footer.privacy', 'Integritet')} inline /></Link>
          {snapshot.settings.instagramUrl && <a href={snapshot.settings.instagramUrl} target="_blank" rel="noreferrer"><RichText html={text('footer.instagram', 'Instagram')} inline /></a>}
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
    <div className="legal-shell shop-v2">
      <header className="site-header">
        <Link className="brand" to="/">{snapshot.settings.brandName}</Link>
        <Link className="legal-back" to="/"><RichText html={text('legal.back', 'Tillbaka')} inline /></Link>
      </header>
      <main className="legal-main">
        <h1><RichText html={text(titleKey, page === 'terms' ? 'Köpvillkor' : 'Integritet')} inline /></h1>
        <RichText html={text(bodyKey)} className="legal-copy" />
        <CustomBlocks page={page} />
      </main>
    </div>
  )
}
