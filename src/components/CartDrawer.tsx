import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, Minus, Plus, Trash2, X } from 'lucide-react'
import { formatSek } from '../lib/shop'
import type { CheckoutCustomer, Order } from '../types'
import { useShop } from '../context/ShopContext'
import { RichText } from './RichText'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

const emptyCustomer: CheckoutCustomer = {
  name: '',
  email: '',
  phone: '',
  address: '',
  postalCode: '',
  city: '',
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { snapshot, cart, text, setCartQuantity, removeFromCart, submitCheckout } = useShop()
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart')
  const [customer, setCustomer] = useState<CheckoutCustomer>(emptyCustomer)
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const lines = useMemo(
    () =>
      cart.flatMap((item) => {
        const product = snapshot.products.find((candidate) => candidate.id === item.productId)
        return product ? [{ item, product }] : []
      }),
    [cart, snapshot.products],
  )

  const subtotal = lines.reduce((sum, line) => sum + line.product.priceOre * line.item.quantity, 0)
  const shipping = subtotal >= snapshot.settings.freeShippingThresholdOre ? 0 : snapshot.settings.shippingOre
  const total = subtotal + (lines.length ? shipping : 0)

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const result = await submitCheckout(customer)
      setOrder(result.order)
      setStep('success')
      setCustomer(emptyCustomer)
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Beställningen kunde inte registreras.')
    } finally {
      setSubmitting(false)
    }
  }

  function closeAndReset() {
    onClose()
    window.setTimeout(() => {
      setStep('cart')
      setOrder(null)
      setError('')
    }, 240)
  }

  return (
    <div className={`cart-layer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <button className="cart-scrim" onClick={closeAndReset} tabIndex={open ? 0 : -1} aria-label="Stäng varukorg" />
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Varukorg">
        <header className="drawer-head">
          {step === 'checkout' ? (
            <button className="icon-button" onClick={() => setStep('cart')} aria-label="Tillbaka till varukorgen">
              <ArrowLeft size={19} />
            </button>
          ) : (
            <span className="drawer-index">{String(lines.length).padStart(2, '0')}</span>
          )}
          <h2>
            <RichText
              html={step === 'checkout' ? text('checkout.title', 'Kassa') : text('cart.title', 'Varukorg')}
              inline
            />
          </h2>
          <button className="icon-button" onClick={closeAndReset} aria-label="Stäng">
            <X size={20} />
          </button>
        </header>

        {step === 'cart' && (
          <div className="drawer-body">
            {lines.length === 0 ? (
              <div className="empty-cart">
                <span className="empty-orbit" />
                <RichText html={text('cart.empty', 'Tomt.')} />
              </div>
            ) : (
              <>
                <div className="cart-lines">
                  {lines.map(({ item, product }) => (
                    <article className="cart-line" key={product.id}>
                      <img src={product.image} alt={product.imageAlt} />
                      <div className="cart-line-main">
                        <div className="cart-line-title">
                          <strong>{product.title}</strong>
                          <span>{formatSek(product.priceOre)}</span>
                        </div>
                        <div className="quantity-row">
                          <button onClick={() => setCartQuantity(product.id, item.quantity - 1)} aria-label={`Minska antal ${product.title}`}>
                            <Minus size={14} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() => setCartQuantity(product.id, item.quantity + 1)}
                            disabled={item.quantity >= product.stock}
                            aria-label={`Öka antal ${product.title}`}
                          >
                            <Plus size={14} />
                          </button>
                          <button className="remove-line" onClick={() => removeFromCart(product.id)} aria-label={`Ta bort ${product.title}`}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="cart-summary">
                  <div><span>Varor</span><span>{formatSek(subtotal)}</span></div>
                  <div><span>Frakt</span><span>{shipping === 0 ? '0 kr' : formatSek(shipping)}</span></div>
                  <div className="cart-total"><span>Totalt</span><span>{formatSek(total)}</span></div>
                </div>

                <button className="primary-button wide" onClick={() => setStep('checkout')}>
                  <RichText html={text('cart.checkout', 'Till kassan')} inline />
                  <span aria-hidden="true">↗</span>
                </button>
              </>
            )}
          </div>
        )}

        {step === 'checkout' && (
          <form className="drawer-body checkout-form" onSubmit={handleCheckout}>
            <RichText className="checkout-note" html={text('checkout.note', 'Demokassa — ingen betalning dras.')} />
            <label>
              <span>Namn</span>
              <input required value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} autoComplete="name" />
            </label>
            <label>
              <span>E-post</span>
              <input required type="email" value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} autoComplete="email" />
            </label>
            <label>
              <span>Telefon</span>
              <input required value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} autoComplete="tel" />
            </label>
            <label className="field-span">
              <span>Adress</span>
              <input required value={customer.address} onChange={(event) => setCustomer({ ...customer, address: event.target.value })} autoComplete="street-address" />
            </label>
            <label>
              <span>Postnummer</span>
              <input required inputMode="numeric" value={customer.postalCode} onChange={(event) => setCustomer({ ...customer, postalCode: event.target.value })} autoComplete="postal-code" />
            </label>
            <label>
              <span>Ort</span>
              <input required value={customer.city} onChange={(event) => setCustomer({ ...customer, city: event.target.value })} autoComplete="address-level2" />
            </label>

            {error && <p className="form-error" role="alert">{error}</p>}

            <div className="checkout-bottom field-span">
              <div className="cart-total"><span>Totalt</span><span>{formatSek(total)}</span></div>
              <button className="primary-button wide" type="submit" disabled={submitting || lines.length === 0}>
                <RichText html={text('checkout.submit', 'Registrera beställning')} inline />
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="drawer-body success-state">
            <span className="success-mark">✓</span>
            <RichText html={text('checkout.success', 'Beställningen är registrerad lokalt.')} />
            {order && (
              <div className="order-ticket">
                <span>{order.id}</span>
                <strong>{formatSek(order.totalOre)}</strong>
              </div>
            )}
            <button className="primary-button wide" onClick={closeAndReset}>Stäng</button>
          </div>
        )}
      </aside>
    </div>
  )
}
