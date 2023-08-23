import faker from 'faker';

function generateMockProduct() {
  return {
    title: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: parseFloat(faker.commerce.price()),
    thumbnail: faker.image.imageUrl(),
    code: faker.random.alphaNumeric(7),
    stock: faker.random.number({ min: 0, max: 100 }),
    status: true,
    category: faker.commerce.department(),
    thumbnails: Array.from({ length: 3 }, () => faker.image.imageUrl()),
  };
}

export function generateMockProducts(n = 100) {
  return Array.from({ length: n }, generateMockProduct);
}
