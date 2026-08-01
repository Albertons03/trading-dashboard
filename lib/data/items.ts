export interface Item {
  id: string
  title: string
  description: string
  image: string
  price: number
  category: string
  details: string
}

export const mockItems: Item[] = [
  {
    id: '1',
    title: 'Laptop Pro Max',
    description: 'High-performance laptop for professionals',
    image: 'https://picsum.photos/400/300?random=1',
    price: 1299,
    category: 'Electronics',
    details: 'Latest generation processor, 16GB RAM, 512GB SSD, stunning display.',
  },
  {
    id: '2',
    title: 'Wireless Headphones',
    description: 'Premium sound quality with noise cancellation',
    image: 'https://picsum.photos/400/300?random=2',
    price: 199,
    category: 'Audio',
    details: 'Active noise cancellation, 30-hour battery, premium materials.',
  },
  {
    id: '3',
    title: 'Mechanical Keyboard',
    description: 'RGB keyboard with tactile switches',
    image: 'https://picsum.photos/400/300?random=3',
    price: 149,
    category: 'Peripherals',
    details: 'Cherry MX switches, aluminum frame, programmable keys.',
  },
  {
    id: '4',
    title: '4K Monitor',
    description: 'Ultra-high resolution display',
    image: 'https://picsum.photos/400/300?random=4',
    price: 599,
    category: 'Displays',
    details: '4K resolution, HDR support, USB-C connectivity.',
  },
  {
    id: '5',
    title: 'Gaming Mouse',
    description: 'Precision mouse for gaming',
    image: 'https://picsum.photos/400/300?random=5',
    price: 79,
    category: 'Gaming',
    details: '16000 DPI sensor, programmable buttons, lightweight design.',
  },
  {
    id: '6',
    title: 'USB-C Hub',
    description: 'Multi-port connectivity hub',
    image: 'https://picsum.photos/400/300?random=6',
    price: 49,
    category: 'Accessories',
    details: '7 ports, fast data transfer, compact design.',
  },
]
