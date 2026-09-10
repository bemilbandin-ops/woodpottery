import DOMPurify from 'dompurify'
import {
  Archive,
  ArrowLeft,
  Boxes,
  FileText,
  ImagePlus,
  LogOut,
  PackagePlus,
  Plus,
  Save,
  Settings,
  ShoppingBag,
  Trash2,
} from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { DEMO_ADMIN, localDemoAuthAdapter } from '../adapters/auth'
import { useShop } from '../context/ShopContext'
import { formatSek, makeId, slugify } from '../lib/shop'
import type { ContentEntry, CustomBlock, Product, PublicPage, ShopSettings } from '../types'
import { RichTextEditor } from './RichTextEditor'

const allowedTags = ['p', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'b', 'strong', 'i', 'em', 'u', 'span', 'br', 'font']
const allowedAttrs = ['href', 'target', 'rel', 'style', 'size']

function cleanRich(html: string) {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: allowedTags, ALLOWED_ATTR: allowedAttrs })
}

function newProduct(sortOrder: number): Product {
  const id = makeId('produkt')
  return {
    id,
    slug: id,
    title: 'Nytt objekt',
    category: 'keramik',
    priceOre: 0,
    stock: 1,
    visible: true,
    featured: false,
    descriptionHtml: '',
    detailsHtml: '',
    image: '/assets/vessel.svg',
    imageAlt: '',
    sortOrder,
  }
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function compressImage(file: File): Promise<string> {
  if (file.type === 'image/svg+xml' || typeof createImageBitmap === 'undefined') return readFile(file)
  try {
    const bitmap = await createImageBitmap(file)
    const max = 1600
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas saknas')
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    return canvas.toDataURL('image/webp', 0.84)
  } catch {
    return readFile(file)
  }
}

function ContentRow({ entry }: { entry: ContentEntry }) {
  const { repository, refresh } = useShop()
  const [draft, setDraft] = useState(entry.html)
  const [saved, setSaved] = useState(false)

  function save() {
    repository.upsertContent({ ...entry, html: cleanRich(draft) })
    refresh()
    setSaved(true)
    window.setTimeout(() => setSaved(false), 900)
  }

  return (
    <article className="admin-content-row">
      <div className="admin-content-meta">
        <strong>{entry.label}</strong>
        <code>{entry.key}</code>
      </div>
      <RichTextEditor value={draft} onChange={setDraft} minHeight={64} />
      <div className="admin-row-actions">
        <button className="ghost-button" onClick={() => setDraft('')}>Töm</button>
        <button className="admin-save" onClick={save}><Save size={15} /> {saved ? 'Sparad' : 'Spara'}</button>
      </div>
    </article>
  )
}

function LoginGate({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState(DEMO_ADMIN.user)
  const [passphrase, setPassphrase] = useState(DEMO_ADMIN.passphrase)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await localDemoAuthAdapter.login(user, passphrase)
      onLogin()
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Inloggningen misslyckades.')
    }
  }

  return (
    <main className="admin-login-shell">
      <Link className="admin-back" to="/"><ArrowLeft size={16} /> Butik</Link>
      <form className="admin-login" onSubmit={submit}>
        <span className="admin-mark">RÅ / ADM</span>
        <h1>Admin</h1>
        <p>Lokalt demoläge. Byt <code>AuthAdapter</code> innan publicering.</p>
        <label><span>Användare</span><input value={user} onChange={(event) => setUser(event.target.value)} autoComplete="username" /></label>
        <label><span>Lösenord</span><input type="password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} autoComplete="current-password" /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button wide" type="submit">Logga in <span>→</span></button>
        <small>Demo: {DEMO_ADMIN.user} / {DEMO_ADMIN.passphrase}</small>
      </form>
    </main>
  )
}

export function Admin() {
  const { snapshot, repository, refresh } = useShop()
  const [loggedIn, setLoggedIn] = useState(() => Boolean(localDemoAuthAdapter.getSession()))
  const [tab, setTab] = useState<'products' | 'content' | 'settings' | 'orders'>('products')
  const [editing, setEditing] = useState<Product | null>(null)
  const [productError, setProductError] = useState('')
  const [settingsDraft, setSettingsDraft] = useState<ShopSettings>(snapshot.settings)
  const [blockDraft, setBlockDraft] = useState<CustomBlock | null>(null)

  const products = useMemo(() => [...snapshot.products].sort((a, b) => a.sortOrder - b.sortOrder), [snapshot.products])
  const content = useMemo(() => [...snapshot.content].sort((a, b) => a.sortOrder - b.sortOrder), [snapshot.content])
  const blocks = useMemo(() => [...snapshot.customBlocks].sort((a, b) => a.sortOrder - b.sortOrder), [snapshot.customBlocks])

  if (!loggedIn) return <LoginGate onLogin={() => setLoggedIn(true)} />

  async function logout() {
    await localDemoAuthAdapter.logout()
    setLoggedIn(false)
  }

  function saveProduct(event: FormEvent) {
    event.preventDefault()
    if (!editing) return
    setProductError('')
    try {
      repository.upsertProduct({
        ...editing,
        title: editing.title.trim(),
        slug: editing.slug.trim() || slugify(editing.title),
        stock: Math.max(0, Math.floor(editing.stock)),
        priceOre: Math.max(0, Math.round(editing.priceOre)),
        sortOrder: Math.floor(editing.sortOrder),
        descriptionHtml: cleanRich(editing.descriptionHtml),
        detailsHtml: cleanRich(editing.detailsHtml),
      })
      refresh()
      setEditing(null)
    } catch (error) {
      setProductError(error instanceof Error ? error.message : 'Kunde inte spara. Bilden kan vara för stor för lokal lagring.')
    }
  }

  async function handleImage(file?: File) {
    if (!file || !editing) return
    setProductError('')
    try {
      const image = await compressImage(file)
      setEditing({ ...editing, image })
    } catch {
      setProductError('Bilden kunde inte läsas.')
    }
  }

  function removeProduct(product: Product) {
    if (!window.confirm(`Ta bort ${product.title}?`)) return
    repository.deleteProduct(product.id)
    refresh()
    if (editing?.id === product.id) setEditing(null)
  }

  function saveSettings(event: FormEvent) {
    event.preventDefault()
    repository.updateSettings({
      ...settingsDraft,
      shippingOre: Math.max(0, Math.round(settingsDraft.shippingOre)),
      freeShippingThresholdOre: Math.max(0, Math.round(settingsDraft.freeShippingThresholdOre)),
    })
    refresh()
  }

  function saveBlock() {
    if (!blockDraft) return
    repository.upsertCustomBlock({ ...blockDraft, html: cleanRich(blockDraft.html), sortOrder: Math.floor(blockDraft.sortOrder) })
    refresh()
    setBlockDraft(null)
  }

  function resetDemo() {
    if (!window.confirm('Återställ produkter, texter, inställningar och demoorder?')) return
    repository.reset()
    refresh()
    setSettingsDraft(repository.snapshot().settings)
    setEditing(null)
    setBlockDraft(null)
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <span className="admin-mark">RÅ / ADM</span>
          <Link to="/" className="admin-store-link">Öppna butik ↗</Link>
        </div>
        <nav className="admin-nav">
          <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}><Boxes size={17} />Produkter</button>
          <button className={tab === 'content' ? 'active' : ''} onClick={() => setTab('content')}><FileText size={17} />Texter</button>
          <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}><Settings size={17} />Inställningar</button>
          <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}><ShoppingBag size={17} />Beställningar <span>{snapshot.orders.length}</span></button>
        </nav>
        <div className="admin-sidebar-bottom">
          <button onClick={resetDemo}><Archive size={16} />Återställ demo</button>
          <button onClick={logout}><LogOut size={16} />Logga ut</button>
        </div>
      </aside>

      <main className="admin-main">
        {tab === 'products' && (
          <section className="admin-section">
            <header className="admin-section-head">
              <div><span>01</span><h1>Produkter</h1></div>
              <button className="admin-save" onClick={() => setEditing(newProduct(products.length + 1))}><PackagePlus size={16} />Ny produkt</button>
            </header>

            <div className="admin-product-list">
              {products.map((product) => (
                <article className="admin-product-row" key={product.id}>
                  <img src={product.image} alt="" />
                  <div className="admin-product-primary"><strong>{product.title}</strong><span>{product.category}</span></div>
                  <span>{formatSek(product.priceOre)}</span>
                  <span>Lager {product.stock}</span>
                  <span className={`status-dot ${product.visible ? 'on' : ''}`}>{product.visible ? 'Synlig' : 'Dold'}</span>
                  <button className="ghost-button" onClick={() => setEditing({ ...product })}>Redigera</button>
                  <button className="icon-button danger" onClick={() => removeProduct(product)} aria-label={`Ta bort ${product.title}`}><Trash2 size={16} /></button>
                </article>
              ))}
            </div>

            {editing && (
              <form className="product-editor" onSubmit={saveProduct}>
                <div className="editor-heading"><div><span>{editing.id.startsWith('produkt-') ? 'Ny' : 'Redigera'}</span><h2>{editing.title}</h2></div><button type="button" className="ghost-button" onClick={() => setEditing(null)}>Stäng</button></div>
                <div className="editor-grid">
                  <label><span>Titel</span><input value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value, slug: editing.slug.startsWith('produkt-') ? slugify(event.target.value) : editing.slug })} /></label>
                  <label><span>Slug</span><input value={editing.slug} onChange={(event) => setEditing({ ...editing, slug: slugify(event.target.value) })} /></label>
                  <label><span>Kategori</span><select value={editing.category} onChange={(event) => setEditing({ ...editing, category: event.target.value as Product['category'] })}><option value="keramik">Keramik</option><option value="trä">Trä</option></select></label>
                  <label><span>Pris (kr)</span><input type="number" min="0" step="1" value={editing.priceOre / 100} onChange={(event) => setEditing({ ...editing, priceOre: Number(event.target.value) * 100 })} /></label>
                  <label><span>Lager</span><input type="number" min="0" step="1" value={editing.stock} onChange={(event) => setEditing({ ...editing, stock: Number(event.target.value) })} /></label>
                  <label><span>Ordning</span><input type="number" step="1" value={editing.sortOrder} onChange={(event) => setEditing({ ...editing, sortOrder: Number(event.target.value) })} /></label>
                  <label className="check-field"><input type="checkbox" checked={editing.visible} onChange={(event) => setEditing({ ...editing, visible: event.target.checked })} /><span>Synlig</span></label>
                  <label className="check-field"><input type="checkbox" checked={editing.featured} onChange={(event) => setEditing({ ...editing, featured: event.target.checked })} /><span>Hero-bild</span></label>
                </div>

                <div className="image-editor">
                  <div className="image-preview"><img src={editing.image} alt="" /></div>
                  <div className="image-fields">
                    <label><span>Bild-URL</span><input value={editing.image} onChange={(event) => setEditing({ ...editing, image: event.target.value })} /></label>
                    <label><span>Alt-text</span><input value={editing.imageAlt} onChange={(event) => setEditing({ ...editing, imageAlt: event.target.value })} /></label>
                    <label className="upload-button"><ImagePlus size={17} /><span>Välj bild</span><input type="file" accept="image/*" onChange={(event) => void handleImage(event.target.files?.[0])} /></label>
                    <small>Uppladdade rasterbilder skalas ned till max 1600 px och sparas lokalt i demot.</small>
                  </div>
                </div>

                <div className="editor-rich-grid">
                  <label><span>Kort beskrivning</span><RichTextEditor value={editing.descriptionHtml} onChange={(descriptionHtml) => setEditing({ ...editing, descriptionHtml })} /></label>
                  <label><span>Detaljer</span><RichTextEditor value={editing.detailsHtml} onChange={(detailsHtml) => setEditing({ ...editing, detailsHtml })} /></label>
                </div>
                {productError && <p className="form-error">{productError}</p>}
                <div className="editor-actions"><button className="primary-button" type="submit"><Save size={16} />Spara produkt</button></div>
              </form>
            )}
          </section>
        )}

        {tab === 'content' && (
          <section className="admin-section">
            <header className="admin-section-head"><div><span>02</span><h1>Texter</h1></div></header>
            <div className="admin-subhead"><div><h2>Fasta texter</h2><p>All publik gränssnittstext. Töm ett fält för att dölja texten.</p></div></div>
            <div className="admin-content-list">{content.map((entry) => <ContentRow key={entry.id} entry={entry} />)}</div>

            <div className="admin-subhead blocks-head">
              <div><h2>Egna textblock</h2><p>Lägg till fri text på startsida, sidfot eller informationssidor.</p></div>
              <button className="admin-save" onClick={() => setBlockDraft({ id: makeId('text'), page: 'home', html: 'Ny text', alignment: 'left', size: 'normal', visible: true, sortOrder: blocks.length + 1 })}><Plus size={16} />Nytt textblock</button>
            </div>
            <div className="custom-admin-list">
              {blocks.map((block) => (
                <article className="custom-admin-row" key={block.id}>
                  <div><strong>{block.page}</strong><span>{block.size} · {block.alignment}</span></div>
                  <button className="ghost-button" onClick={() => setBlockDraft({ ...block })}>Redigera</button>
                  <button className="icon-button danger" onClick={() => { repository.deleteCustomBlock(block.id); refresh() }}><Trash2 size={16} /></button>
                </article>
              ))}
            </div>

            {blockDraft && (
              <div className="block-editor">
                <div className="editor-heading"><h2>Textblock</h2><button className="ghost-button" onClick={() => setBlockDraft(null)}>Stäng</button></div>
                <div className="editor-grid">
                  <label><span>Sida</span><select value={blockDraft.page} onChange={(event) => setBlockDraft({ ...blockDraft, page: event.target.value as PublicPage })}><option value="home">Startsida</option><option value="footer">Sidfot</option><option value="terms">Köpvillkor</option><option value="privacy">Integritet</option></select></label>
                  <label><span>Justering</span><select value={blockDraft.alignment} onChange={(event) => setBlockDraft({ ...blockDraft, alignment: event.target.value as CustomBlock['alignment'] })}><option value="left">Vänster</option><option value="center">Centrerad</option><option value="right">Höger</option></select></label>
                  <label><span>Storlek</span><select value={blockDraft.size} onChange={(event) => setBlockDraft({ ...blockDraft, size: event.target.value as CustomBlock['size'] })}><option value="small">Liten</option><option value="normal">Normal</option><option value="large">Stor</option><option value="display">Display</option></select></label>
                  <label><span>Ordning</span><input type="number" value={blockDraft.sortOrder} onChange={(event) => setBlockDraft({ ...blockDraft, sortOrder: Number(event.target.value) })} /></label>
                  <label className="check-field"><input type="checkbox" checked={blockDraft.visible} onChange={(event) => setBlockDraft({ ...blockDraft, visible: event.target.checked })} /><span>Synlig</span></label>
                </div>
                <RichTextEditor value={blockDraft.html} onChange={(html) => setBlockDraft({ ...blockDraft, html })} minHeight={150} />
                <div className="editor-actions"><button className="primary-button" onClick={saveBlock}><Save size={16} />Spara textblock</button></div>
              </div>
            )}
          </section>
        )}

        {tab === 'settings' && (
          <section className="admin-section">
            <header className="admin-section-head"><div><span>03</span><h1>Inställningar</h1></div></header>
            <form className="settings-form" onSubmit={saveSettings}>
              <label><span>Butiksnamn</span><input value={settingsDraft.brandName} onChange={(event) => setSettingsDraft({ ...settingsDraft, brandName: event.target.value })} /></label>
              <label><span>Kontakt-e-post</span><input type="email" value={settingsDraft.contactEmail} onChange={(event) => setSettingsDraft({ ...settingsDraft, contactEmail: event.target.value })} /></label>
              <label><span>Instagram-URL</span><input value={settingsDraft.instagramUrl} onChange={(event) => setSettingsDraft({ ...settingsDraft, instagramUrl: event.target.value })} /></label>
              <label><span>Frakt (kr)</span><input type="number" min="0" value={settingsDraft.shippingOre / 100} onChange={(event) => setSettingsDraft({ ...settingsDraft, shippingOre: Number(event.target.value) * 100 })} /></label>
              <label><span>Fri frakt från (kr)</span><input type="number" min="0" value={settingsDraft.freeShippingThresholdOre / 100} onChange={(event) => setSettingsDraft({ ...settingsDraft, freeShippingThresholdOre: Number(event.target.value) * 100 })} /></label>
              <div className="editor-actions"><button className="primary-button" type="submit"><Save size={16} />Spara inställningar</button></div>
            </form>
            <div className="adapter-note"><strong>Backend-byte</strong><p>Butiken använder <code>ShopRepository</code>, <code>AuthAdapter</code> och <code>CheckoutAdapter</code>. Ersätt lokala implementationer med API/Supabase/annan backend utan att ändra adminformulären.</p></div>
          </section>
        )}

        {tab === 'orders' && (
          <section className="admin-section">
            <header className="admin-section-head"><div><span>04</span><h1>Beställningar</h1></div></header>
            {snapshot.orders.length === 0 ? <div className="admin-empty">Inga demoorder.</div> : (
              <div className="order-list">
                {snapshot.orders.map((order) => (
                  <article className="admin-order" key={order.id}>
                    <header><div><strong>{order.id}</strong><span>{new Date(order.createdAt).toLocaleString('sv-SE')}</span></div><strong>{formatSek(order.totalOre)}</strong></header>
                    <div className="order-customer"><span>{order.customer.name}</span><span>{order.customer.email}</span><span>{order.customer.phone}</span><span>{order.customer.address}, {order.customer.postalCode} {order.customer.city}</span></div>
                    <div className="order-lines">{order.lines.map((line) => <div key={line.productId}><span>{line.quantity} × {line.title}</span><span>{formatSek(line.unitPriceOre * line.quantity)}</span></div>)}</div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
