import { useEffect } from 'react'

export interface HelpFaqItem {
  id: string
  question: string
  answer: string
}

const BASE_FAQ_ITEMS: HelpFaqItem[] = [
  {
    id: 'getting-started',
    question: 'How do I start exploring Stellar Nebula?',
    answer:
      'Connect your wallet, visit the Nebula route, and use the ship controls to scan sectors and discover anomalies.',
  },
  {
    id: 'wallet-required',
    question: 'Do I need a wallet to play?',
    answer:
      'You can browse the interface without a wallet, but wallet connection is required to access on-chain game actions.',
  },
]

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="help-modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="help-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Help and frequently asked questions"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="help-modal-header">
          <h2>Help Center</h2>
          <button type="button" className="help-modal-close" onClick={onClose} aria-label="Close help">
            Close
          </button>
        </header>

        <p className="help-modal-intro">
          Explore game basics and wallet guidance to get unstuck quickly.
        </p>

        <div className="help-modal-faq">
          {BASE_FAQ_ITEMS.map((item) => (
            <article key={item.id} className="help-faq-item">
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
