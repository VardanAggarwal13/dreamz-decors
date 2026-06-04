import ProductCard from './ProductCard';

export default function ProductGrid({ products = [], columns = 4 }) {
  const cols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }[columns] || 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div className={`grid gap-x-4 gap-y-10 ${cols}`}>
      {products.map((p) => (
        <ProductCard key={p.id || p.slug} product={p} />
      ))}
    </div>
  );
}
