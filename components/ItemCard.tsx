import Link from 'next/link'
import Image from 'next/image'
import { Item } from '@/lib/data/items'

interface ItemCardProps {
  item: Item
}

export default function ItemCard({ item }: ItemCardProps) {
  return (
    <Link href={`/dashboard/${item.id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden cursor-pointer h-full">
        {/* Image Container */}
        <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
          <Image
            src={item.image}
            alt={item.title}
            width={300}
            height={200}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 right-2 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
            {item.category}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
            {item.title}
          </h3>

          <p className="text-gray-600 text-sm line-clamp-2">
            {item.description}
          </p>

          <div className="flex justify-between items-end pt-2 border-t">
            <span className="text-2xl font-bold text-indigo-600">
              ${item.price}
            </span>
            <span className="text-blue-500 hover:text-blue-700 font-semibold text-sm">
              View Details →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
