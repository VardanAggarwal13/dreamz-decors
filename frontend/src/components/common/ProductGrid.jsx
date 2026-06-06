import ProductCard from './ProductCard';

export default function ProductGrid({ products = [], columns = 4, layout = 'default' }) {
  const cols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div className={`grid items-stretch gap-x-4 gap-y-6 sm:gap-y-10 ${cols}`}>
      {products.map((product) => (
        <ProductCard key={product.id || product.slug} product={product} layout={layout} />
      ))}
    </div>
  );
}
