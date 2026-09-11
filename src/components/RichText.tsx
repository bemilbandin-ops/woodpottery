import DOMPurify from 'dompurify'

interface RichTextProps {
  html: string
  className?: string
  inline?: boolean
}

export function RichText({ html, className, inline = false }: RichTextProps) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: inline
      ? ['b', 'strong', 'i', 'em', 'u', 'span', 'br', 'font']
      : ['p', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'b', 'strong', 'i', 'em', 'u', 'span', 'br', 'font'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'size'],
  })

  if (inline) return <span className={className} dangerouslySetInnerHTML={{ __html: clean }} />
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />
}
