import { NavLink } from 'react-router-dom'

interface MobileMenuItem {
  label: string
  to: string
}

interface MobileMenuProps {
  isOpen: boolean
  items: MobileMenuItem[]
  onClose: () => void
}

export function MobileMenu({ isOpen, items, onClose }: MobileMenuProps) {
  return (
    <div className={`mobile-menu-root ${isOpen ? 'is-open' : ''}`}>
      <button
        type="button"
        className="mobile-menu-overlay"
        aria-label="Close mobile menu"
        onClick={onClose}
      />

      <aside className="mobile-menu-panel" aria-label="Mobile navigation menu">
        <div className="mobile-menu-header">
          <span>Menu</span>
          <button type="button" className="mobile-menu-close" onClick={onClose}>
            Close
          </button>
        </div>

        <nav className="mobile-menu-links">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'mobile-menu-link mobile-menu-link-active' : 'mobile-menu-link'
              }
              end={item.to === '/'}
              onClick={onClose}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>
  )
}
