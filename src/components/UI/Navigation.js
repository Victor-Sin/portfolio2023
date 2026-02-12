"use client"

import Clock from '@/components/UI/Clock/Clock'
import styles from '@/app/page.module.css'

/**
 * Composant Navigation réutilisable
 * 
 * @param {Object} props
 * @param {string} props.variant - Variante de navigation: 'home' | 'about' | 'project'
 * @param {string} props.selectedItem - Item sélectionné: 'WORK' | 'CONTACT' | 'ABOUT' | 'HOME' | 'LAB'
 * @param {Function} props.onItemClick - Callback appelé lors du clic sur un item (optionnel)
 * @param {Object} props.customStyles - Styles CSS personnalisés (optionnel)
 */
export default function Navigation({ 
  variant = 'home', 
  selectedItem = 'HOME',
  onItemClick,
  customStyles = {}
}) {
  const navItems = [
    { label: 'WORK', id: 'work' },
    { label: 'CONTACT', id: 'contact' },
    { label: 'ABOUT', id: 'about' },
    { label: 'HOME', id: 'home' },
    { label: 'LAB', id: 'lab' }
  ]

  const handleClick = (item) => {
    if (onItemClick) {
      onItemClick(item.id)
    }
  }

  const showTitle = variant === 'home'
  const showClock = variant.includes('home')

  return (
    <nav className={customStyles.nav || ''} aria-label={`${variant} navigation`}>
      {showTitle && <h3>VICTOR SIN</h3>}
      <ul className={customStyles.ul || ''}>
        {navItems.map((item) => {
          const isSelected = item.label === selectedItem
          return (
            <li key={item.id}>
              <a 
                href={`#${item.id}`} 
                className={isSelected ? (customStyles.selected || styles.selected) : ''}
                style={{textDecoration: item.id === "lab" ? "line-through" : "none"}}
                aria-current={isSelected ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  if(item.id !== "lab"){
                    handleClick(item)
                  }
                }}
              >
                {item.label}
              </a>
            </li>
          )
        })}
      </ul>
      {showClock && (
        <p className={customStyles.date || styles.date}>
          <Clock />
        </p>
      )}
    </nav>
  )
}
