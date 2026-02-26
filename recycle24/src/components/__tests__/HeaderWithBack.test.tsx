import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import HeaderWithBack from '../HeaderWithBack'
import { useRouter } from 'next/navigation'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
}))

describe('HeaderWithBack', () => {
  it('renders with title', () => {
    render(<HeaderWithBack title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('calls router.back when back button is clicked without onBack prop', () => {
    const mockRouter = useRouter()
    
    render(<HeaderWithBack title="Test" />)
    const backButton = screen.getByRole('button')
    fireEvent.click(backButton)
    
    expect(mockRouter.back).toHaveBeenCalled()
  })

  it('calls onBack callback when provided', () => {
    const onBackMock = vi.fn()
    render(<HeaderWithBack title="Test" onBack={onBackMock} />)
    const backButton = screen.getByRole('button')
    fireEvent.click(backButton)
    
    expect(onBackMock).toHaveBeenCalled()
  })

  it('renders action element when provided', () => {
    const actionElement = <button>Action</button>
    render(<HeaderWithBack title="Test" action={actionElement} />)
    expect(screen.getByText('Action')).toBeInTheDocument()
  })
})
