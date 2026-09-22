import ProductCard from './ProductCard';

export default function ProductGrid({ products = [], columns = 4, layout = 'default' }) {
  const cols = {
    2: 'grid-cols-2 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }[columns] || 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div className={`grid items-stretch gap-3 sm:gap-5 lg:gap-6 ${cols}`}>
      {products.map((product) => (
        <ProductCard key={product.id || product.slug} product={product} layout={layout} />
      ))}
    </div>
  );
}

