// Interfaces
export interface Ticket {
  id: string
  subject: string
  customerName: string
  status: 'Open' | 'Closed' | 'Pending'
  priority: 'High' | 'Medium' | 'Low'
  updatedAt: string
  isRead: boolean
}

export interface Message {
  id: string
  ticketId: string
  sender: 'user' | 'agent'
  content: string
  type: 'text' | 'file'
  timestamp: string
  attachmentUrl?: string
}

// Mock Tickets Data
export const mockTickets: Ticket[] = [
  {
    id: '1',
    subject: 'Unable to process payment for order #12345',
    customerName: 'John Smith',
    status: 'Open',
    priority: 'High',
    updatedAt: '2026-01-24T10:30:00Z',
    isRead: false
  },
  {
    id: '2',
    subject: 'Request for refund on damaged product',
    customerName: 'Sarah Johnson',
    status: 'Open',
    priority: 'High',
    updatedAt: '2026-01-24T09:15:00Z',
    isRead: true
  },
  {
    id: '3',
    subject: 'How to change my account email address?',
    customerName: 'Michael Chen',
    status: 'Pending',
    priority: 'Medium',
    updatedAt: '2026-01-24T08:45:00Z',
    isRead: true
  },
  {
    id: '4',
    subject: 'Shipping delay for international order',
    customerName: 'Emma Wilson',
    status: 'Open',
    priority: 'Medium',
    updatedAt: '2026-01-23T16:20:00Z',
    isRead: false
  },
  {
    id: '5',
    subject: 'Product warranty inquiry',
    customerName: 'David Brown',
    status: 'Closed',
    priority: 'Low',
    updatedAt: '2026-01-23T14:00:00Z',
    isRead: true
  },
  {
    id: '6',
    subject: 'Account locked after multiple login attempts',
    customerName: 'Lisa Anderson',
    status: 'Open',
    priority: 'High',
    updatedAt: '2026-01-23T11:30:00Z',
    isRead: false
  },
  {
    id: '7',
    subject: 'Missing items in my order',
    customerName: 'Robert Taylor',
    status: 'Pending',
    priority: 'High',
    updatedAt: '2026-01-22T15:45:00Z',
    isRead: true
  },
  {
    id: '8',
    subject: 'Question about subscription cancellation',
    customerName: 'Jennifer Martinez',
    status: 'Closed',
    priority: 'Medium',
    updatedAt: '2026-01-22T10:00:00Z',
    isRead: true
  },
  {
    id: '9',
    subject: 'Technical issue with mobile app',
    customerName: 'William Lee',
    status: 'Open',
    priority: 'Medium',
    updatedAt: '2026-01-21T17:30:00Z',
    isRead: true
  },
  {
    id: '10',
    subject: 'Discount code not working at checkout',
    customerName: 'Amanda Garcia',
    status: 'Pending',
    priority: 'Low',
    updatedAt: '2026-01-21T09:20:00Z',
    isRead: false
  },
  {
    id: '11',
    subject: 'Request to update billing information',
    customerName: 'James Robinson',
    status: 'Closed',
    priority: 'Medium',
    updatedAt: '2026-01-20T14:15:00Z',
    isRead: true
  },
  {
    id: '12',
    subject: 'Feedback on recent customer service experience',
    customerName: 'Michelle White',
    status: 'Closed',
    priority: 'Low',
    updatedAt: '2026-01-20T08:00:00Z',
    isRead: true
  }
]

// Mock Messages Data (for ticket ID '1')
export const mockMessages: Message[] = [
  {
    id: 'm1',
    ticketId: '1',
    sender: 'user',
    content: 'Hi, I\'ve been trying to complete my purchase for order #12345 but the payment keeps failing. I\'ve tried multiple credit cards and even PayPal but nothing works. This is really frustrating!',
    type: 'text',
    timestamp: '2026-01-24T09:00:00Z'
  },
  {
    id: 'm2',
    ticketId: '1',
    sender: 'agent',
    content: 'Hello John, I\'m sorry to hear you\'re experiencing issues with your payment. I\'d be happy to help you resolve this. Could you please confirm the last 4 digits of the card you\'re trying to use?',
    type: 'text',
    timestamp: '2026-01-24T09:15:00Z'
  },
  {
    id: 'm3',
    ticketId: '1',
    sender: 'user',
    content: 'Sure, the last 4 digits are 4532. I\'ve also attached a screenshot of the error message I\'m seeing.',
    type: 'text',
    timestamp: '2026-01-24T09:20:00Z'
  },
  {
    id: 'm4',
    ticketId: '1',
    sender: 'user',
    content: 'payment_error_screenshot.png',
    type: 'file',
    timestamp: '2026-01-24T09:21:00Z',
    attachmentUrl: '/uploads/payment_error_screenshot.png'
  },
  {
    id: 'm5',
    ticketId: '1',
    sender: 'agent',
    content: 'Thank you for providing that information and the screenshot. I can see the error now. It appears there\'s a temporary hold on transactions from your region due to our fraud prevention system. Let me escalate this to our payment team to get it resolved quickly.',
    type: 'text',
    timestamp: '2026-01-24T09:30:00Z'
  },
  {
    id: 'm6',
    ticketId: '1',
    sender: 'agent',
    content: 'I\'ve contacted our payment processing team and they\'re looking into this now. You should receive an email confirmation within the next 30 minutes. Is there anything else I can help you with in the meantime?',
    type: 'text',
    timestamp: '2026-01-24T10:00:00Z'
  },
  {
    id: 'm7',
    ticketId: '1',
    sender: 'user',
    content: 'Thank you for the quick response! I\'ll wait for the email. Just one more question - will my cart items still be saved or do I need to add them again?',
    type: 'text',
    timestamp: '2026-01-24T10:15:00Z'
  },
  {
    id: 'm8',
    ticketId: '1',
    sender: 'agent',
    content: 'Great question! Your cart items are automatically saved for 7 days, so you won\'t need to add them again. Once the payment issue is resolved, you can simply proceed to checkout with all your items intact.',
    type: 'text',
    timestamp: '2026-01-24T10:30:00Z'
  }
]

// Helper function to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// API Functions
export async function getTickets(): Promise<Ticket[]> {
  await delay(500)
  return [...mockTickets]
}

export async function getTicketDetails(id: string): Promise<{ ticket: Ticket; messages: Message[] } | null> {
  await delay(500)
  
  const ticket = mockTickets.find(t => t.id === id)
  if (!ticket) {
    return null
  }

  // Return messages for the requested ticket (only ticket '1' has messages in mock)
  const messages = mockMessages.filter(m => m.ticketId === id)
  
  return {
    ticket: { ...ticket },
    messages: [...messages]
  }
}

export async function sendMessage(ticketId: string, content: string, type: 'text' | 'file' = 'text'): Promise<Message> {
  await delay(300)
  
  const newMessage: Message = {
    id: `m${Date.now()}`,
    ticketId,
    sender: 'agent',
    content,
    type,
    timestamp: new Date().toISOString()
  }
  
  // In a real app, this would persist to a database
  mockMessages.push(newMessage)
  
  return newMessage
}

export async function updateTicketStatus(id: string, status: Ticket['status']): Promise<Ticket | null> {
  await delay(300)
  
  const ticket = mockTickets.find(t => t.id === id)
  if (!ticket) {
    return null
  }
  
  ticket.status = status
  ticket.updatedAt = new Date().toISOString()
  
  return { ...ticket }
}
